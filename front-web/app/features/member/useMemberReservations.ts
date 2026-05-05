import { useState, useEffect } from "react"
import { apiFetch } from "~/shared/api/client"

export type MemberReservation = {
  reservationCode: string
  status: "pending" | "confirmed" | "cancelled"
  totalPrice: number
  createdAt: string
  movieTitle: string
  thumbnailUrl: string | null
  startsAt: string
  endsAt: string
  screenName: string
}

export function useMemberReservations() {
  const [reservations, setReservations] = useState<MemberReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch<{ items: MemberReservation[] }>("/members/reservations")
      .then(data => setReservations(data.items))
      .catch(() => setError("予約情報の取得に失敗しました"))
      .finally(() => setLoading(false))
  }, [])

  return { reservations, loading, error }
}
