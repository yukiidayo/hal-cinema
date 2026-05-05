import {Header} from "~/widgets/Header"
import {Button} from "~/shared/ui/Button"
import {TICKET_TYPES, TICKET_LABELS, TICKET_PRICES, formatJst} from "~/entities/ticket"
import {useTicketSelection} from "~/features/reservation/useTicketSelection"

export default function TicketsPage() {
    const {info, loading, selectedSeats, totalPrice, quoting, updateSeatTicketType, handleNext} = useTicketSelection()

    if (loading) {
        return (
            <>
                <Header/>
                <main className="mx-auto max-w-xl px-4 py-8"><p className="text-gray-500">読み込み中...</p></main>
            </>
        )
    }

    return (
        <div className="py-6">
            <p className="mb-4 text-xs text-gray-400">日付・時間・座席 → お客様情報 → 券種選択 → 確認 → 決済</p>

            {info && (
                <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-2xl font-black text-gray-900">{info.movieTitle}</p>
                    <div className="mt-2 flex items-center gap-3 text-sm font-bold text-gray-500">
                        <span className="rounded-md bg-gray-100 px-2 py-1">{formatJst(info.startsAt)} 〜</span>
                        <span>{info.screenName}</span>
                    </div>
                </div>
            )}

            <h2 className="mb-4 text-lg font-black text-gray-900">券種を選ぶ</h2>

            <div className="flex flex-col gap-4">
                {selectedSeats.map(seat => (
                    <div key={seat.seatId}
                         className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-xs font-black text-white">
                                {seat.row}-{seat.col}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">座席</p>
                                <p className="text-sm font-black text-gray-900">選択済み</p>
                            </div>
                        </div>

                        <div className="flex flex-1 gap-2 sm:max-w-xs">
                            {TICKET_TYPES.map(type => (
                                <button
                                    key={type}
                                    onClick={() => updateSeatTicketType(seat.seatId, type)}
                                    className={`flex-1 rounded-lg border-2 py-2 text-[10px] font-black transition-all ${
                                        seat.ticketType === type
                                            ? "border-red-600 bg-red-50 text-red-700"
                                            : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                                    }`}
                                >
                                    {TICKET_LABELS[type]}
                                    <br/>
                                    {TICKET_PRICES[type].toLocaleString()}円
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-8">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">合計金額</p>
                    <p className="text-3xl font-black text-gray-900">{quoting ? "..." : `${totalPrice.toLocaleString()}円`}</p>
                </div>
                <Button size="lg" className="px-12 h-14 text-lg font-black" onClick={handleNext}>
                    次へ（内容を確認）
                </Button>
            </div>
        </div>
    )
}
