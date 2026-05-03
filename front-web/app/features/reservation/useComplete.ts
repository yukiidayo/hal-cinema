import { useState, useEffect } from "react"

type ReservationResult = {
  reservationId: number
  reservationCode: string
  totalPrice: number
  qrCodeUrl: string
}

export function useComplete() {
  const [result, setResult] = useState<ReservationResult | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem("hal_cinema_last_reservation")
    if (raw) {
      setResult(JSON.parse(raw) as ReservationResult)
      sessionStorage.removeItem("hal_cinema_last_reservation")
    }
  }, [])

  return { result }
}
