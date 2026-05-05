import { useNavigate } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { draft, type SelectedSeat } from "~/entities/reservation/draft"
import { getAuthState } from "~/shared/api/auth"
import type { SeatMapData } from "~/features/reservation/useSeatMap"

type Props = {
  selectedScheduleId: number | null
  mapData: SeatMapData | null
  selectedSeatIds: number[]
  showToast: (msg: string) => void
}

export function useHoldSeat({ selectedScheduleId, mapData, selectedSeatIds, showToast }: Props) {
  const navigate = useNavigate()

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

  return { handleNext }
}
