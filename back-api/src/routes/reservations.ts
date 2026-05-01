import { Hono } from 'hono'
import { z } from 'zod'
import type mysql from 'mysql2/promise'
import type { AppEnv } from '../types.js'
import { pool } from '../db/client.js'
import { AppError } from '../lib/errors.js'
import { successResponse } from '../lib/response.js'
import { sendReservationEmail } from '../lib/email.js'
import { checkRateLimit } from '../lib/rateLimit.js'

export const reservationsRouter = new Hono<AppEnv>()

const TICKET_PRICES = {
  general: 1800,
  university: 1600,
  highschool: 1400,
  child: 1000,
} as const

const TICKET_LABELS = {
  general: '一般',
  university: '大学生',
  highschool: '高校生以下',
  child: '子供',
} as const

type TicketType = keyof typeof TICKET_PRICES

function generateReservationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function getQrCodeUrl(code: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}&format=png`
}

function toJstString(d: Date): string {
  return d.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return email
  const visible = email.slice(0, Math.min(2, at))
  return `${visible}***${email.slice(at)}`
}

// POST /api/reservations/quote
reservationsRouter.post('/reservations/quote', async (c) => {
  const requestId = c.get('requestId')
  const body = await c.req.json().catch(() => { throw new AppError('VALIDATION_ERROR', 'Invalid JSON') })

  const schema = z.object({
    scheduleId: z.number().int().positive(),
    ticketCounts: z.object({
      general: z.number().int().min(0),
      university: z.number().int().min(0),
      highschool: z.number().int().min(0),
      child: z.number().int().min(0),
    }),
  })
  const { ticketCounts } = schema.parse(body)

  const ticketCount = Object.values(ticketCounts).reduce((a, b) => a + b, 0)
  const totalPrice =
    ticketCounts.general * TICKET_PRICES.general +
    ticketCounts.university * TICKET_PRICES.university +
    ticketCounts.highschool * TICKET_PRICES.highschool +
    ticketCounts.child * TICKET_PRICES.child

  return c.json(successResponse({ ticketCount, totalPrice }, requestId))
})

// GET /api/reservations/schedules/:scheduleId/seats
reservationsRouter.get('/reservations/schedules/:scheduleId/seats', async (c) => {
  const requestId = c.get('requestId')
  const scheduleId = Number(c.req.param('scheduleId'))

  if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
    throw new AppError('VALIDATION_ERROR', 'Invalid scheduleId')
  }

  const [schedRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT sch.id, sch.screen_id FROM schedules sch WHERE sch.id = ? AND sch.is_public = 1`,
    [scheduleId],
  )
  if (schedRows.length === 0) throw new AppError('NOT_FOUND', 'Schedule not found')
  const screenId = schedRows[0].screen_id as number

  const [layoutRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, layout_version, background_image_url, aspect_ratio_width, aspect_ratio_height
     FROM screen_seat_layouts WHERE screen_id = ?`,
    [screenId],
  )
  if (layoutRows.length === 0) throw new AppError('NOT_FOUND', 'Seat layout not found')
  const layout = layoutRows[0]

  const [seatRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT
       s.id as seat_id, s.row_label, s.col_no,
       s.position_top_pct, s.position_left_pct,
       s.seat_width_pct, s.seat_height_pct, s.hit_radius_pct,
       CASE
         WHEN rs.id IS NOT NULL THEN 'reserved'
         ELSE 'available'
       END as status
     FROM seats s
     LEFT JOIN reservation_seats rs ON rs.schedule_id = ? AND rs.seat_id = s.id
     LEFT JOIN reservations r ON r.id = rs.reservation_id AND r.status = 'confirmed'
     WHERE s.screen_id = ?
     ORDER BY s.row_label, s.col_no`,
    [scheduleId, screenId],
  )

  return c.json(
    successResponse({
      scheduleId,
      layout: {
        screenId,
        layoutVersion: layout.layout_version as number,
        backgroundImageUrl: layout.background_image_url as string,
        aspectRatio: `${layout.aspect_ratio_width}/${layout.aspect_ratio_height}`,
      },
      seats: seatRows.map(r => ({
        seatId: r.seat_id as number,
        row: r.row_label as string,
        col: r.col_no as number,
        positionTopPct: Number(r.position_top_pct),
        positionLeftPct: Number(r.position_left_pct),
        seatWidthPct: Number(r.seat_width_pct),
        seatHeightPct: Number(r.seat_height_pct),
        hitRadiusPct: r.hit_radius_pct != null ? Number(r.hit_radius_pct) : null,
        status: r.status as 'available' | 'reserved',
      })),
    }, requestId),
  )
})

