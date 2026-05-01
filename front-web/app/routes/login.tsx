import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router"
import { apiFetch, ApiError } from "~/lib/api"
import { safeRedirect } from "~/lib/auth"
import { Button } from "~/components/ui/Button"
import { Input } from "~/components/ui/Input"
import { Header } from "~/components/layout/Header"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get("redirect"))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ email, type: "login" }),
      })
      sessionStorage.setItem("hal_cinema_pending_email", email)
      navigate(
        `/auth/otp?type=login&redirect=${encodeURIComponent(redirect)}`,
      )
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("エラーが発生しました。時間をおいてお試しください。")
      }
    } finally {
      setLoading(false)
    }
  }

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
            onClick={() => {
              sessionStorage.setItem(
                "hal_cinema_reservation_draft",
                JSON.stringify({
                  ...JSON.parse(
                    sessionStorage.getItem("hal_cinema_reservation_draft") ?? "{}",
                  ),
                  bookingType: "guest",
                }),
              )
            }}
          >
            ゲストとして続行
          </Link>
        </div>
      </main>
    </>
  )
}
