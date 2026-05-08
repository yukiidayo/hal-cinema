import type { TicketType } from '#config/constants.js'

export type ReservationTicketInput = {
  seatId: number
  ticketType: TicketType
}

export function hasDuplicateSeatIds(seatIds: number[]): boolean {
  return new Set(seatIds).size !== seatIds.length
}

export function seatIdsMatchTickets(
  seatIds: number[],
  tickets: ReservationTicketInput[],
): boolean {
  if (seatIds.length !== tickets.length) return false
  const requested = new Set(seatIds)
  return tickets.every(ticket => requested.has(ticket.seatId))
}
