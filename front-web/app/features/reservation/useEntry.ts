import { useEffect } from "react"
import { useNavigate } from "react-router"
import { draft } from "~/entities/reservation/draft"

export function useEntry() {
  const navigate = useNavigate()
  const d = draft.get()

  useEffect(() => {
    if (!d.selectedSeats || d.selectedSeats.length === 0) {
      navigate("/movies", { replace: true })
    }
  }, [])

  function handleGuest() {
    draft.set({ bookingType: "guest" })
    navigate("/reservations/customer")
  }

  return { handleGuest }
}
