import { useState, useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { apiFetch, ApiError } from "~/lib/api"
import { safeRedirect } from "~/lib/auth"
import { Button } from "~/components/ui/Button"
import { Input } from "~/components/ui/Input"
import { Header } from "~/components/layout/Header"

const OTP_RESEND_SEC = 60

export default function AuthOtpPage() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(OTP_RESEND_SEC)
  const [resending, setResending] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const type = searchParams.get("type") === "register" ? "register" : "login"
  const redirect = safeRedirect(searchParams.get("redirect"))
  const email =
    typeof window !== "undefined"
      ? sessionStorage.getItem("hal_cinema_pending_email") ?? ""
      : ""

  // Start cooldown timer on mount
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [])

  // Redirect if no pending email
  useEffect(() => {
    if (typeof window !== "undefined" && !email) {
      navigate("/movies", { replace: true })
    }
  }, [email, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await apiFetch("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email, code, type }),
      })
      sessionStorage.removeItem("hal_cinema_pending_email")
      navigate(redirect, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case "OTP_INVALID":
            setError("認証コードが正しくありません。")
            break
          case "OTP_EXPIRED":
            setError("認証コードの有効期限が切れました。再送してください。")
            break
          case "OTP_ATTEMPTS_EXCEEDED":
            setError("試行回数が超過しました。しばらくお待ちください。")
            break
          default:
            setError(err.message)
        }
      } else {
        setError("エラーが発生しました。")
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError("")
    setResending(true)
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ email, type }),
      })
      setResendCooldown(OTP_RESEND_SEC)
      timerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      }
    } finally {
      setResending(false)
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold">認証コードの入力</h1>
        <p className="mb-6 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{email}</span>{" "}
          に送信した6桁のコードを入力してください。
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            label="認証コード（6桁）"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
            autoComplete="one-time-code"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" disabled={loading || code.length !== 6}>
            {loading ? "確認中..." : "確認する"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          {resendCooldown > 0 ? (
            <p className="text-gray-400">
              再送まで {resendCooldown} 秒
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-red-600 hover:underline disabled:opacity-50"
            >
              {resending ? "送信中..." : "認証コードを再送する"}
            </button>
          )}
        </div>
      </main>
    </>
  )
}
