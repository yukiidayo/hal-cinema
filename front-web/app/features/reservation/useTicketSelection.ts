import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { draft } from "~/entities/reservation/draft"
import {
  TICKET_TYPES, calcTotalPrice, totalTicketCount,
  type TicketCounts,
} from "~/entities/ticket"

type ScheduleInfo = {
  scheduleId: number
  movieTitle: string
  screenName: string
  startsAt: string
  endsAt: string
  remainingSeats: number
}

export function useTicketSelection() {
  const { scheduleId } = useParams<{ scheduleId: string }>()
  const navigate = useNavigate()
  const [info, setInfo] = useState<ScheduleInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<TicketCounts>({ general: 0, university: 0, highschool: 0, child: 0 })
  const [totalPrice, setTotalPrice] = useState(0)
  const [quoting, setQuoting] = useState(false)

  const total = totalTicketCount(counts)

  useEffect(() => {
    if (!scheduleId) return
    apiFetch<ScheduleInfo>(`/schedules/${scheduleId}`)
      .then(setInfo)
      .catch(err => {
        if (err instanceof ApiError && err.status === 404) navigate("/movies", { replace: true })
      })
      .finally(() => setLoading(false))
  }, [scheduleId])

  useEffect(() => {
    if (!scheduleId || total === 0) { setTotalPrice(calcTotalPrice(counts)); return }
    setQuoting(true)
    apiFetch<{ ticketCount: number; totalPrice: number }>("/reservations/quote", {
      method: "POST",
      body: JSON.stringify({ scheduleId: Number(scheduleId), ticketCounts: counts }),
    })
      .then(d => setTotalPrice(d.totalPrice))
      .catch(() => setTotalPrice(calcTotalPrice(counts)))
      .finally(() => setQuoting(false))
  }, [counts, scheduleId])

  function changeCount(type: (typeof TICKET_TYPES)[number], delta: number) {
    setCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] + delta) }))
  }

  function handleNext() {
    draft.set({ scheduleId: Number(scheduleId), ticketCounts: counts })
    navigate(`/reservations/seats/${scheduleId}`)
  }

  return { info, loading, counts, totalPrice, quoting, total, changeCount, handleNext }
}
