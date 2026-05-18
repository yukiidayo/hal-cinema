import { useNavigate } from "react-router"
import { Button } from "~/shared/ui/Button"
import { useBooking } from "~/features/reservation/useBooking"
import { SeatMap } from "~/widgets/SeatMap"
import { DateSelector } from "~/widgets/DateSelector"
import { ScheduleGrid } from "~/widgets/ScheduleGrid"
import { getAuthState } from "~/shared/api/auth"
import { apiFetch } from "~/shared/api/client"
import { useReservationFlow } from "~/processes/reservation-flow/context"

export default function BookingPage() {
  const navigate = useNavigate()
  const { setBookingType, setCustomer } = useReservationFlow()
  const {
    movie, days, selectedDate, setSelectedDate,
    schedules, selectedScheduleId, setSelectedScheduleId,
    mapData, mapLoading, selectedSeatIds, toggleSeat,
    loading, error, toastMsg, holdSeats, retryLoad,
  } = useBooking()

  async function handleNext() {
    const success = await holdSeats()
    if (!success) return
    const auth = await getAuthState()
    if (auth.authenticated) {
      setBookingType("member")
      try {
        const profile = await apiFetch<{ email: string }>("/members/profile")
        setCustomer({ email: profile.email })
      } catch {}
      navigate("/reservations/tickets")
    } else {
      navigate("/reservations/entry")
    }
  }

  if (loading) return <div className="py-20 text-center text-muted-foreground">読み込み中...</div>
  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="font-bold text-primary">{error}</p>
        <Button className="mt-6" onClick={retryLoad}>再試行</Button>
      </div>
    )
  }

  return (
    <div className="py-6">
      <h1 className="text-xl font-bold text-foreground">予約：{movie?.title}</h1>

      <div className="mt-6">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">1. 日付を選択</h2>
        <DateSelector days={days} selectedDate={selectedDate} onSelect={setSelectedDate} />
      </div>

      {selectedDate && (
        <div className="mt-8">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">2. 時間を選択</h2>
          <div className="mt-3">
            {schedules.length > 0 ? (
              movie && (
                <ScheduleGrid
                  schedules={schedules}
                  movieId={movie.id}
                  selectedDate={selectedDate}
                  selectedScheduleId={selectedScheduleId ?? undefined}
                  onSelect={setSelectedScheduleId}
                />
              )
            ) : (
              <p className="text-sm text-muted-foreground italic">この日の上映予定はありません。</p>
            )}
          </div>
        </div>
      )}

      {selectedScheduleId && (
        <div className="mt-10 border-t border-border pt-10">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">3. 座席を選択</h2>
          <p className="mt-1 text-xs text-muted-foreground">最大8席まで選択できます</p>

          {mapData && (
            <SeatMap
              mapData={mapData}
              mapLoading={mapLoading}
              selectedSeatIds={selectedSeatIds}
              toggleSeat={toggleSeat}
            />
          )}

          {selectedSeatIds.length > 0 && (
            <div className="sticky bottom-6 mt-10 flex items-center justify-between rounded-2xl bg-secondary p-6 shadow-2xl border border-border">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">選択中の座席</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSeatIds.map(id => {
                    const s = mapData?.seats.find(x => x.seatId === id)
                    return (
                      <span key={id} className="rounded-md bg-foreground px-3 py-1 text-xs font-black text-background">
                        {s?.row}-{s?.col}
                      </span>
                    )
                  })}
                </div>
              </div>
              <Button size="lg" className="px-10 h-14 text-lg font-black shadow-lg shadow-primary/20" onClick={handleNext}>
                次へ進む
              </Button>
            </div>
          )}
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-secondary/90 px-6 py-3 text-sm font-bold text-foreground shadow-2xl backdrop-blur-md transition-all animate-bounce">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
