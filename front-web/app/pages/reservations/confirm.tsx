import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { apiFetch } from "~/shared/api/client"
import { draft } from "~/entities/reservation/draft"
import { Header } from "~/widgets/Header"
import { Button } from "~/shared/ui/Button"
import { TICKET_LABELS, TICKET_PRICES, formatJst } from "~/entities/ticket"

type ScheduleInfo = {
  movieTitle: string
  screenName: string
  startsAt: string
  endsAt: string
}

export function ConfirmPage() {
  const navigate = useNavigate()
  const d = draft.get()
  const [schedInfo, setSchedInfo] = useState<ScheduleInfo | null>(null)

  useEffect(() => {
    if (!d.customer?.name || !d.customer?.email) {
      navigate("/movies", { replace: true })
      return
    }
    if (!d.scheduleId) return
    apiFetch<ScheduleInfo>(`/schedules/${d.scheduleId}`).then(setSchedInfo).catch(() => {})
  }, [])

  const totalPrice = d.selectedSeats?.reduce((sum, s) => sum + TICKET_PRICES[s.ticketType], 0) ?? 0

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-6">
        <p className="mb-4 text-xs text-gray-400">チケット選択 → 座席選択 → お客様情報 → 確認 → 決済</p>
        <h1 className="mb-6 text-2xl font-bold">予約内容の確認</h1>

        {schedInfo && (
          <section className="mb-4 rounded-lg border border-gray-200 p-4">
            <h2 className="mb-2 font-bold text-gray-700">上映情報</h2>
            <p className="font-bold">{schedInfo.movieTitle}</p>
            <p className="text-sm text-gray-600 mt-1">{formatJst(schedInfo.startsAt)}</p>
            <p className="text-sm text-gray-500">{schedInfo.screenName}</p>
          </section>
        )}

        <section className="mb-4 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-2 font-bold text-gray-700">座席・券種</h2>
          <table className="w-full text-sm">
            <tbody>
              {d.selectedSeats?.map(s => (
                <tr key={s.seatId} className="border-b border-gray-100 last:border-0">
                  <td className="py-1.5">{s.row}-{s.col}</td>
                  <td className="py-1.5 text-gray-600">{TICKET_LABELS[s.ticketType]}</td>
                  <td className="py-1.5 text-right">{TICKET_PRICES[s.ticketType].toLocaleString()}円</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex justify-between font-bold text-base border-t border-gray-200 pt-2">
            <span>合計</span>
            <span>{totalPrice.toLocaleString()}円</span>
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-2 font-bold text-gray-700">お客様情報</h2>
          <p className="text-sm"><span className="text-gray-500">氏名：</span>{d.customer?.name}</p>
          <p className="text-sm mt-1"><span className="text-gray-500">メール：</span>{d.customer?.email}</p>
        </section>

        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={() => navigate("/reservations/payment")}>
            お支払いへ進む
          </Button>
          <Button size="md" variant="ghost" onClick={() => navigate(-1)}>
            戻る
          </Button>
        </div>
      </main>
    </>
  )
}
