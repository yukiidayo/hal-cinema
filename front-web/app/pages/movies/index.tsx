import { Link } from "react-router"
import { Header } from "~/widgets/Header"
import { useMovies } from "~/features/movie/useMovies"

export function MoviesPage() {
  const { movies, loading, error, days, selectedDate, selectedStatus, setDate, setStatus } = useMovies()

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold">映画一覧</h1>

        {/* 日付ナビ */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setDate("")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              !selectedDate ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            すべて
          </button>
          {days.map(d => (
            <button
              key={d.iso}
              onClick={() => setDate(d.iso)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedDate === d.iso ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* ステータスフィルタ */}
        <div className="mb-6 flex gap-2">
          {(["", "now_showing", "coming_soon"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-4 py-1 text-sm font-medium transition ${
                selectedStatus === s ? "bg-red-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "" ? "すべて" : s === "now_showing" ? "上映中" : "上映予定"}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-500">読み込み中...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && movies.length === 0 && (
          <p className="text-gray-500">
            {selectedDate ? "選択した日の上映はありません。" : "映画が見つかりません。"}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {movies.map(movie => (
            <Link
              key={movie.id}
              to={`/movies/${movie.id}/schedules`}
              className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-[2/3] overflow-hidden bg-gray-100">
                {movie.thumbnailUrl ? (
                  <img
                    src={movie.thumbnailUrl}
                    alt={movie.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-4xl">🎬</div>
                )}
              </div>
              <div className="p-3">
                <h2 className="line-clamp-2 text-sm font-bold leading-tight">{movie.title}</h2>
                <p className="mt-1 text-xs text-gray-500">{movie.durationMin}分</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  movie.status === "now_showing"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}>
                  {movie.status === "now_showing" ? "上映中" : "上映予定"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
