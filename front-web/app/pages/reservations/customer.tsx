import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { draft } from "~/entities/reservation/draft"
import { getAuthState } from "~/shared/api/auth"
import { Header } from "~/widgets/Header"
import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"

export function CustomerPage() {
  const navigate = useNavigate()
  const d = draft.get()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  useEffect(() => {
    if (!d.selectedSeats || d.selectedSeats.length === 0) {
      navigate("/movies", { replace: true })
      return
    }
    getAuthState().then(auth => {
      if (auth.authenticated) {
        draft.set({ bookingType: "member" })
      }
    })
  }, [])

  function validate() {
    const errs: { name?: string; email?: string } = {}
    if (!name.trim()) errs.name = "氏名を入力してください"
    else if (name.length > 100) errs.name = "100文字以内で入力してください"
    if (!email.trim()) errs.email = "メールアドレスを入力してください"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "正しいメールアドレスを入力してください"
    else if (email.length > 254) errs.email = "254文字以内で入力してください"
    return errs
  }

  function handleNext() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    draft.set({ customer: { name: name.trim(), email: email.trim() } })
    navigate("/reservations/confirm")
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-6">
        <p className="mb-4 text-xs text-gray-400">チケット選択 → 座席選択 → お客様情報 → 確認 → 決済</p>
        <h1 className="mb-6 text-2xl font-bold">お客様情報の入力</h1>

        <form onSubmit={e => { e.preventDefault(); handleNext() }} className="flex flex-col gap-4">
          <Input
            id="name"
            label="氏名"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="山田 花子"
            required
            error={errors.name}
          />
          <Input
            id="email"
            type="email"
            label="メールアドレス"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
            autoComplete="email"
            error={errors.email}
          />
          <p className="text-xs text-gray-500">
            ご入力いただいたメールアドレスに予約完了のご案内をお送りします。
          </p>
          <Button type="submit" size="lg">次へ（予約確認）</Button>
        </form>
      </main>
    </>
  )
}
