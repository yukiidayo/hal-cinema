import type mysql from 'mysql2/promise'
import { pool } from '../db/client.js'
import { AppError } from '../lib/errors.js'
import { generateReservationCode } from '../lib/utils.js'
import { RESERVATION_CONFIG, TICKET_PRICES, type TicketType } from '../shared/constants.js'

export class ReservationService {
  static async holdSeats(scheduleId: number, seatIds: number[]): Promise<{ reservationCode: string, expiresAt: Date }> {
    let reservationCode = ''
    for (let i = 0; i < 5; i++) {
      const candidate = generateReservationCode()
      const [existing] = await pool.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM reservations WHERE reservation_code = ?', [candidate],
      )
      if (existing.length === 0) { reservationCode = candidate; break }
    }
    if (!reservationCode) throw new AppError('INTERNAL_SERVER_ERROR', 'Failed to generate reservation code')

    const expiresAt = new Date(Date.now() + RESERVATION_CONFIG.HOLD_EXPIRES_MIN * 60 * 1000)

    const conn = await pool.getConnection()
    await conn.beginTransaction()
    try {
      const placeholders = seatIds.map(() => '?').join(',')
      
      // Cleanup expired pending seats
      await conn.execute(
        `DELETE rs FROM reservation_seats rs
         JOIN reservations r ON r.id = rs.reservation_id
         WHERE rs.schedule_id = ? AND rs.seat_id IN (${placeholders})
         AND r.status = 'pending' AND r.expires_at <= CURRENT_TIMESTAMP(3)`,
        [scheduleId, ...seatIds]
      )

      // Conflict check
      const [conflicts] = await conn.execute<mysql.RowDataPacket[]>(
        `SELECT rs.seat_id FROM reservation_seats rs
         JOIN reservations r ON r.id = rs.reservation_id
         WHERE rs.schedule_id = ? AND rs.seat_id IN (${placeholders})
         AND (r.status = 'confirmed' OR (r.status = 'pending' AND r.expires_at > CURRENT_TIMESTAMP(3)))
         FOR UPDATE`,
        [scheduleId, ...seatIds]
      )

      if (conflicts.length > 0) {
        throw new AppError('SEAT_ALREADY_RESERVED', 'One or more seats are already reserved or held')
      }

      const [resResult] = await conn.execute<mysql.ResultSetHeader>(
        `INSERT INTO reservations (reservation_code, schedule_id, status, expires_at, total_price)
         VALUES (?, ?, 'pending', ?, 0)`,
        [reservationCode, scheduleId, expiresAt]
      )
      const reservationId = resResult.insertId

      for (const seatId of seatIds) {
        await conn.execute(
          `INSERT INTO reservation_seats (reservation_id, schedule_id, seat_id, ticket_type, price)
           VALUES (?, ?, ?, 'general', 0)`,
          [reservationId, scheduleId, seatId]
        )
      }

      await conn.commit()
      return { reservationCode, expiresAt }
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  }

  static async finalizeReservation(params: {
    reservationCode?: string
    scheduleId: number
    memberId: number | null
    bookingType: 'member' | 'guest'
    customer: { name: string, email: string }
    tickets: { seatId: number, ticketType: TicketType }[]
    seatIds: number[]
  }): Promise<{ reservationId: number, reservationCode: string, totalPrice: number }> {
    const { reservationCode, scheduleId, memberId, bookingType, customer, tickets, seatIds } = params
    const totalPrice = tickets.reduce((sum, t) => sum + TICKET_PRICES[t.ticketType as keyof typeof TICKET_PRICES], 0)
    const placeholders = seatIds.map(() => '?').join(',')

    const conn = await pool.getConnection()
    await conn.beginTransaction()
    let reservationId: number
    let finalReservationCode = reservationCode || ''

    try {
      // Final conflict check
      const [conflicts] = await conn.execute<mysql.RowDataPacket[]>(
        `SELECT rs.seat_id FROM reservation_seats rs
         JOIN reservations r ON r.id = rs.reservation_id
         WHERE rs.schedule_id = ? AND rs.seat_id IN (${placeholders})
         AND (r.status = 'confirmed' OR (r.status = 'pending' AND r.expires_at > CURRENT_TIMESTAMP(3)))
         ${reservationCode ? 'AND r.reservation_code <> ?' : ''}
         FOR UPDATE`,
        reservationCode ? [scheduleId, ...seatIds, reservationCode] : [scheduleId, ...seatIds]
      )

      if (conflicts.length > 0) {
        throw new AppError('SEAT_ALREADY_RESERVED', 'One or more seats are already reserved or held')
      }

      if (reservationCode) {
        const [resRows] = await conn.execute<mysql.RowDataPacket[]>(
          `SELECT id FROM reservations 
           WHERE reservation_code = ? AND status = 'pending' AND schedule_id = ?
           FOR UPDATE`,
          [reservationCode, scheduleId]
        )
        if (resRows.length === 0) throw new AppError('NOT_FOUND', 'Valid tentative reservation not found')
        reservationId = resRows[0].id as number

        await conn.execute(
          `UPDATE reservations 
           SET status = 'confirmed', expires_at = NULL, member_id = ?, 
               booking_type = ?, customer_name = ?, customer_email = ?, total_price = ?
           WHERE id = ?`,
          [memberId, bookingType, customer.name, customer.email, totalPrice, reservationId]
        )
        await conn.execute('DELETE FROM reservation_seats WHERE reservation_id = ?', [reservationId])
      } else {
        for (let i = 0; i < 5; i++) {
          const candidate = generateReservationCode()
          const [existing] = await conn.execute<mysql.RowDataPacket[]>(
            'SELECT id FROM reservations WHERE reservation_code = ?', [candidate],
          )
          if (existing.length === 0) { finalReservationCode = candidate; break }
        }
        if (!finalReservationCode) throw new AppError('INTERNAL_SERVER_ERROR', 'Failed to generate reservation code')

        const [resResult] = await conn.execute<mysql.ResultSetHeader>(
          `INSERT INTO reservations
             (reservation_code, schedule_id, member_id, booking_type, customer_name, customer_email, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [finalReservationCode, scheduleId, memberId, bookingType, customer.name, customer.email, totalPrice],
        )
        reservationId = resResult.insertId
      }

      for (const ticket of tickets) {
        await conn.execute(
          `INSERT INTO reservation_seats (reservation_id, schedule_id, seat_id, ticket_type, price)
           VALUES (?, ?, ?, ?, ?)`,
          [reservationId, scheduleId, ticket.seatId, ticket.ticketType, TICKET_PRICES[ticket.ticketType as keyof typeof TICKET_PRICES]],
        )
      }

      await conn.commit()
      return { reservationId, reservationCode: finalReservationCode, totalPrice }
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  }
}
