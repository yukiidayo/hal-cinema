import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { draft } from "~/entities/reservation/draft"
import { getAuthState } from "~/shared/api/auth"

export function useCustomerForm() {
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

  return { name, setName, email, setEmail, errors, handleNext }
}
