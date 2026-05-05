import {Button} from "~/shared/ui/Button"
import {Input} from "~/shared/ui/Input"
import {formatJst} from "~/entities/ticket"
import {usePayment} from "~/features/reservation/usePayment"

export default function PaymentPage() {
    const {
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
        handleSubmit
    } = usePayment()

    return (
        <div className="py-6 max-w-xl mx-auto">
            <p className="mb-4 text-xs text-gray-400">日付・時間・座席 → お客様情報 → 券種選択 → 確認 → 決済</p>
            <h1 className="mb-6 text-2xl font-black text-gray-900">お支払い</h1>

            {schedInfo && (
                <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-lg font-black text-gray-900">{schedInfo.movieTitle}</p>
                    <p className="mt-1 text-sm font-bold text-gray-500">{formatJst(schedInfo.startsAt)} / {schedInfo.screenName}</p>
                    <p className="mt-3 text-right text-xl font-black text-gray-900">合計 {totalPrice.toLocaleString()}円</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="rounded-2xl border-2 border-red-500 bg-red-50 px-5 py-3 text-sm font-bold text-red-700">
                    💳 クレジットカード
                </div>
                <Input id="cardNo" label="カード番号" value={cardNo}
                       onChange={e => setCardNo(e.target.value.replace(/\D/g, "").slice(0, 16))}
                       placeholder="1234 5678 9012 3456" inputMode="numeric"/>
                <div className="grid grid-cols-2 gap-3">
                    <Input id="expiry" label="有効期限" value={expiry} onChange={e => setExpiry(e.target.value)}
                           placeholder="MM/YY"/>
                    <Input id="cvv" label="セキュリティコード" value={cvv}
                           onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="123"
                           inputMode="numeric"/>
                </div>
                <p className="text-xs text-gray-400">※このシステムはデモです。カード情報は送信されません。</p>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {recoverPath && (
                    <Button type="button" variant="ghost" onClick={goRecover}>
                        入力画面へ戻る
                    </Button>
                )}
                <Button type="submit" size="lg" disabled={submitting}>
                    {submitting ? "処理中..." : "予約を確定する"}
                </Button>
            </form>
        </div>
    )
}
