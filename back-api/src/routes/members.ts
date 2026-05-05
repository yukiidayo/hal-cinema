import { Hono } from 'hono'
import { z } from 'zod'
import type mysql from 'mysql2/promise'
import type { AppEnv } from '../types.js'
import { pool } from '../db/client.js'
import { AppError } from '../lib/errors.js'
import { successResponse } from '../lib/response.js'

export const membersRouter = new Hono<AppEnv>()

const createMemberSchema = z.object({
  email: z.string().email().max(254),
})

type MemberRow = { id: number; email: string }

membersRouter.post('/members', async (c) => {
  const requestId = c.get('requestId')
  const body = await c.req.json().catch(() => {
    throw new AppError('VALIDATION_ERROR', 'Invalid JSON body')
  })
  const { email } = createMemberSchema.parse(body)

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT id, email FROM members WHERE email = ?',
    [email],
  )

  if (rows.length > 0) {
    const row = rows[0] as MemberRow
    return c.json(
      successResponse({ memberId: row.id, email: row.email, isNew: false }, requestId),
      200,
    )
  }

  const [result] = await pool.execute<mysql.ResultSetHeader>(
    'INSERT INTO members (email) VALUES (?)',
    [email],
  )

  return c.json(
    successResponse({ memberId: result.insertId, email, isNew: true }, requestId),
    201,
  )
})

// GET /api/members/profile
membersRouter.get('/members/profile', async (c) => {
  const session = c.get('session')
  const requestId = c.get('requestId')
  if (!session) throw new AppError('UNAUTHORIZED', 'Not authenticated')

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT id, email, name FROM members WHERE id = ?',
    [session.memberId],
  )
  if (rows.length === 0) throw new AppError('NOT_FOUND', 'Member not found')

  const r = rows[0]
  return c.json(
    successResponse({
      id: r.id,
      email: r.email,
      name: r.name,
    }, requestId),
  )
})

// GET /api/members/reservations
membersRouter.get('/members/reservations', async (c) => {
  const session = c.get('session')
  const requestId = c.get('requestId')
  if (!session) throw new AppError('UNAUTHORIZED', 'Not authenticated')

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT r.reservation_code, r.status, r.total_price, r.created_at,
            m.title as movie_title, m.thumbnail_url,
            sch.starts_at, sch.ends_at, sc.name as screen_name
     FROM reservations r
     JOIN schedules sch ON sch.id = r.schedule_id
     JOIN movies m ON m.id = sch.movie_id
     JOIN screens sc ON sc.id = sch.screen_id
     WHERE r.member_id = ?
     ORDER BY r.created_at DESC`,
    [session.memberId]
  )

  return c.json(successResponse({
    items: rows.map(r => ({
      reservationCode: r.reservation_code,
      status: r.status,
      totalPrice: r.total_price,
      createdAt: r.created_at,
      movieTitle: r.movie_title,
      thumbnailUrl: r.thumbnail_url,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      screenName: r.screen_name,
    }))
  }, requestId))
})

