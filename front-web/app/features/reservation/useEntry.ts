import { useEffect } from "react"
import { useNavigate } from "react-router"
import { draft } from "~/entities/reservation/draft"
import { getEntryGuardIssue } from "~/processes/reservation-flow/guards"

export function useEntry() {
  const navigate = useNavigate()
  const d = draft.get()

  useEffect(() => {
    const issue = getEntryGuardIssue(d)
    if (issue) {
      navigate(issue.redirectTo, { replace: true })
    }
  }, [])

  function handleGuest() {
    draft.set({ bookingType: "guest" })
    navigate("/reservations/customer")
  }

  return { handleGuest }
}
