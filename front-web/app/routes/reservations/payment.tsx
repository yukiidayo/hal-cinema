import { Header } from "~/widgets/Header"
import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"
import { formatJst } from "~/entities/ticket"
import { usePayment } from "~/features/reservation/usePayment"

export default function PaymentPage() {
  const { schedInfo, cardNo, setCardNo, expiry, setExpiry, cvv, setCvv, submitting, error, totalPrice, handleSubmit } = usePayment()

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-6">
        <p className="mb-4 text-xs text-gray-400">チケット選択 → 座席選択 → お客様情報 → 確認 → 決済</p>
        <h1 className="mb-6 text-2xl font-bold">お支払い</h1>

        {schedInfo && (
          <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm">
            <p className="font-bold">{schedInfo.movieTitle}</p>
            <p className="text-gray-600 mt-0.5">{formatJst(schedInfo.startsAt)} / {schedInfo.screenName}</p>
            <p className="mt-1 font-bold text-base text-right">合計 {totalPrice.toLocaleString()}円</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="rounded-lg border-2 border-red-500 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
            💳 クレジットカード
          </div>
          <Input id="cardNo" label="カード番号" value={cardNo}
            onChange={e => setCardNo(e.target.value.replace(/\D/g, "").slice(0, 16))}
            placeholder="1234 5678 9012 3456" inputMode="numeric" />
          <div className="grid grid-cols-2 gap-3">
            <Input id="expiry" label="有効期限" value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" />
            <Input id="cvv" label="セキュリティコード" value={cvv}
              onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="123" inputMode="numeric" />
          </div>
          <p className="text-xs text-gray-400">※このシステムはデモです。カード情報は送信されません。</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "処理中..." : "予約を確定する"}
          </Button>
        </form>
      </main>
    </>
  )
}
