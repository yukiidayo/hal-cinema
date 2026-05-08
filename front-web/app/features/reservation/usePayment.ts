import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { draft, type ReservationDraft } from "~/entities/reservation/draft"
import { TICKET_PRICES } from "~/entities/ticket"
import { getPaymentGuardIssue } from "~/processes/reservation-flow/guards"

type ScheduleInfo = {
  movieTitle: string
  screenName: string
  startsAt: string
}

type CompletePaymentDraft = ReservationDraft & {
  scheduleId: number
  reservationCode: string
  layoutVersion: number
  selectedSeats: NonNullable<ReservationDraft["selectedSeats"]>
  customer: NonNullable<ReservationDraft["customer"]>
}

function isCompletePaymentDraft(d: ReservationDraft): d is CompletePaymentDraft {
  return (
    typeof d.scheduleId === "number" &&
    typeof d.reservationCode === "string" &&
    typeof d.layoutVersion === "number" &&
    Array.isArray(d.selectedSeats) &&
    d.selectedSeats.length > 0 &&
    !!d.customer?.name &&
    !!d.customer?.email
  )
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
  const [recoverPath, setRecoverPath] = useState<string | null>(null)

  useEffect(() => {
    const issue = getPaymentGuardIssue(d)
    if (issue) {
      setError(issue.message)
      setRecoverPath(issue.redirectTo)
      return
    }
    setRecoverPath(null)

    apiFetch<ScheduleInfo>(`/schedules/${d.scheduleId}`)
      .then(setSchedInfo)
      .catch(() => setError("上映情報の取得に失敗しました。もう一度お試しください。"))
  }, [navigate])

  const totalPrice = d.selectedSeats?.reduce((sum, s) => sum + TICKET_PRICES[s.ticketType], 0) ?? 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isCompletePaymentDraft(d)) {
      const issue = getPaymentGuardIssue(d) ?? {
        message: "予約情報が不足しています。最初からやり直してください。",
        redirectTo: "/movies",
      }
      setError(issue.message)
      setRecoverPath(issue.redirectTo)
      return
    }

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
            reservationCode: d.reservationCode,
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

  function goRecover() {
    if (!recoverPath) return
    navigate(recoverPath, { replace: true })
  }

  return {
    schedInfo,
    cardNo,
    setCardNo,
    expiry,
    setExpiry,
    cvv,
    setCvv,
    submitting,
    error,
    recoverPath,
    goRecover,
    totalPrice,
    handleSubmit,
  }
}
