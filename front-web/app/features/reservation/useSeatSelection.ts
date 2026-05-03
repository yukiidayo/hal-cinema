import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { draft, type SelectedSeat } from "~/entities/reservation/draft"
import { getAuthState } from "~/shared/api/auth"
import { buildTypeQueue, totalTicketCount } from "~/entities/ticket"

type SeatData = {
  seatId: number
  row: string
  col: number
  positionTopPct: number
  positionLeftPct: number
  seatWidthPct: number
  seatHeightPct: number
  hitRadiusPct: number | null
  status: "available" | "reserved"
}

type Layout = {
  screenId: number
  layoutVersion: number
  backgroundImageUrl: string
  aspectRatio: string
}

export type SeatMapData = {
  scheduleId: number
  layout: Layout
  seats: SeatData[]
}

export function useSeatSelection() {
  const { scheduleId } = useParams<{ scheduleId: string }>()
  const navigate = useNavigate()
  const [mapData, setMapData] = useState<SeatMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [toastMsg, setToastMsg] = useState("")

  const d = draft.get()
  const ticketCounts = d.ticketCounts
  const requiredCount = ticketCounts ? totalTicketCount(ticketCounts) : 0

  useEffect(() => {
    if (!ticketCounts || requiredCount === 0) {
      navigate("/movies", { replace: true })
    }
  }, [])

  useEffect(() => {
    if (!scheduleId || requiredCount === 0) return
    apiFetch<SeatMapData>(`/reservations/schedules/${scheduleId}/seats`)
      .then(setMapData)
      .catch(err => {
        if (err instanceof ApiError && err.status === 404) navigate("/movies", { replace: true })
      })
      .finally(() => setLoading(false))
  }, [scheduleId])

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 2500)
  }

  function toggleSeat(seat: SeatData) {
    if (seat.status === "reserved") return
    if (selectedIds.includes(seat.seatId)) {
      setSelectedIds(prev => prev.filter(id => id !== seat.seatId))
    } else {
      if (selectedIds.length >= requiredCount) {
        showToast(`選択上限（${requiredCount}席）に達しています。`)
        return
      }
      if (selectedIds.length >= 8) {
        showToast("最大8席まで選択できます。")
        return
      }
      setSelectedIds(prev => [...prev, seat.seatId])
    }
  }

  async function handleConfirm() {
    if (!mapData || !ticketCounts) return
    const typeQueue = buildTypeQueue(ticketCounts)
    const seats = mapData.seats.filter(s => selectedIds.includes(s.seatId))
    const selectedSeats: SelectedSeat[] = selectedIds.map((seatId, i) => {
      const s = seats.find(x => x.seatId === seatId)!
      return { seatId, row: s.row, col: s.col, ticketType: typeQueue[i] ?? "general" }
    })
    draft.set({ selectedSeats, layoutVersion: mapData.layout.layoutVersion })
    const auth = await getAuthState()
    if (auth.authenticated) {
      navigate("/reservations/customer")
    } else {
      navigate("/reservations/entry")
    }
  }

  function seatStatusClass(seat: SeatData): string {
    if (seat.status === "reserved") return "bg-gray-400 cursor-not-allowed opacity-60"
    if (selectedIds.includes(seat.seatId)) return "bg-red-500 ring-2 ring-red-300 cursor-pointer"
    return "bg-emerald-400 hover:bg-emerald-500 cursor-pointer"
  }

  return { mapData, loading, selectedIds, toastMsg, requiredCount, toggleSeat, handleConfirm, seatStatusClass }
}
