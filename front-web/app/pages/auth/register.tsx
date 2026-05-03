import { Link } from "react-router"
import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"
import { Header } from "~/widgets/Header"
import { useRegister } from "~/features/auth/useRegister"

export function RegisterPage() {
  const { email, setEmail, error, loading, redirect, handleSubmit } = useRegister()

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold">新規会員登録</h1>
        <p className="mb-6 text-sm text-gray-500">
          メールアドレスを入力してください。認証コードを送信します。
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            type="email"
            label="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
            autoComplete="email"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "送信中..." : "認証コードを送信"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          既にアカウントをお持ちの方は{" "}
          <Link
            to={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="text-red-600 hover:underline"
          >
            ログイン
          </Link>
        </p>
      </main>
    </>
  )
}
