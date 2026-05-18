import { useState, type FormEvent } from "react"
import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"

const CARD_BRANDS = [
  { id: "visa",       label: "VISA" },
  { id: "mastercard", label: "Master" },
  { id: "jcb",        label: "JCB" },
  { id: "amex",       label: "AMEX" },
  { id: "diners",     label: "Diners" },
  { id: "unionpay",   label: "銀聯" },
]

type Errors = { cardNo?: string; expiry?: string; cvv?: string }

type Props = {
  totalPrice: number
  cardNo: string
  setCardNo: (v: string) => void
  expiry: string
  setExpiry: (v: string) => void
  cvv: string
  setCvv: (v: string) => void
  errors: Errors
  onSubmit: (e: FormEvent) => void
  submitLabel?: string
}

export function PaymentForm({
  totalPrice,
  cardNo, setCardNo,
  expiry, setExpiry,
  cvv, setCvv,
  errors,
  onSubmit,
  submitLabel = "次へ進む",
}: Props) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="rounded-app border border-border bg-card shadow-sm p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">お支払い合計</p>
        <p className="text-4xl font-black text-foreground">
          {totalPrice.toLocaleString()}
          <span className="text-base font-bold text-muted-foreground ml-1">円</span>
        </p>
      </div>

      <div className="rounded-app border border-border bg-card shadow-sm p-6 flex flex-col gap-5">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">クレジットカード</h2>

        <div className="grid grid-cols-3 gap-2">
          {CARD_BRANDS.map(brand => (
            <button
              key={brand.id}
              type="button"
              onClick={() => setSelectedBrand(brand.id)}
              className={`rounded-xl border-2 py-2.5 text-xs font-black tracking-wide transition-all ${
                selectedBrand === brand.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:border-primary/30"
              }`}
            >
              {brand.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <Input
            id="cardNo"
            label="カード番号"
            value={cardNo}
            onChange={e => setCardNo(e.target.value.replace(/\D/g, "").slice(0, 16))}
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            error={errors.cardNo}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="expiry"
              label="有効期限"
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              placeholder="MM/YY"
              error={errors.expiry}
            />
            <Input
              id="cvv"
              label="セキュリティコード"
              value={cvv}
              onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="123"
              inputMode="numeric"
              error={errors.cvv}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">※このシステムはデモです。カード情報は送信されません。</p>
      </div>

      <Button type="submit" size="lg" className="w-full h-14 text-lg font-black">
        {submitLabel}
      </Button>
    </form>
  )
}
