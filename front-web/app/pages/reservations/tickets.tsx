import { Header } from "~/widgets/Header"
import { Button } from "~/shared/ui/Button"
import { TICKET_TYPES, TICKET_LABELS, TICKET_PRICES, formatJst } from "~/entities/ticket"
import { useTicketSelection } from "~/features/reservation/useTicketSelection"

export function TicketsPage() {
  const { info, loading, counts, totalPrice, quoting, total, changeCount, handleNext } = useTicketSelection()

  if (loading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-xl px-4 py-8"><p className="text-gray-500">読み込み中...</p></main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-6">
        <p className="mb-4 text-xs text-gray-400">チケット選択 → 座席選択 → お客様情報 → 確認 → 決済</p>

        {info && (
          <div className="mb-6 rounded-lg border border-gray-200 p-4 text-sm">
            <p className="font-bold text-lg">{info.movieTitle}</p>
            <p className="mt-1 text-gray-600">{formatJst(info.startsAt)} 〜 {info.screenName}</p>
            <p className="mt-0.5 text-gray-500">残{info.remainingSeats}席</p>
          </div>
        )}

        <h2 className="mb-3 text-lg font-bold">券種と枚数を選ぶ</h2>
        <div className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
          {TICKET_TYPES.map(type => (
            <div key={type} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{TICKET_LABELS[type]}</p>
                <p className="text-sm text-gray-500">{TICKET_PRICES[type].toLocaleString()}円</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => changeCount(type, -1)}
                  disabled={counts[type] === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-lg disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-4 text-center font-medium">{counts[type]}</span>
                <button
                  onClick={() => changeCount(type, 1)}
                  disabled={total >= 8}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-lg disabled:opacity-30"
                >
                  ＋
                </button>
              </div>
            </div>
          ))}
        </div>

        {total > 8 && (
          <p className="mt-2 text-sm text-red-600">合計枚数は8枚までです。</p>
        )}

        <div className="mt-4 flex justify-between text-lg font-bold">
          <span>合計（{total}枚）</span>
          <span>{quoting ? "..." : `${totalPrice.toLocaleString()}円`}</span>
        </div>

        <Button size="lg" className="mt-6" disabled={total === 0 || total > 8} onClick={handleNext}>
          次へ（座席を選ぶ）
        </Button>
      </main>
    </>
  )
}
