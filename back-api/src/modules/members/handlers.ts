import type { Context } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../../types.js'
import { AppError } from '../../lib/errors.js'
import { successResponse } from '../../utils/response.js'
import * as MemberService from './service.js'

const createMemberSchema = z.object({
  email: z.string().email().max(254),
})

export const createMember = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const body = await c.req.json().catch(() => { throw new AppError('VALIDATION_ERROR', 'Invalid JSON body') })
  const { email } = createMemberSchema.parse(body)

  const existing = await MemberService.findMemberByEmail(email)
  if (existing) {
    return c.json(successResponse({ memberId: existing.id, email: existing.email, isNew: false }, requestId), 200)
  }

  const member = await MemberService.createMember(email)
  return c.json(successResponse({ memberId: member.id, email: member.email, isNew: true }, requestId), 201)
}

export const getProfile = async (c: Context<AppEnv>) => {
  const session = c.get('session')
  const requestId = c.get('requestId')
  if (!session) throw new AppError('UNAUTHORIZED', 'Not authenticated')

  const profile = await MemberService.getMemberProfile(session.memberId)
  if (!profile) throw new AppError('NOT_FOUND', 'Member not found')

  return c.json(successResponse({ id: profile.id, email: profile.email, name: profile.name }, requestId))
}

export const getReservations = async (c: Context<AppEnv>) => {
  const session = c.get('session')
  const requestId = c.get('requestId')
  if (!session) throw new AppError('UNAUTHORIZED', 'Not authenticated')

  const items = await MemberService.getMemberReservations(session.memberId)
  return c.json(successResponse({ items }, requestId))
}
