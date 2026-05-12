import { useEffect, useState } from "react"
import { useLocation, useNavigate, Link } from "react-router"
import { draft } from "~/entities/reservation/draft"

export function HoldTimer() {
  const location = useLocation()
  const navigate = useNavigate()
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  // すべての画面で表示するが、デザインを変える
  const isReservationFlow = location.pathname.startsWith("/reservations/")
  const isAuthFlow = location.pathname.startsWith("/login") || location.pathname.startsWith("/register") || location.pathname.startsWith("/auth/otp")

  useEffect(() => {
    const updateTimer = () => {
      const d = draft.get()
      if (!d.expiresAt || !d.reservationCode) {
        setTimeLeft(null)
        setIsExpired(false)
        return
      }

      const expiry = new Date(d.expiresAt).getTime()
      const now = Date.now()
      const diff = Math.floor((expiry - now) / 1000)

      if (diff <= 0) {
        setTimeLeft(0)
        if (!isExpired) {
          setIsExpired(true)
          handleExpire()
        }
      } else {
        setTimeLeft(diff)
        setIsExpired(false)
      }
    }

    const interval = setInterval(updateTimer, 1000)
    updateTimer()

    return () => clearInterval(interval)
  }, [location.pathname, isExpired])

  function getResumeUrl(): string {
    const d = draft.get()
    if (!d.bookingType) return "/reservations/entry"
    if (!d.customer) return "/reservations/customer"
    return "/reservations/tickets"
  }

  function handleExpire() {
    const d = draft.get()
    if (!d.reservationCode) return // すでにクリアされていれば何もしない

    draft.clear()
    alert("予約の有効期限が切れました。座席を選び直してください。")
    navigate("/movies")
  }

  if (timeLeft === null) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="bg-red-600 text-white py-2 px-4 z-40 flex justify-center items-center gap-6 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest">Seat Secured</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-xs font-bold text-red-100">予約完了まであと</span>
        <span className={`font-mono text-xl font-black ${timeLeft < 60 ? 'animate-pulse' : ''}`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>

      {!isReservationFlow && !isAuthFlow && (
        <Link to={getResumeUrl()} className="rounded-full bg-white px-4 py-1 text-xs font-black text-red-600 hover:bg-red-50 transition-colors shadow-sm">
          予約に戻る
        </Link>
      )}
    </div>
  )
}
