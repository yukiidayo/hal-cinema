import { Link } from "react-router"
import type { Schedule } from "~/entities/movie/types"
import { formatTimeJst } from "~/shared/lib/date"

type Props = {
  schedules: Schedule[]
  movieId: number
  selectedDate: string
}

export function ScheduleGrid({ schedules, movieId, selectedDate }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {schedules.map((sch) => {
        const isFull = sch.remainingSeats <= 0
        const ratio = sch.remainingSeats / sch.totalSeats
        let symbol = "□"
        let symbolColor = "text-green-400"
        let label = "空席あり"

        if (isFull) {
          symbol = "×"
          symbolColor = "text-red-400"
          label = "満席"
        } else if (ratio <= 0.3) {
          symbol = "△"
          symbolColor = "text-yellow-400"
          label = "残りわずか"
        }

        return (
          <Link
            key={sch.scheduleId}
            to={`/reservations/booking/${movieId}?date=${selectedDate}&scheduleId=${sch.scheduleId}`}
            className={`flex flex-col items-center rounded-lg border p-2 transition-all ${
              !isFull
                ? "border-border hover:border-primary hover:bg-primary/10"
                : "border-border/50 bg-secondary/30 opacity-50 cursor-not-allowed pointer-events-none"
            }`}
          >
            <span className="text-[10px] font-bold text-foreground leading-tight">
              {formatTimeJst(sch.startsAt)}〜{formatTimeJst(sch.endsAt)}
            </span>
            <span className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
              {sch.screenName}
            </span>
            <span className={`mt-1 text-[10px] font-bold leading-tight ${symbolColor}`}>
              {symbol} {label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
