import { useEffect } from "react"
import { useNavigate } from "react-router"
import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"
import { usePayment } from "~/features/reservation/usePayment"
import { useReservationFlow } from "~/processes/reservation-flow/context"

export default function PaymentPage() {
  const navigate = useNavigate()
  const { canProceedTo } = useReservationFlow()
  const { cardNo, setCardNo, expiry, setExpiry, cvv, setCvv, errors, submit } = usePayment()

  useEffect(() => {
    const result = canProceedTo("payment")
    if (!result.ok) navigate(result.redirectTo, { replace: true })
  }, [])

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (submit()) navigate("/reservations/confirm")
  }

  return (
    <div className="py-6">
      <h1 className="mb-6 text-2xl font-black text-gray-900">お支払い情報の入力</h1>

      <form onSubmit={handleNext} className="flex flex-col gap-4">
        <div className="rounded-2xl border-2 border-red-500 bg-red-50 px-5 py-3 text-sm font-bold text-red-700">
          💳 クレジットカード
        </div>
        <Input id="cardNo" label="カード番号" value={cardNo}
          onChange={e => setCardNo(e.target.value.replace(/\D/g, "").slice(0, 16))}
          placeholder="1234 5678 9012 3456" inputMode="numeric" error={errors.cardNo} />
        <div className="grid grid-cols-2 gap-3">
          <Input id="expiry" label="有効期限" value={expiry}
            onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" error={errors.expiry} />
          <Input id="cvv" label="セキュリティコード" value={cvv}
            onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
            placeholder="123" inputMode="numeric" error={errors.cvv} />
        </div>
        <p className="text-xs text-gray-400">※このシステムはデモです。カード情報は送信されません。</p>
        <Button type="submit" size="lg">次へ（内容を確認）</Button>
      </form>
    </div>
  )
}
