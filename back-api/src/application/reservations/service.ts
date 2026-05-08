import { AppError } from '#lib/errors.js'
import { TICKET_PRICES, type TicketType } from '#config/constants.js'
import {
  hasDuplicateSeatIds,
  seatIdsMatchTickets,
  type ReservationTicketInput,
} from '#domain/reservations/policies.js'
import * as reservationsInfra from '#infrastructure/mysql/reservations.repository.js'

export type SeatLayout = reservationsInfra.SeatLayout
export type SeatInfo = reservationsInfra.SeatInfo
export type ReservationForCancel = reservationsInfra.ReservationForCancel

export function getSeatsForSchedule(scheduleId: number) {
  return reservationsInfra.getSeatsForSchedule(scheduleId)
}

export function getReservationDetail(code: string) {
  return reservationsInfra.getReservationDetail(code)
}

export function getReservationForCancel(code: string) {
  return reservationsInfra.getReservationForCancel(code)
}

export function cancelReservation(reservationId: number) {
  return reservationsInfra.cancelReservation(reservationId)
}

export function checkLayoutVersion(screenId: number, layoutVersion: number) {
  return reservationsInfra.checkLayoutVersion(screenId, layoutVersion)
}

export function getSeatsInScreen(
  seatIds: number[],
  screenId: number,
) {
  return reservationsInfra.getSeatsInScreen(seatIds, screenId)
}

export function holdSeats(
  scheduleId: number,
  seatIds: number[],
) {
  if (hasDuplicateSeatIds(seatIds)) {
    throw new AppError('VALIDATION_ERROR', 'Duplicate seat IDs')
  }
  return reservationsInfra.holdSeats(scheduleId, seatIds)
}

type FinalizeReservationInput = {
  reservationCode?: string
  scheduleId: number
  memberId: number | null
  bookingType: 'member' | 'guest'
  customer: { name: string; email: string }
  tickets: { seatId: number; ticketType: TicketType }[]
  seatIds: number[]
}

export function finalizeReservation(params: FinalizeReservationInput) {
  const { seatIds, tickets } = params

  if (hasDuplicateSeatIds(seatIds)) {
    throw new AppError('VALIDATION_ERROR', 'Duplicate seat IDs')
  }

  const ticketSeatIds = tickets.map(ticket => ticket.seatId)
  if (hasDuplicateSeatIds(ticketSeatIds)) {
    throw new AppError('VALIDATION_ERROR', 'Duplicate ticket seat IDs')
  }

  if (!seatIdsMatchTickets(seatIds, tickets as ReservationTicketInput[])) {
    throw new AppError('VALIDATION_ERROR', 'seatIds and tickets.seatId must match exactly')
  }

  const pricedTickets = tickets.map(ticket => ({
    ...ticket,
    // Domain invariant: every ticket type used for finalize must have price config.
    price: TICKET_PRICES[ticket.ticketType],
  }))
  if (pricedTickets.some(ticket => typeof ticket.price !== 'number')) {
    throw new AppError('VALIDATION_ERROR', 'Invalid ticket type')
  }

  return reservationsInfra.finalizeReservation({
    reservationCode: params.reservationCode,
    scheduleId: params.scheduleId,
    memberId: params.memberId,
    bookingType: params.bookingType,
    customer: params.customer,
    tickets: params.tickets,
  })
}
