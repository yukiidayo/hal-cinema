import { Link } from "react-router"
import type { Movie } from "~/entities/movie/types"
import { formatJst } from "~/entities/ticket"

type Props = {
  movie: Movie
  selectedDate: string
}

export function MovieGridCard({ movie, selectedDate }: Props) {
  return (
    <div className="group flex flex-col gap-3">
      <Link
        to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
        className="relative aspect-2/3 overflow-hidden rounded-lg bg-muted shadow-lg transition-transform duration-300 group-hover:-translate-y-1"
      >
        {movie.thumbnailUrl ? (
          <img
            src={movie.thumbnailUrl}
            alt={movie.title}
            className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-60"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-5xl">🎬</div>
        )}
        
        {/* Hover Reserve Button */}
        <div className="absolute inset-0 flex items-end justify-center p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Link
            to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
            className="w-full rounded-md bg-primary py-2 text-center text-sm font-bold text-primary-foreground shadow-xl transition-transform duration-300 translate-y-2 group-hover:translate-y-0"
          >
            予約
          </Link>
        </div>
      </Link>

      <div className="flex flex-col gap-1.5 px-0.5">
        <Link
          to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
          className="line-clamp-2 text-sm font-bold leading-tight text-foreground transition-colors hover:text-primary"
        >
          {movie.title}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {movie.status === "now_showing" ? (
            <span className="rounded bg-green-900/40 px-1.5 py-0.5 text-[10px] font-bold text-green-400">
              上映中
            </span>
          ) : (
            <span className="rounded bg-orange-900/40 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
              上映予定
            </span>
          )}
          <span className="text-[10px] font-medium text-muted-foreground">
            {movie.durationMin}分
          </span>
        </div>
      </div>
    </div>
  )
}

export function MovieListCard({ movie, selectedDate }: Props) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-secondary/50 shadow-sm sm:flex-row">
      <Link
        to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
        className="block w-full shrink-0 sm:w-40 md:w-48"
      >
        <div className="aspect-2/3 sm:aspect-auto sm:h-full bg-secondary">
          {movie.thumbnailUrl ? (
            <img src={movie.thumbnailUrl} alt={movie.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-4xl">🎬</div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4">
          <Link
            to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
            className="hover:text-primary transition-colors"
          >
            <h2 className="text-xl font-extrabold text-foreground">{movie.title}</h2>
          </Link>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground font-medium">
            <span>{movie.durationMin}分</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                movie.status === "now_showing" ? "bg-green-600/20 text-green-400" : "bg-orange-600/20 text-orange-400"
              }`}
            >
              {movie.status === "now_showing" ? "上映中" : "上映予定"}
            </span>
          </div>
        </div>

        {movie.schedules && movie.schedules.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {movie.schedules.map((sch) => (
              <Link
                key={sch.scheduleId}
                to={`/reservations/booking/${movie.id}?date=${selectedDate}&scheduleId=${sch.scheduleId}`}
                className={`flex flex-col items-center rounded-lg border p-2 transition-all ${
                  sch.remainingSeats > 0
                    ? "border-border hover:border-primary hover:bg-primary/10"
                    : "border-border/50 bg-secondary/30 opacity-50 cursor-not-allowed"
                }`}
              >
                <span className="text-sm font-bold text-foreground">{formatJst(sch.startsAt)}</span>
                <span className="mt-0.5 text-[10px] text-muted-foreground">
                  {sch.remainingSeats > 0 ? `残${sch.remainingSeats}席` : "満席"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-auto text-sm text-muted-foreground font-medium italic">
            {selectedDate ? "本日の上映はありません。" : "日付を選択してスケジュールを表示"}
          </p>
        )}
      </div>
    </div>
  )
}
