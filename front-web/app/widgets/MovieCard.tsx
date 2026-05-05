import { Link } from "react-router"
import type { Movie } from "~/entities/movie/types"
import { formatJst } from "~/entities/ticket"

type Props = {
  movie: Movie
  selectedDate: string
}

export function MovieGridCard({ movie, selectedDate }: Props) {
  return (
    <Link
      to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
      className="group block"
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-gray-100 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        {movie.thumbnailUrl ? (
          <img
            src={movie.thumbnailUrl}
            alt={movie.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300 text-5xl">🎬</div>
        )}
        <div className="absolute top-2 right-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${
              movie.status === "now_showing" ? "bg-green-500/90" : "bg-orange-500/90"
            }`}
          >
            {movie.status === "now_showing" ? "上映中" : "予定"}
          </span>
        </div>
      </div>
      <div className="mt-3">
        <h2 className="line-clamp-2 text-sm font-bold leading-tight text-gray-900 group-hover:text-red-600 transition-colors">
          {movie.title}
        </h2>
        <p className="mt-1 text-xs text-gray-500 font-medium">{movie.durationMin}分</p>
      </div>
    </Link>
  )
}

export function MovieListCard({ movie, selectedDate }: Props) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:flex-row">
      <Link
        to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
        className="block w-full shrink-0 sm:w-40 md:w-48"
      >
        <div className="aspect-2/3 sm:aspect-auto sm:h-full bg-gray-100">
          {movie.thumbnailUrl ? (
            <img src={movie.thumbnailUrl} alt={movie.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300 text-4xl">🎬</div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4">
          <Link
            to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
            className="hover:text-red-600 transition-colors"
          >
            <h2 className="text-xl font-extrabold text-gray-900">{movie.title}</h2>
          </Link>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 font-medium">
            <span>{movie.durationMin}分</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                movie.status === "now_showing" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
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
                    ? "border-gray-200 hover:border-red-500 hover:bg-red-50"
                    : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                }`}
              >
                <span className="text-sm font-bold text-gray-900">{formatJst(sch.startsAt)}</span>
                <span className="mt-0.5 text-[10px] text-gray-500">
                  {sch.remainingSeats > 0 ? `残${sch.remainingSeats}席` : "満席"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-auto text-sm text-gray-400 font-medium italic">
            {selectedDate ? "本日の上映はありません。" : "日付を選択してスケジュールを表示"}
          </p>
        )}
      </div>
    </div>
  )
}
