import { useState, useEffect } from "react"
import { useParams, Link } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { Header } from "~/widgets/Header"
import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"
import { TICKET_LABELS, formatJst } from "~/entities/ticket"

type Seat = { row: string; col: number; ticketType: string; price: number }

type ReservationDetail = {
  reservationCode: string
  status: string
  canCancel: boolean
  movie: { title: string; thumbnailUrl: string | null }
  schedule: { startsAt: string; endsAt: string; screenName: string }
  seats: Seat[]
  totalPrice: number
  customer: { name: string; maskedEmail: string }
  qrCodeUrl: string | null
}

export function ReservationDetailPage() {
  const { reservationCode } = useParams<{ reservationCode: string }>()
  const [detail, setDetail] = useState<ReservationDetail | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelEmail, setCancelEmail] = useState("")
  const [cancelError, setCancelError] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    if (!reservationCode) return
    apiFetch<ReservationDetail>(`/reservations/${reservationCode.toUpperCase()}`)
      .then(setDetail)
      .catch(err => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
      })
  }, [reservationCode])

  async function handleCancel() {
    if (!detail) return
    setCancelError("")
    setCancelling(true)
    try {
      const body = detail.status === "confirmed" && cancelEmail
        ? JSON.stringify({ email: cancelEmail })
        : undefined
      await apiFetch(`/reservations/${detail.reservationCode}/cancel`, {
        method: "POST",
        body,
      })
      setCancelled(true)
      setShowCancelModal(false)
      setDetail(prev => prev ? { ...prev, status: "cancelled", canCancel: false, qrCodeUrl: null } : prev)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "FORBIDDEN") {
          setCancelError("メールアドレスが一致しません。")
        } else if (err.code === "CANCELLATION_NOT_ALLOWED") {
          setCancelError("上映開始30分前以降はキャンセルできません。")
        } else if (err.code === "ALREADY_CANCELLED") {
          setCancelError("すでにキャンセル済みです。")
        } else {
          setCancelError(err.message)
        }
      } else {
        setCancelError("エラーが発生しました。再度お試しください。")
      }
    } finally {
      setCancelling(false)
    }
  }

  if (notFound) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-md px-4 py-12 text-center">
          <p className="text-lg font-bold">予約が見つかりませんでした</p>
          <Link to="/reservations/lookup" className="mt-4 inline-block text-sm text-blue-600 underline">
            予約確認ページへ戻る
          </Link>
        </main>
      </>
    )
  }

  if (!detail) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-md px-4 py-12 text-center text-gray-400">読み込み中...</main>
      </>
    )
  }

  const statusLabel = detail.status === "confirmed" ? "予約済み" : "キャンセル済み"
  const statusColor = detail.status === "confirmed" ? "text-green-600" : "text-red-500"

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">予約詳細</h1>
          <span className={`text-sm font-bold ${statusColor}`}>{statusLabel}</span>
        </div>

        {cancelled && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            予約をキャンセルしました。
          </div>
        )}

        <div className="mb-4 rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500">予約番号</p>
          <p className="mt-1 text-2xl font-bold tracking-widest">{detail.reservationCode}</p>
        </div>

        {detail.qrCodeUrl && (
          <div className="mb-4 flex flex-col items-center rounded-lg border border-gray-200 p-4">
            <p className="mb-2 text-sm text-gray-500">QRコード（入場時にご提示ください）</p>
            <img src={detail.qrCodeUrl} alt="QRコード" className="h-40 w-40 rounded" />
          </div>
        )}

        <section className="mb-4 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-2 font-bold text-gray-700">上映情報</h2>
          <div className="flex gap-3">
            {detail.movie.thumbnailUrl && (
              <img
                src={detail.movie.thumbnailUrl}
                alt={detail.movie.title}
                className="h-20 w-14 rounded object-cover"
              />
            )}
            <div>
              <p className="font-bold">{detail.movie.title}</p>
              <p className="mt-1 text-sm text-gray-600">{formatJst(detail.schedule.startsAt)}</p>
              <p className="text-sm text-gray-500">{detail.schedule.screenName}</p>
            </div>
          </div>
        </section>

        <section className="mb-4 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-2 font-bold text-gray-700">座席・券種</h2>
          <table className="w-full text-sm">
            <tbody>
              {detail.seats.map((s, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="py-1.5">{s.row}-{s.col}</td>
                  <td className="py-1.5 text-gray-600">
                    {TICKET_LABELS[s.ticketType as keyof typeof TICKET_LABELS] ?? s.ticketType}
                  </td>
                  <td className="py-1.5 text-right">{s.price.toLocaleString()}円</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-bold">
            <span>合計</span>
            <span>{detail.totalPrice.toLocaleString()}円</span>
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-2 font-bold text-gray-700">お客様情報</h2>
          <p className="text-sm"><span className="text-gray-500">氏名：</span>{detail.customer.name}</p>
          <p className="mt-1 text-sm"><span className="text-gray-500">メール：</span>{detail.customer.maskedEmail}</p>
        </section>

        <div className="flex flex-col gap-3">
          {detail.canCancel && (
            <Button size="md" variant="secondary" onClick={() => setShowCancelModal(true)}>
              予約をキャンセルする
            </Button>
          )}
          <Link to="/movies">
            <Button size="md" variant="ghost" className="w-full">映画一覧へ</Button>
          </Link>
        </div>
      </main>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-lg font-bold">予約をキャンセルしますか？</h2>
            <p className="mb-4 text-sm text-gray-600">
              キャンセル後は元に戻せません。本当にキャンセルしますか？
            </p>

            <div className="mb-4">
              <Input
                id="cancelEmail"
                type="email"
                label="予約時のメールアドレスを入力して確認"
                value={cancelEmail}
                onChange={e => setCancelEmail(e.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
              />
            </div>

            {cancelError && <p className="mb-3 text-sm text-red-600">{cancelError}</p>}

            <div className="flex gap-3">
              <Button
                size="md"
                variant="ghost"
                className="flex-1"
                onClick={() => { setShowCancelModal(false); setCancelError(""); setCancelEmail("") }}
              >
                戻る
              </Button>
              <Button
                size="md"
                variant="secondary"
                className="flex-1"
                disabled={cancelling}
                onClick={handleCancel}
              >
                {cancelling ? "処理中..." : "キャンセルする"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
