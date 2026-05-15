import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { apiFetch } from "~/shared/api/client"
import { draft } from "~/entities/reservation/draft"
import { TICKET_PRICES } from "~/entities/ticket"
import { getConfirmGuardIssue } from "~/processes/reservation-flow/guards"

type ScheduleInfo = {
  movieTitle: string
  screenName: string
  startsAt: string
  endsAt: string
}

export function useConfirm() {
  const navigate = useNavigate()
  const d = draft.get()
  const [schedInfo, setSchedInfo] = useState<ScheduleInfo | null>(null)

  useEffect(() => {
    const issue = getConfirmGuardIssue(d)
    if (issue) {
      navigate(issue.redirectTo, { replace: true })
      return
    }
    apiFetch<ScheduleInfo>(`/schedules/${d.scheduleId}`).then(setSchedInfo).catch(() => {})
  }, [])

  const totalPrice = d.selectedSeats?.reduce((sum, s) => sum + TICKET_PRICES[s.ticketType], 0) ?? 0

  function goToPayment() { navigate("/reservations/payment") }
  function goBack() { navigate(-1) }

  return {
    schedInfo,
    totalPrice,
    customer: d.customer,
    seats: d.selectedSeats,
    goToPayment,
    goBack,
  }
}
