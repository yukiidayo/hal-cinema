import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { draft, type SelectedSeat } from "~/entities/reservation/draft"
import { getAuthState } from "~/shared/api/auth"
import { getNext7Days } from "~/shared/lib/date"
import type { Movie, Schedule } from "~/entities/movie/types"

export type SeatData = {
  seatId: number
  row: string
  col: number
  positionTopPct: number
  positionLeftPct: number
  seatWidthPct: number
  seatHeightPct: number
  status: "available" | "reserved"
}

export type SeatMapData = {
  scheduleId: number
  layout: {
    aspectRatio: string
    layoutVersion: number
  }
  seats: SeatData[]
}

export function useBooking() {
  const { movieId } = useParams<{ movieId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [movie, setMovie] = useState<Movie | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  
  const selectedDate = searchParams.get("date") ?? ""
  const selectedScheduleId = searchParams.get("scheduleId") ? Number(searchParams.get("scheduleId")) : null
  
  const [mapData, setMapData] = useState<SeatMapData | null>(null)
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([])

  const [loading, setLoading] = useState(true)
  const [mapLoading, setMapLoading] = useState(false)
  const [error, setError] = useState("")
  const [toastMsg, setToastMsg] = useState("")

  const days = getNext7Days()

  // 初期読み込み: 映画情報
  useEffect(() => {
    if (!movieId) return
    setLoading(true)
    apiFetch<Movie>(`/movies/${movieId}`)
      .then(setMovie)
      .catch(() => setError("映画情報が見つかりません"))
      .finally(() => setLoading(false))
  }, [movieId])

  // 日付が空だがスケジュールIDがある場合、スケジュール情報から日付を補完する
  useEffect(() => {
    if (!selectedDate && selectedScheduleId) {
      apiFetch<Schedule & { startsAt: string }>(`/schedules/${selectedScheduleId}`)
        .then(sch => {
          // JSTでの日付文字列 (YYYY-MM-DD) を取得
          const date = new Date(sch.startsAt).toLocaleDateString("sv", { timeZone: "Asia/Tokyo" })
          setSearchParams(prev => {
            const p = new URLSearchParams(prev)
            p.set("date", date)
            return p
          }, { replace: true })
        })
    }
  }, [selectedDate, selectedScheduleId])

  // 日付が選択されたらスケジュールを取得
  useEffect(() => {
    if (!movieId || !selectedDate) {
      setSchedules([])
      return
    }
    apiFetch<{ schedules: Schedule[] }>(`/movies/${movieId}/schedules?date=${selectedDate}`)
      .then(d => {
        setSchedules(d.schedules)
      })
  }, [movieId, selectedDate])

  // スケジュールが選択されたら座席表を取得
  useEffect(() => {
    if (!selectedScheduleId) {
      setMapData(null)
      setSelectedSeatIds([])
      return
    }
    setMapLoading(true)
    apiFetch<SeatMapData>(`/reservations/schedules/${selectedScheduleId}/seats`)
      .then(setMapData)
      .catch(() => setError("座席情報の取得に失敗しました"))
      .finally(() => setMapLoading(false))
  }, [selectedScheduleId])

  function setSelectedDate(date: string) {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      if (date) p.set("date", date); else p.delete("date")
      p.delete("scheduleId") // 日付が変わったらスケジュール選択もリセット
      return p
    })
  }

  function setSelectedScheduleId(id: number | null) {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      if (id) p.set("scheduleId", String(id)); else p.delete("scheduleId")
      return p
    })
  }

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 2500)
  }

  function toggleSeat(seat: SeatData) {
    if (seat.status === "reserved") return
    if (selectedSeatIds.includes(seat.seatId)) {
      setSelectedSeatIds(prev => prev.filter(id => id !== seat.seatId))
    } else {
      if (selectedSeatIds.length >= 8) {
        showToast("最大8席まで選択できます。")
        return
      }
      setSelectedSeatIds(prev => [...prev, seat.seatId])
    }
  }

  async function handleNext() {
    if (!selectedScheduleId || !mapData || selectedSeatIds.length === 0) return

    try {
      // 1. バックエンドで座席を仮押さえ
      const result = await apiFetch<{ reservationCode: string; expiresAt: string }>(
        "/reservations/hold",
        {
          method: "POST",
          body: JSON.stringify({
            scheduleId: selectedScheduleId,
            seatIds: selectedSeatIds,
          }),
        }
      )

      const seats = mapData.seats.filter(s => selectedSeatIds.includes(s.seatId))
      const selectedSeats: SelectedSeat[] = seats.map(s => ({
        seatId: s.seatId,
        row: s.row,
        col: s.col,
        ticketType: "general"
      }))

      // 2. ドラフトに保存
      draft.set({
        scheduleId: selectedScheduleId,
        reservationCode: result.reservationCode,
        expiresAt: result.expiresAt,
        selectedSeats,
        layoutVersion: mapData.layout.layoutVersion,
        ticketCounts: { general: selectedSeats.length, university: 0, highschool: 0, child: 0 }
      })

      // 3. 次の画面へ
      const auth = await getAuthState()
      if (auth.authenticated) {
        navigate("/reservations/tickets")
      } else {
        navigate("/reservations/entry")
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === "SEAT_ALREADY_RESERVED") {
        showToast("選択した座席はすでに他の人が予約中または仮押さえ中です。")
      } else {
        showToast("エラーが発生しました。再度お試しください。")
      }
    }
  }

  return {
    movie, days, selectedDate, setSelectedDate,
    schedules, selectedScheduleId, setSelectedScheduleId,
    mapData, mapLoading, selectedSeatIds, toggleSeat,
    loading, error, toastMsg, handleNext
  }
}
