import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types.js'
import { pool } from '../db/client.js'
import { AppError } from '../lib/errors.js'
import { successResponse } from '../lib/response.js'
import { sendReservationEmail } from '../lib/email.js'
import { checkRateLimit } from '../lib/rateLimit.js'
import { ReservationService } from '../services/reservationService.js'
import { MovieService } from '../services/movieService.js'
import { maskEmail, getQrCodeUrl, toJstString } from '../lib/utils.js'
import { TICKET_LABELS, TICKET_PRICES } from '../shared/constants.js'

export const reservationsRouter = new Hono<AppEnv>()

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

  const sched = await MovieService.getFullScheduleById(scheduleId)
  if (!sched) throw new AppError('NOT_FOUND', 'Schedule not found')

  const [layoutRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, layout_version, background_image_url, aspect_ratio_width, aspect_ratio_height
     FROM screen_seat_layouts WHERE screen_id = ?`,
    [sched.screen_id],
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
     LEFT JOIN reservations r ON r.id = rs.reservation_id 
     AND (r.status = 'confirmed' OR (r.status = 'pending' AND r.expires_at > CURRENT_TIMESTAMP(3)))
     WHERE s.screen_id = ?
     ORDER BY s.row_label, s.col_no`,
    [scheduleId, sched.screen_id],
  )

  return c.json(
    successResponse({
      scheduleId,
      layout: {
        screenId: sched.screen_id,
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

// POST /api/reservations/hold (座席の仮押さえ)
reservationsRouter.post('/reservations/hold', async (c) => {
  const requestId = c.get('requestId')
  const body = await c.req.json().catch(() => { throw new AppError('VALIDATION_ERROR', 'Invalid JSON') })

  const schema = z.object({
    scheduleId: z.number().int().positive(),
    seatIds: z.array(z.number().int().positive()).min(1).max(8),
  })
  const { scheduleId, seatIds } = schema.parse(body)

  const { reservationCode, expiresAt } = await ReservationService.holdSeats(scheduleId, seatIds)

  return c.json(successResponse({ reservationCode, expiresAt: expiresAt.toISOString() }, requestId), 201)
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
    reservationCode: z.string().optional(),
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

  const seatIdSet = new Set(data.seatIds)
  if (seatIdSet.size !== data.seatIds.length) {
    throw new AppError('VALIDATION_ERROR', 'Duplicate seat IDs')
  }

  let memberId: number | null = null
  if (data.bookingType === 'member') {
    if (!session) throw new AppError('UNAUTHORIZED', 'Authentication required for member booking')
    memberId = session.memberId
  }

  const sched = await MovieService.getFullScheduleById(data.scheduleId)
  if (!sched) throw new AppError('NOT_FOUND', 'Schedule not found')

  const [layoutRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT layout_version FROM screen_seat_layouts WHERE screen_id = ?`,
    [sched.screen_id]
  )
  if (layoutRows.length === 0 || layoutRows[0].layout_version !== data.layoutVersion) {
    throw new AppError('SEAT_LAYOUT_VERSION_MISMATCH', 'Seat layout has been updated')
  }

  const placeholders = data.seatIds.map(() => '?').join(',')
  const [seatRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, row_label, col_no FROM seats WHERE id IN (${placeholders}) AND screen_id = ?`,
    [...data.seatIds, sched.screen_id]
  )
  if (seatRows.length !== data.seatIds.length) {
    throw new AppError('VALIDATION_ERROR', 'One or more invalid seat IDs')
  }
  const seatInfoMap = new Map(seatRows.map(s => [s.id as number, s]))

  const { reservationId, reservationCode, totalPrice } = await ReservationService.finalizeReservation({
    ...data,
    memberId
  })

  const qrCodeUrl = getQrCodeUrl(reservationCode)

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
