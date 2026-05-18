import { useState, useEffect } from "react"
import { apiFetch, ApiError } from "~/shared/api/client"
import { useReservationFlow } from "~/processes/reservation-flow/context"
import { TICKET_PRICES } from "~/entities/ticket"

type ScheduleInfo = {
  movieTitle: string
  screenName: string
  startsAt: string
}

export function usePayment() {
  const { state, completeFlow } = useReservationFlow()
  const [schedInfo, setSchedInfo] = useState<ScheduleInfo | null>(null)
  const [cardNo, setCardNo] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!state.scheduleId) return
    apiFetch<ScheduleInfo>(`/schedules/${state.scheduleId}`)
      .then(setSchedInfo)
      .catch(() => setError("上映情報の取得に失敗しました。もう一度お試しください。"))
  }, [state.scheduleId])

  const totalPrice = state.selectedSeats?.reduce((sum, s) => sum + TICKET_PRICES[s.ticketType], 0) ?? 0

  async function submit(): Promise<boolean> {
    if (
      !state.scheduleId || !state.reservationCode || !state.layoutVersion ||
      !state.selectedSeats?.length || !state.customer?.email
    ) {
      setError("予約情報が不足しています。最初からやり直してください。")
      return false
    }

    if (cardNo.replace(/\s/g, "").length !== 16) { setError("カード番号は16桁で入力してください"); return false }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) { setError("有効期限は MM/YY の形式で入力してください"); return false }
    if (cvv.length !== 3) { setError("セキュリティコードは3桁で入力してください"); return false }

    setError("")
    setSubmitting(true)
    try {
      const result = await apiFetch<{ reservationId: number; reservationCode: string; totalPrice: number; qrCodeUrl: string }>(
        "/reservations",
        {
          method: "POST",
          body: JSON.stringify({
            reservationCode: state.reservationCode,
            scheduleId: state.scheduleId,
            layoutVersion: state.layoutVersion,
            seatIds: state.selectedSeats.map(s => s.seatId),
            bookingType: state.bookingType ?? "guest",
            tickets: state.selectedSeats.map(s => ({ seatId: s.seatId, ticketType: s.ticketType })),
            customer: state.customer,
          }),
        },
      )
      completeFlow(result)
      return true
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "SEAT_ALREADY_RESERVED") setError("選択した座席はすでに予約済みです。座席を選び直してください。")
        else if (err.code === "SEAT_LAYOUT_VERSION_MISMATCH") setError("座席情報が更新されました。座席を選び直してください。")
        else setError(err.message)
      } else {
        setError("エラーが発生しました。再度お試しください。")
      }
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return { schedInfo, cardNo, setCardNo, expiry, setExpiry, cvv, setCvv, submitting, error, totalPrice, submit }
}
