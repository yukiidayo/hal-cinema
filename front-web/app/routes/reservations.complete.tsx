import { useState, useEffect } from "react"
import { Link } from "react-router"
import { Header } from "~/components/layout/Header"
import { Button } from "~/components/ui/Button"

type ReservationResult = {
  reservationId: number
  reservationCode: string
  totalPrice: number
  qrCodeUrl: string
}

export default function CompletePage() {
  const [result, setResult] = useState<ReservationResult | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem("hal_cinema_last_reservation")
    if (raw) {
      setResult(JSON.parse(raw) as ReservationResult)
      sessionStorage.removeItem("hal_cinema_last_reservation")
    }
  }, [])

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="mb-4 text-5xl">🎉</div>
        <h1 className="mb-2 text-2xl font-bold">予約完了</h1>
        <p className="mb-6 text-sm text-gray-500">
          予約確認メールをお送りしました。
        </p>

        {result ? (
          <div className="rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500">予約番号</p>
            <p className="mt-1 text-3xl font-bold tracking-widest">{result.reservationCode}</p>
            <p className="mt-3 text-sm text-gray-500">合計金額</p>
            <p className="mt-1 text-xl font-bold">{result.totalPrice.toLocaleString()}円</p>

            {result.qrCodeUrl && (
              <div className="mt-4">
                <p className="mb-2 text-sm text-gray-500">QRコード（入場時にご提示ください）</p>
                <img
                  src={result.qrCodeUrl}
                  alt="QRコード"
                  className="mx-auto h-40 w-40 rounded"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 p-6 text-gray-500">
            予約情報を取得できませんでした。
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {result && (
            <Link to={`/reservations/r/${result.reservationCode}`}>
              <Button size="md" variant="secondary" className="w-full">
                予約詳細を確認する
              </Button>
            </Link>
          )}
          <Link to="/movies">
            <Button size="md" variant="ghost" className="w-full">
              映画一覧へ戻る
            </Button>
          </Link>
        </div>
      </main>
    </>
  )
}