// POST /api/reservations
reservationsRouter.post('/reservations', async (c) => {
  const requestId = c.get('requestId')
  const session = c.get('session')
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'

  const rlKey = session ? `res:member:${session.memberId}` : `res:ip:${ip}`
  if (!checkRateLimit(rlKey, 20, 5 * 60 * 1000)) {
    throw new AppError('RESERVATION_LIMIT_EXCEEDED', 'Too many reservation attempts')
  }

  const body = await c.req.json().catch(() => { throw new AppError('VALIDATION_ERROR', 'Invalid JSON') })

  const schema = z.object({
    scheduleId: z.number().int().positive(),
    layoutVersion: z.number().int().positive(),
    seatIds: z.array(z.number().int().positive()).min(1).max(8),
    bookingType: z.enum(['member', 'guest']),
    tickets: z.array(z.object({
      seatId: z.number().int().positive(),
      ticketType: z.enum(['general', 'university', 'highschool', 'child']),
    })).min(1).max(8),
    customer: z.object({
      name: z.string().min(1).max(100),
      email: z.string().email().max(254),
    }),
  })

  const data = schema.parse(body)

  // seatIds と tickets[].seatId が一致することを確認
  const seatIdSet = new Set(data.seatIds)
  const ticketSeatIdSet = new Set(data.tickets.map(t => t.seatId))
  if (seatIdSet.size !== ticketSeatIdSet.size || ![...seatIdSet].every(id => ticketSeatIdSet.has(id))) {
    throw new AppError('VALIDATION_ERROR', 'seatIds and tickets[].seatId must match')
  }

  // 会員予約はセッション必須
  if (data.bookingType === 'member' && !session) {
    throw new AppError('UNAUTHORIZED', 'Login required for member booking')
  }
  const memberId = session?.memberId ?? null

  // スケジュール取得
  const [schedRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT sch.id, sch.screen_id, m.title as movie_title,
            sc.name as screen_name, sch.starts_at, sch.ends_at
     FROM schedules sch
     JOIN movies m ON m.id = sch.movie_id
     JOIN screens sc ON sc.id = sch.screen_id
     WHERE sch.id = ? AND sch.is_public = 1`,
    [data.scheduleId],
  )
  if (schedRows.length === 0) throw new AppError('NOT_FOUND', 'Schedule not found')
  const sched = schedRows[0]

  // レイアウトバージョン検証
  const [layoutRows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT layout_version FROM screen_seat_layouts WHERE screen_id = ?',
    [sched.screen_id],
  )
  if (layoutRows.length === 0 || (layoutRows[0].layout_version as number) !== data.layoutVersion) {
    throw new AppError('SEAT_LAYOUT_VERSION_MISMATCH', 'Seat layout updated. Please refresh the seat map.')
  }

  // 座席情報取得（メール用）
  const placeholders = data.seatIds.map(() => '?').join(',')
  const [seatInfoRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, row_label, col_no FROM seats WHERE id IN (${placeholders})`,
    data.seatIds,
  )
  const seatInfoMap = new Map(seatInfoRows.map(s => [s.id as number, s]))

  // 合計金額
  const totalPrice = data.tickets.reduce((sum, t) => sum + TICKET_PRICES[t.ticketType], 0)

  // 予約コード生成（衝突時リトライ）
  let reservationCode = ''
  for (let i = 0; i < 5; i++) {
    const candidate = generateReservationCode()
    const [existing] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM reservations WHERE reservation_code = ?', [candidate],
    )
    if (existing.length === 0) { reservationCode = candidate; break }
  }
  if (!reservationCode) throw new AppError('INTERNAL_SERVER_ERROR', 'Failed to generate reservation code')

  // トランザクション
  const conn = await pool.getConnection()
  await conn.beginTransaction()
  let reservationId: number
  try {
    const [resResult] = await conn.execute<mysql.ResultSetHeader>(
      `INSERT INTO reservations
         (reservation_code, schedule_id, member_id, booking_type, customer_name, customer_email, total_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reservationCode, data.scheduleId, memberId, data.bookingType, data.customer.name, data.customer.email, totalPrice],
    )
    reservationId = resResult.insertId

    for (const ticket of data.tickets) {
      await conn.execute(
        `INSERT INTO reservation_seats (reservation_id, schedule_id, seat_id, ticket_type, price)
         VALUES (?, ?, ?, ?, ?)`,
        [reservationId, data.scheduleId, ticket.seatId, ticket.ticketType, TICKET_PRICES[ticket.ticketType]],
      )
    }
    await conn.commit()
  } catch (err: unknown) {
    await conn.rollback()
    if ((err as { errno?: number }).errno === 1062) {
      throw new AppError('SEAT_ALREADY_RESERVED', 'One or more seats are already reserved')
    }
    throw err
  } finally {
    conn.release()
  }

  const qrCodeUrl = getQrCodeUrl(reservationCode)

  // 予約完了メール非同期送信
  const seatList = data.tickets.map(t => {
    const info = seatInfoMap.get(t.seatId)
    return `  ${info?.row_label ?? '?'}-${info?.col_no ?? '?'}  ${TICKET_LABELS[t.ticketType]}  ${TICKET_PRICES[t.ticketType].toLocaleString()}円`
  }).join('\n')

  sendReservationEmail({
    to: data.customer.email,
    customerName: data.customer.name,
    reservationCode,
    movieTitle: sched.movie_title as string,
    startsAtJst: toJstString(new Date(sched.starts_at as string)),
    endsAtJst: toJstString(new Date(sched.ends_at as string)),
    screenName: sched.screen_name as string,
    seatList,
    totalPrice,
    qrCodeUrl,
    reservationDetailUrl: `${process.env.BASE_URL ?? 'http://localhost:5173'}/reservations/r/${reservationCode}`,
  }).catch(err => console.error('[EMAIL]', err))

  return c.json(successResponse({ reservationId, reservationCode, totalPrice, qrCodeUrl }, requestId), 201)
})

// GET /api/reservations/:reservationCode
reservationsRouter.get('/reservations/:reservationCode', async (c) => {
  const requestId = c.get('requestId')
  const code = c.req.param('reservationCode').toUpperCase()

  if (!/^[A-Z0-9]{8,12}$/.test(code)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid reservation code format')
  }

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT r.id, r.reservation_code, r.status, r.member_id, r.booking_type,
            r.customer_name, r.customer_email, r.total_price,
            m.title as movie_title, m.thumbnail_url,
            sch.starts_at, sch.ends_at,
            sc.name as screen_name
     FROM reservations r
     JOIN schedules sch ON sch.id = r.schedule_id
     JOIN movies m ON m.id = sch.movie_id
     JOIN screens sc ON sc.id = sch.screen_id
     WHERE r.reservation_code = ?`,
    [code],
  )
  if (rows.length === 0) throw new AppError('NOT_FOUND', 'Reservation not found')

  const r = rows[0]
  const [seatRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT s.row_label, s.col_no, rs.ticket_type, rs.price
     FROM reservation_seats rs
     JOIN seats s ON s.id = rs.seat_id
     WHERE rs.reservation_id = ?
     ORDER BY s.row_label, s.col_no`,
    [r.id],
  )

  const startsAt = new Date(r.starts_at as string)
  const canCancel = r.status === 'confirmed' && (startsAt.getTime() - Date.now()) > 30 * 60 * 1000

  return c.json(
    successResponse({
      reservationCode: r.reservation_code as string,
      status: r.status as string,
      canCancel,
      movie: { title: r.movie_title as string, thumbnailUrl: r.thumbnail_url as string | null },
      schedule: {
        startsAt: r.starts_at,
        endsAt: r.ends_at,
        screenName: r.screen_name as string,
      },
      seats: seatRows.map(s => ({
        row: s.row_label as string,
        col: s.col_no as number,
        ticketType: s.ticket_type as string,
        price: s.price as number,
      })),
      totalPrice: r.total_price as number,
      customer: { name: r.customer_name as string, maskedEmail: maskEmail(r.customer_email as string) },
      qrCodeUrl: r.status === 'confirmed' ? getQrCodeUrl(r.reservation_code as string) : null,
    }, requestId),
  )
})

// POST /api/reservations/:reservationCode/cancel
reservationsRouter.post('/reservations/:reservationCode/cancel', async (c) => {
  const requestId = c.get('requestId')
  const session = c.get('session')
  const code = c.req.param('reservationCode').toUpperCase()

  if (!/^[A-Z0-9]{8,12}$/.test(code)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid reservation code format')
  }

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT r.id, r.member_id, r.booking_type, r.customer_email, r.status, sch.starts_at
     FROM reservations r JOIN schedules sch ON sch.id = r.schedule_id
     WHERE r.reservation_code = ?`,
    [code],
  )
  if (rows.length === 0) throw new AppError('NOT_FOUND', 'Reservation not found')

  const r = rows[0]
  if (r.status === 'cancelled') throw new AppError('ALREADY_CANCELLED', 'Already cancelled')

  if ((new Date(r.starts_at as string).getTime() - Date.now()) <= 30 * 60 * 1000) {
    throw new AppError('CANCELLATION_NOT_ALLOWED', 'Cancellation not allowed within 30 minutes of showtime')
  }

  if (r.booking_type === 'member') {
    if (!session || session.memberId !== (r.member_id as number)) {
      throw new AppError('FORBIDDEN', 'Not authorized to cancel this reservation')
    }
  } else {
    const body = await c.req.json().catch(() => ({ email: '' }))
    const { email } = z.object({ email: z.string().email() }).parse(body)
    if (email.toLowerCase() !== (r.customer_email as string).toLowerCase()) {
      throw new AppError('FORBIDDEN', 'Email does not match reservation')
    }
  }

  await pool.execute('UPDATE reservations SET status = ? WHERE id = ?', ['cancelled', r.id])

  return c.json(successResponse({ reservationCode: code, status: 'cancelled' }, requestId))
})