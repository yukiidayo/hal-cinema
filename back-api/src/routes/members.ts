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
