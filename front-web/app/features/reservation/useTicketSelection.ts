import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { apiFetch } from "~/shared/api/client"
import { getAuthState } from "~/shared/api/auth"
import { draft, type SelectedSeat } from "~/entities/reservation/draft"
import {
  TICKET_TYPES, calcTotalPrice, type TicketType
} from "~/entities/ticket"

type ScheduleInfo = {
  scheduleId: number
  movieTitle: string
  screenName: string
  startsAt: string
  endsAt: string
}

export function useTicketSelection() {
  const navigate = useNavigate()
  const [info, setInfo] = useState<ScheduleInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [quoting, setQuoting] = useState(false)

  useEffect(() => {
    let mounted = true

    const d = draft.get()
    if (!d.scheduleId || !d.selectedSeats || d.selectedSeats.length === 0) {
      navigate("/movies", { replace: true })
      return
    }

    setSelectedSeats(d.selectedSeats)

    const init = async () => {
      if (!d.bookingType) {
        const auth = await getAuthState()
        if (!mounted) return
        if (auth.authenticated) {
          try {
            const profile = await apiFetch<{ email: string; name?: string }>("/members/profile")
            if (!mounted) return
            const memberName = profile.name ?? "会員様"
            draft.set({ bookingType: "member", customer: { name: memberName, email: profile.email } })
          } catch {
            draft.set({ bookingType: "member" })
          }
        } else {
          navigate("/reservations/entry", { replace: true })
          return
        }
      }

      apiFetch<ScheduleInfo>(`/schedules/${d.scheduleId}`)
        .then(info => { if (mounted) setInfo(info) })
        .finally(() => { if (mounted) setLoading(false) })
    }

    init()

    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const d = draft.get()
    if (!d.scheduleId || selectedSeats.length === 0) return

    // チケット枚数を集計
    const counts = { general: 0, university: 0, highschool: 0, child: 0 }
    selectedSeats.forEach(s => {
      counts[s.ticketType as keyof typeof counts]++
    })

    setQuoting(true)
    apiFetch<{ totalPrice: number }>("/reservations/quote", {
      method: "POST",
      body: JSON.stringify({ scheduleId: d.scheduleId, ticketCounts: counts }),
    })
      .then(d => setTotalPrice(d.totalPrice))
      .catch(() => setTotalPrice(calcTotalPrice(counts)))
      .finally(() => setQuoting(false))
  }, [selectedSeats])

  function updateSeatTicketType(seatId: number, type: TicketType) {
    setSelectedSeats(prev => prev.map(s => s.seatId === seatId ? { ...s, ticketType: type } : s))
  }

  function handleNext() {
    const counts = { general: 0, university: 0, highschool: 0, child: 0 }
    selectedSeats.forEach(s => {
      counts[s.ticketType as keyof typeof counts]++
    })
    
    draft.set({ selectedSeats, ticketCounts: counts })
    navigate("/reservations/confirm")
  }

  return { info, loading, selectedSeats, totalPrice, quoting, updateSeatTicketType, handleNext }
}
