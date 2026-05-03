import { Header } from "~/widgets/Header"
import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"
import { useCustomerForm } from "~/features/reservation/useCustomerForm"

export default function CustomerPage() {
  const { name, setName, email, setEmail, errors, handleNext } = useCustomerForm()

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-6">
        <p className="mb-4 text-xs text-gray-400">チケット選択 → 座席選択 → お客様情報 → 確認 → 決済</p>
        <h1 className="mb-6 text-2xl font-bold">お客様情報の入力</h1>

        <form onSubmit={e => { e.preventDefault(); handleNext() }} className="flex flex-col gap-4">
          <Input id="name" label="氏名" value={name} onChange={e => setName(e.target.value)}
            placeholder="山田 花子" required error={errors.name} />
          <Input id="email" type="email" label="メールアドレス" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="example@email.com" required autoComplete="email" error={errors.email} />
          <p className="text-xs text-gray-500">ご入力いただいたメールアドレスに予約完了のご案内をお送りします。</p>
          <Button type="submit" size="lg">次へ（予約確認）</Button>
        </form>
      </main>
    </>
  )
}
