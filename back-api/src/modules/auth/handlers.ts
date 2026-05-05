import type { Context } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '#types.js'
import { AppError } from '#lib/errors.js'
import { successResponse } from '#utils/response.js'
import { sendOtpEmail } from '#lib/email.js'
import { createSession, destroySession } from '#middleware/session.js'
import { checkRateLimit } from '#utils/rateLimit.js'
import { OTP_CONFIG } from '#config/constants.js'
import * as AuthService from '#modules/auth/service.js'

const sendOtpSchema = z.object({
  email: z.string().email().max(254),
  type: z.enum(['login', 'register']),
})

const verifyOtpSchema = z.object({
  email: z.string().email().max(254),
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  type: z.enum(['login', 'register']),
})

export const getMe = (c: Context<AppEnv>) => {
  const session = c.get('session')
  const requestId = c.get('requestId')
  if (!session) return c.json(successResponse({ authenticated: false }, requestId), 200)
  return c.json(successResponse({ authenticated: true, memberId: session.memberId }, requestId), 200)
}

export const sendOtp = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'

  const body = await c.req.json().catch(() => { throw new AppError('VALIDATION_ERROR', 'Invalid JSON body') })
  const { email, type } = sendOtpSchema.parse(body)

  if (!checkRateLimit(`otp:send:ip:${ip}`, 5, 10 * 60 * 1000)) {
    throw new AppError('OTP_RESEND_COOLDOWN', 'Too many requests from this IP')
  }
  if (!checkRateLimit(`otp:send:email:${email}`, 3, 10 * 60 * 1000)) {
    throw new AppError('OTP_RESEND_COOLDOWN', 'Too many OTP requests for this email')
  }

  const memberId = await AuthService.getOrCreateMember(email)
  await AuthService.checkOtpCooldown(memberId, type)
  const otp = await AuthService.issueOtp(memberId, type)

  console.log(`[OTP] email=${email} type=${type} code=${otp}`)
  await sendOtpEmail(email, otp)

  return c.json(
    successResponse({ expiresInSec: OTP_CONFIG.EXPIRES_MIN * 60, resendAfterSec: OTP_CONFIG.RESEND_SEC }, requestId),
    200,
  )
}

export const verifyOtp = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'

  const body = await c.req.json().catch(() => { throw new AppError('VALIDATION_ERROR', 'Invalid JSON body') })
  const { email, code, type } = verifyOtpSchema.parse(body)

  if (!checkRateLimit(`otp:verify:ip:${ip}`, 10, 10 * 60 * 1000)) {
    throw new AppError('OTP_ATTEMPTS_EXCEEDED', 'Too many verification attempts from this IP')
  }
  if (!checkRateLimit(`otp:verify:email:${email}`, 5, 10 * 60 * 1000)) {
    throw new AppError('OTP_ATTEMPTS_EXCEEDED', 'Too many verification attempts for this email')
  }

  const memberId = await AuthService.verifyOtpCode(email, code, type)
  createSession(c, { memberId })

  return c.json(successResponse({ memberId, authenticated: true }, requestId), 200)
}

export const logout = (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const session = c.get('session')
  if (!session) throw new AppError('UNAUTHORIZED', 'Not authenticated')
  destroySession(c)
  return c.json(successResponse({ loggedOut: true }, requestId), 200)
}
