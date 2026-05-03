import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate, Link } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { Header } from "~/widgets/Header"
import { Button } from "~/shared/ui/Button"
import { formatJst } from "~/entities/ticket"
import { getNext7Days } from "~/shared/lib/date"
import type { Movie, Schedule } from "~/entities/movie/types"

export function SchedulesPage() {
  const { movieId } = useParams<{ movieId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedDate = searchParams.get("date") ?? ""
  const navigate = useNavigate()

  const [data, setData] = useState<{ movie: Movie; schedules: Schedule[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const days = getNext7Days()

  useEffect(() => {
    if (!movieId) return
    setLoading(true)
    setError("")
    const qs = selectedDate ? `?date=${selectedDate}` : ""
    apiFetch<{ movie: Movie; schedules: Schedule[] }>(`/movies/${movieId}/schedules${qs}`)
      .then(setData)
      .catch(err => {
        if (err instanceof ApiError && err.status === 404) navigate("/movies", { replace: true })
        else setError("読み込みに失敗しました")
      })
      .finally(() => setLoading(false))
  }, [movieId, selectedDate])

  function selectSchedule(scheduleId: number) {
    navigate(`/reservations/tickets/${scheduleId}`)
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* パンくず */}
        <nav className="mb-4 text-sm text-gray-500">
          <Link to="/movies" className="hover:underline">映画一覧</Link>
          <span className="mx-2">/</span>
          <span>{data?.movie.title ?? "..."}</span>
        </nav>

        {/* 映画ヘッダー */}
        {data && (
          <div className="mb-6 flex gap-4">
            {data.movie.thumbnailUrl && (
              <img
                src={data.movie.thumbnailUrl}
                alt={data.movie.title}
                className="w-24 shrink-0 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{data.movie.title}</h1>
              <p className="mt-1 text-sm text-gray-500">{data.movie.durationMin}分</p>
              <p className="mt-2 text-sm text-gray-600 line-clamp-3">{data.movie.description}</p>
            </div>
          </div>
        )}

        {/* 日付ナビ */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSearchParams(p => { const n = new URLSearchParams(p); n.delete("date"); return n })}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              !selectedDate ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            すべて
          </button>
          {days.map(d => (
            <button
              key={d.iso}
              onClick={() => setSearchParams(p => { const n = new URLSearchParams(p); n.set("date", d.iso); return n })}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedDate === d.iso ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <h2 className="mb-3 text-lg font-bold">上映回を選ぶ</h2>

        {loading && <p className="text-gray-500">読み込み中...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && data?.schedules.length === 0 && (
          <p className="text-gray-500">選択した日の上映回はありません。</p>
        )}

        <div className="flex flex-col gap-3">
          {data?.schedules.map(sch => (
            <div
              key={sch.scheduleId}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
            >
              <div>
                <p className="font-medium">{formatJst(sch.startsAt)} 〜</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {sch.screenName} ・ 残{sch.remainingSeats}席
                </p>
              </div>
              <Button
                size="sm"
                disabled={sch.remainingSeats === 0}
                onClick={() => selectSchedule(sch.scheduleId)}
              >
                {sch.remainingSeats === 0 ? "満席" : "選ぶ"}
              </Button>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
