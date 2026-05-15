import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { draft } from "~/entities/reservation/draft"
import { getAuthState } from "~/shared/api/auth"
import { apiFetch } from "~/shared/api/client"
import { getCustomerGuardIssue } from "~/processes/reservation-flow/guards"

export function useCustomerForm() {
  const navigate = useNavigate()
  const [isReady, setIsReady] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  useEffect(() => {
    let mounted = true

    getAuthState().then(async (auth) => {
      if (!mounted) return

      const d = draft.get()
      const issue = getCustomerGuardIssue(d)
      if (issue) {
        navigate(issue.redirectTo, { replace: true })
        return
      }
      const hasSeats = d.selectedSeats && d.selectedSeats.length > 0

      if (auth.authenticated) {
        draft.set({ bookingType: "member" })
        try {
          const profile = await apiFetch<{ email: string; name?: string }>("/members/profile")
          if (!mounted) return

          const mName = profile.name ?? "会員様"
          setName(mName)
          setEmail(profile.email)

          if (hasSeats) {
            // 座席があれば、情報を補完してチケット選択へ自動遷移
            draft.set({ customer: { name: mName, email: profile.email } })
            navigate("/reservations/tickets", { replace: true })
            return
          }
        } catch {
          // プロフィール取得失敗時は手入力を許可
        }
      }

      setIsReady(true)
    })

    return () => { mounted = false }
  }, [navigate])

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
    navigate("/reservations/tickets")
  }

  return { isReady, name, setName, email, setEmail, errors, handleNext }
}
