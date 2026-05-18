import { useState, useEffect } from "react"
import { apiFetch } from "~/shared/api/client"
import { useReservationFlow } from "~/processes/reservation-flow/context"
import { TICKET_PRICES } from "~/entities/ticket"

type ScheduleInfo = {
  movieTitle: string
  screenName: string
  startsAt: string
  endsAt: string
}

export function useConfirm() {
  const { state } = useReservationFlow()
  const [schedInfo, setSchedInfo] = useState<ScheduleInfo | null>(null)

  useEffect(() => {
    if (!state.scheduleId) return
    apiFetch<ScheduleInfo>(`/schedules/${state.scheduleId}`).then(setSchedInfo).catch(() => {})
  }, [state.scheduleId])

  const totalPrice = state.selectedSeats?.reduce((sum, s) => sum + TICKET_PRICES[s.ticketType], 0) ?? 0

  return { schedInfo, customer: state.customer, seats: state.selectedSeats, totalPrice }
}
