import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { draft } from "~/entities/reservation/draft"
import { TICKET_PRICES } from "~/entities/ticket"

type ScheduleInfo = {
  movieTitle: string
  screenName: string
  startsAt: string
}

export function usePayment() {
  const navigate = useNavigate()
  const d = draft.get()
  const [schedInfo, setSchedInfo] = useState<ScheduleInfo | null>(null)
  const [cardNo, setCardNo] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!d.customer?.name || !d.customer?.email) {
      navigate("/movies", { replace: true })
      return
    }
    if (d.scheduleId) {
      apiFetch<ScheduleInfo>(`/schedules/${d.scheduleId}`).then(setSchedInfo).catch(() => {})
    }
  }, [])

  const totalPrice = d.selectedSeats?.reduce((sum, s) => sum + TICKET_PRICES[s.ticketType], 0) ?? 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!d.scheduleId || !d.selectedSeats || !d.customer || !d.layoutVersion) return

    if (cardNo.replace(/\s/g, "").length !== 16) {
      setError("カード番号は16桁で入力してください")
      return
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setError("有効期限は MM/YY の形式で入力してください")
      return
    }
    if (cvv.length !== 3) {
      setError("セキュリティコードは3桁で入力してください")
      return
    }

    setError("")
    setSubmitting(true)
    try {
      const result = await apiFetch<{ reservationId: number; reservationCode: string; totalPrice: number; qrCodeUrl: string }>(
        "/reservations",
        {
          method: "POST",
          body: JSON.stringify({
            reservationCode: d.reservationCode, // 追加
            scheduleId: d.scheduleId,
            layoutVersion: d.layoutVersion,
            seatIds: d.selectedSeats.map(s => s.seatId),
            bookingType: d.bookingType ?? "guest",
            tickets: d.selectedSeats.map(s => ({ seatId: s.seatId, ticketType: s.ticketType })),
            customer: d.customer,
          }),
        },
      )
      sessionStorage.setItem("hal_cinema_last_reservation", JSON.stringify(result))
      draft.clear()
      navigate("/reservations/complete")
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "SEAT_ALREADY_RESERVED") {
          setError("選択した座席はすでに予約済みです。座席を選び直してください。")
        } else if (err.code === "SEAT_LAYOUT_VERSION_MISMATCH") {
          setError("座席情報が更新されました。座席を選び直してください。")
        } else {
          setError(err.message)
        }
      } else {
        setError("エラーが発生しました。再度お試しください。")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return { schedInfo, cardNo, setCardNo, expiry, setExpiry, cvv, setCvv, submitting, error, totalPrice, handleSubmit }
}
