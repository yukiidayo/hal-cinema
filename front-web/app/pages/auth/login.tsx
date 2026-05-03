import { Link } from "react-router"
import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"
import { Header } from "~/widgets/Header"
import { useLogin } from "~/features/auth/useLogin"

export function LoginPage() {
  const { email, setEmail, error, loading, redirect, handleSubmit, handleGuestContinue } = useLogin()

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold">ログイン</h1>
        <p className="mb-6 text-sm text-gray-500">
          登録済みのメールアドレスに認証コードを送信します。
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
        <div className="mt-6 flex flex-col gap-2 text-center text-sm text-gray-500">
          <p>
            アカウントをお持ちでない方は{" "}
            <Link
              to={`/register?redirect=${encodeURIComponent(redirect)}`}
              className="text-red-600 hover:underline"
            >
              新規会員登録
            </Link>
          </p>
          <Link
            to={redirect}
            className="text-gray-400 hover:underline"
            onClick={handleGuestContinue}
          >
            ゲストとして続行
          </Link>
        </div>
      </main>
    </>
  )
}
