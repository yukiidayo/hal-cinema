import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { apiFetch, ApiError } from "~/lib/api"
import { draft } from "~/lib/draft"
import { Header } from "~/components/layout/Header"
import { Button } from "~/components/ui/Button"
import { Input } from "~/components/ui/Input"
import { TICKET_LABELS, TICKET_PRICES, formatJst } from "~/lib/tickets"

type ScheduleInfo = {
  movieTitle: string
  screenName: string
  startsAt: string
}

export default function PaymentPage() {
  const navigate = useNavigate()
  const d = draft.get()
  const [schedInfo, setSchedInfo] = useState<ScheduleInfo | null>(null)
  const [cardNo, setCardNo] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // ガード
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
    setError("")
    setSubmitting(true)
    try {
      const result = await apiFetch<{ reservationId: number; reservationCode: string; totalPrice: number; qrCodeUrl: string }>(
        "/reservations",
        {
          method: "POST",
          body: JSON.stringify({
            scheduleId: d.scheduleId,
            layoutVersion: d.layoutVersion,
            seatIds: d.selectedSeats.map(s => s.seatId),
            bookingType: d.bookingType ?? "guest",
            tickets: d.selectedSeats.map(s => ({ seatId: s.seatId, ticketType: s.ticketType })),
            customer: d.customer,
          }),
        },
      )
      // 完了ページ遷移前にセッションストレージを更新 (complete ページで読む用)
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

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-6">
        <p className="mb-4 text-xs text-gray-400">チケット選択 → 座席選択 → お客様情報 → 確認 → 決済</p>
        <h1 className="mb-6 text-2xl font-bold">お支払い</h1>

        {/* 予約サマリー */}
        {schedInfo && (
          <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm">
            <p className="font-bold">{schedInfo.movieTitle}</p>
            <p className="text-gray-600 mt-0.5">{formatJst(schedInfo.startsAt)} / {schedInfo.screenName}</p>
            <p className="mt-1 font-bold text-base text-right">合計 {totalPrice.toLocaleString()}円</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 支払い方法（固定） */}
          <div className="rounded-lg border-2 border-red-500 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
            💳 クレジットカード
          </div>

          <Input
            id="cardNo"
            label="カード番号"
            value={cardNo}
            onChange={e => setCardNo(e.target.value.replace(/\D/g, "").slice(0, 16))}
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="expiry"
              label="有効期限"
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              placeholder="MM/YY"
            />
            <Input
              id="cvv"
              label="セキュリティコード"
              value={cvv}
              onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="123"
              inputMode="numeric"
            />
          </div>

          <p className="text-xs text-gray-400">
            ※このシステムはデモです。カード情報は送信されません。
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "処理中..." : "予約を確定する"}
          </Button>
        </form>
      </main>
    </>
  )
}
