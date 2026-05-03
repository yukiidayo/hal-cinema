import { useState, useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { safeRedirect } from "~/shared/api/auth"

const OTP_RESEND_SEC = 60

export function useOtp() {
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

  function startCooldownTimer() {
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
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
      startCooldownTimer()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      }
    } finally {
      setResending(false)
    }
  }

  return { code, setCode, error, loading, email, resendCooldown, resending, handleSubmit, handleResend }
}
