import type mysql from 'mysql2/promise'
import { pool } from '#db/client.js'
import { AppError } from '#lib/errors.js'
import { generateOtp, hashOtp } from '#utils/otp.js'
import { OTP_CONFIG } from '#config/constants.js'

export async function getOrCreateMember(email: string): Promise<number> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT id FROM members WHERE email = ?',
    [email],
  )
  if (rows.length > 0) return rows[0].id as number

  const [res] = await pool.execute<mysql.ResultSetHeader>(
    'INSERT INTO members (email) VALUES (?)',
    [email],
  )
  return res.insertId
}

export async function checkOtpCooldown(memberId: number, type: string): Promise<void> {
  const [recent] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id FROM otp_tokens
     WHERE member_id = ? AND purpose = ? AND created_at > DATE_SUB(NOW(3), INTERVAL ? SECOND)
     LIMIT 1`,
    [memberId, type, OTP_CONFIG.RESEND_SEC],
  )
  if (recent.length > 0) {
    throw new AppError('OTP_RESEND_COOLDOWN', `Wait ${OTP_CONFIG.RESEND_SEC} seconds before resending`)
  }
}

export async function issueOtp(memberId: number, type: string): Promise<string> {
  const otp = generateOtp()
  const tokenHash = hashOtp(otp)
  const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRES_MIN * 60 * 1000)

  await pool.execute(
    `INSERT INTO otp_tokens (member_id, token_hash, purpose, expires_at) VALUES (?, ?, ?, ?)`,
    [memberId, tokenHash, type, expiresAt],
  )
  return otp
}

export async function verifyOtpCode(email: string, code: string, type: string): Promise<number> {
  const [memberRows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT id FROM members WHERE email = ?',
    [email],
  )
  if (memberRows.length === 0) throw new AppError('OTP_INVALID', 'Invalid OTP')
  const memberId = memberRows[0].id as number

  const [tokenRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, token_hash, expires_at, used_at, failed_attempts, locked_until
     FROM otp_tokens
     WHERE member_id = ? AND purpose = ?
     ORDER BY created_at DESC LIMIT 1`,
    [memberId, type],
  )
  if (tokenRows.length === 0) throw new AppError('OTP_INVALID', 'Invalid OTP')

  const token = tokenRows[0]

  if (token.locked_until && new Date(token.locked_until) > new Date()) {
    throw new AppError('OTP_ATTEMPTS_EXCEEDED', `Account locked until ${token.locked_until}`)
  }
  if (new Date(token.expires_at) < new Date()) throw new AppError('OTP_EXPIRED', 'OTP has expired')
  if (token.used_at) throw new AppError('OTP_INVALID', 'OTP already used')

  const inputHash = hashOtp(code)
  if (inputHash !== token.token_hash) {
    const newFailedAttempts = (token.failed_attempts as number) + 1
    if (newFailedAttempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + OTP_CONFIG.LOCK_MIN * 60 * 1000)
      await pool.execute(
        'UPDATE otp_tokens SET failed_attempts = ?, locked_until = ? WHERE id = ?',
        [newFailedAttempts, lockUntil, token.id],
      )
      throw new AppError('OTP_ATTEMPTS_EXCEEDED', 'Too many failed attempts. Account locked.')
    }
    await pool.execute(
      'UPDATE otp_tokens SET failed_attempts = ? WHERE id = ?',
      [newFailedAttempts, token.id],
    )
    throw new AppError('OTP_INVALID', 'Invalid OTP')
  }

  await pool.execute('UPDATE otp_tokens SET used_at = NOW(3) WHERE id = ?', [token.id])
  return memberId
}
