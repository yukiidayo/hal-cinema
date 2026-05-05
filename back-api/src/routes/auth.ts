import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types.js'
import { pool } from '../db/client.js'
import { AppError } from '../lib/errors.js'
import { successResponse } from '../lib/response.js'
import { generateOtp, hashOtp } from '../lib/otp.js'
import { sendOtpEmail } from '../lib/email.js'
import { createSession, destroySession } from '../middleware/session.js'
import { checkRateLimit } from '../lib/rateLimit.js'
import { OTP_CONFIG } from '../shared/constants.js'
import type mysql from 'mysql2/promise'

export const authRouter = new Hono<AppEnv>()

const sendOtpSchema = z.object({
  email: z.string().email().max(254),
  type: z.enum(['login', 'register']),
})

const verifyOtpSchema = z.object({
  email: z.string().email().max(254),
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  type: z.enum(['login', 'register']),
})

// GET /api/auth/me
authRouter.get('/auth/me', (c) => {
  const session = c.get('session')
  const requestId = c.get('requestId')
  if (!session) {
    return c.json(successResponse({ authenticated: false }, requestId), 200)
  }
  return c.json(successResponse({ authenticated: true, memberId: session.memberId }, requestId), 200)
})

// POST /api/auth/otp/send
authRouter.post('/auth/otp/send', async (c) => {
  const requestId = c.get('requestId')
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'

  const body = await c.req.json().catch(() => {
    throw new AppError('VALIDATION_ERROR', 'Invalid JSON body')
  })
  const { email, type } = sendOtpSchema.parse(body)

  if (!checkRateLimit(`otp:send:ip:${ip}`, 5, 10 * 60 * 1000)) {
    throw new AppError('OTP_RESEND_COOLDOWN', 'Too many requests from this IP')
  }
  if (!checkRateLimit(`otp:send:email:${email}`, 3, 10 * 60 * 1000)) {
    throw new AppError('OTP_RESEND_COOLDOWN', 'Too many OTP requests for this email')
  }

  let memberId: number
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT id FROM members WHERE email = ?',
    [email],
  )
  if (rows.length > 0) {
    memberId = rows[0].id as number
  } else {
    const [res] = await pool.execute<mysql.ResultSetHeader>(
      'INSERT INTO members (email) VALUES (?)',
      [email],
    )
    memberId = res.insertId
  }

  const [recent] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id FROM otp_tokens
     WHERE member_id = ? AND purpose = ? AND created_at > DATE_SUB(NOW(3), INTERVAL ? SECOND)
     LIMIT 1`,
    [memberId, type, OTP_CONFIG.RESEND_SEC],
  )
  if (recent.length > 0) {
    throw new AppError('OTP_RESEND_COOLDOWN', `Wait ${OTP_CONFIG.RESEND_SEC} seconds before resending`)
  }

  const otp = generateOtp()
  const tokenHash = hashOtp(otp)
  const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRES_MIN * 60 * 1000)
  console.log(`[OTP] email=${email} type=${type} code=${otp}`)

  await pool.execute(
    `INSERT INTO otp_tokens (member_id, token_hash, purpose, expires_at)
     VALUES (?, ?, ?, ?)`,
    [memberId, tokenHash, type, expiresAt],
  )

  await sendOtpEmail(email, otp)

  return c.json(
    successResponse(
      { expiresInSec: OTP_CONFIG.EXPIRES_MIN * 60, resendAfterSec: OTP_CONFIG.RESEND_SEC },
      requestId,
    ),
    200,
  )
})

// POST /api/auth/otp/verify
authRouter.post('/auth/otp/verify', async (c) => {
  const requestId = c.get('requestId')
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'

  const body = await c.req.json().catch(() => {
    throw new AppError('VALIDATION_ERROR', 'Invalid JSON body')
  })
  const { email, code, type } = verifyOtpSchema.parse(body)

  if (!checkRateLimit(`otp:verify:ip:${ip}`, 10, 10 * 60 * 1000)) {
    throw new AppError('OTP_ATTEMPTS_EXCEEDED', 'Too many verification attempts from this IP')
  }
  if (!checkRateLimit(`otp:verify:email:${email}`, 5, 10 * 60 * 1000)) {
    throw new AppError('OTP_ATTEMPTS_EXCEEDED', 'Too many verification attempts for this email')
  }

  const [memberRows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT id FROM members WHERE email = ?',
    [email],
  )
  if (memberRows.length === 0) {
    throw new AppError('OTP_INVALID', 'Invalid OTP')
  }
  const memberId = memberRows[0].id as number

  const [tokenRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, token_hash, expires_at, used_at, failed_attempts, locked_until
     FROM otp_tokens
     WHERE member_id = ? AND purpose = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [memberId, type],
  )

  if (tokenRows.length === 0) {
    throw new AppError('OTP_INVALID', 'Invalid OTP')
  }

  const token = tokenRows[0]

  if (token.locked_until && new Date(token.locked_until) > new Date()) {
    throw new AppError('OTP_ATTEMPTS_EXCEEDED', `Account locked until ${token.locked_until}`)
  }

  if (new Date(token.expires_at) < new Date()) {
    throw new AppError('OTP_EXPIRED', 'OTP has expired')
  }

  if (token.used_at) {
    throw new AppError('OTP_INVALID', 'OTP already used')
  }

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

  createSession(c, { memberId })

  return c.json(
    successResponse({ memberId, authenticated: true }, requestId),
    200,
  )
})

// POST /api/auth/logout
authRouter.post('/auth/logout', (c) => {
  const requestId = c.get('requestId')
  const session = c.get('session')
  if (!session) {
    throw new AppError('UNAUTHORIZED', 'Not authenticated')
  }
  destroySession(c)
  return c.json(successResponse({ loggedOut: true }, requestId), 200)
})
