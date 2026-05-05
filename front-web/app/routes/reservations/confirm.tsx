import {Button} from "~/shared/ui/Button"
import {TICKET_LABELS, TICKET_PRICES, formatJst} from "~/entities/ticket"
import {useConfirm} from "~/features/reservation/useConfirm"

export default function ConfirmPage() {
    const {schedInfo, totalPrice, customer, seats, goToPayment, goBack} = useConfirm()

    return (
        <div className="py-6 max-w-xl mx-auto">
            <p className="mb-4 text-xs text-gray-400">日付・時間・座席 → お客様情報 → 券種選択 → 確認 → 決済</p>
            <h1 className="mb-6 text-2xl font-black text-gray-900">予約内容の確認</h1>

            {schedInfo && (
                <section className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">上映情報</h2>
                    <p className="text-lg font-black text-gray-900">{schedInfo.movieTitle}</p>
                    <p className="mt-1 text-sm font-bold text-gray-500">{formatJst(schedInfo.startsAt)}</p>
                    <p className="text-sm text-gray-400">{schedInfo.screenName}</p>
                </section>
            )}

            <section className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">座席・券種</h2>
                <table className="w-full text-sm">
                    <tbody>
                    {seats?.map(s => (
                        <tr key={s.seatId} className="border-b border-gray-50 last:border-0">
                            <td className="py-2 font-black text-gray-900">{s.row}-{s.col}</td>
                            <td className="py-2 text-gray-500">{TICKET_LABELS[s.ticketType]}</td>
                            <td className="py-2 text-right font-bold text-gray-900">{TICKET_PRICES[s.ticketType].toLocaleString()}円</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <div
                    className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-base font-black text-gray-900">
                    <span>合計</span><span>{totalPrice.toLocaleString()}円</span>
                </div>
            </section>

            <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">お客様情報</h2>
                <p className="text-sm text-gray-700"><span
                    className="font-bold text-gray-400">氏名</span> {customer?.name}</p>
                <p className="mt-2 text-sm text-gray-700"><span
                    className="font-bold text-gray-400">メール</span> {customer?.email}</p>
            </section>

            <div className="flex flex-col gap-3">
                <Button size="lg" className="h-14 text-base font-black shadow-lg shadow-red-600/20"
                        onClick={goToPayment}>お支払いへ進む</Button>
                <Button size="md" variant="ghost" onClick={goBack}>戻る</Button>
            </div>
        </div>
    )
}
