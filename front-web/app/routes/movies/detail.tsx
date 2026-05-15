import {Link} from "react-router"
import {Button} from "~/shared/ui/Button"
import {formatJst} from "~/entities/ticket"
import {useSchedules} from "~/features/movie/useSchedules"

export default function MovieDetailPage() {
    const {data, loading, error, days, selectedDate, setDate, selectSchedule} = useSchedules()

    return (
        <div className="py-6">
            <nav className="mb-4 text-sm text-gray-500">
                <Link to={`/movies${selectedDate ? `?date=${selectedDate}` : ""}`}
                      className="hover:underline text-gray-400">映画一覧</Link>
                <span className="mx-2 text-gray-300">/</span>
                <span className="text-gray-700">{data?.movie.title ?? "..."}</span>
            </nav>

            {data && (
                <div className="mb-10 flex flex-col gap-6 md:flex-row">
                    <div className="w-full shrink-0 md:w-64">
                        {data.movie.thumbnailUrl ? (
                            <img src={data.movie.thumbnailUrl} alt={data.movie.title}
                                 className="w-full rounded-xl shadow-lg object-cover"/>
                        ) : (
                            <div
                                className="flex aspect-2/3 w-full items-center justify-center rounded-xl bg-gray-100 text-gray-400 text-6xl">🎬</div>
                        )}
                    </div>
                    <div className="flex-1">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  data.movie.status === "now_showing" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
              }`}>
                {data.movie.status === "now_showing" ? "上映中" : "上映予定"}
              </span>
                        <h1 className="mt-2 text-3xl font-extrabold text-gray-900 md:text-4xl">{data.movie.title}</h1>
                        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                            <span className="font-medium">{data.movie.durationMin}分</span>
                            <span className="h-1 w-1 rounded-full bg-gray-300"/>
                            <span>2D / 字幕・吹替</span>
                        </div>
                        <div className="mt-6">
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">作品紹介</h2>
                            <p className="mt-2 leading-relaxed text-gray-600">{data.movie.description}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="border-t border-gray-100 pt-8">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">上映スケジュール</h2>

                <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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

                {loading && <p className="text-gray-500">読み込み中...</p>}
                {error && <p className="text-red-600">{error}</p>}
                {!loading && !error && data?.schedules.length === 0 && (
                    <p className="text-gray-500">選択した日の上映回はありません。</p>
                )}

                <div className="flex flex-col gap-3">
                    {data?.schedules.map(sch => (
                        <div key={sch.scheduleId}
                             className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                            <div>
                                <p className="font-medium">{formatJst(sch.startsAt)} 〜</p>
                                <p className="mt-0.5 text-sm text-gray-500">{sch.screenName} ・
                                    残{sch.remainingSeats}席</p>
                            </div>
                            <Button size="sm" disabled={sch.remainingSeats === 0}
                                    onClick={() => selectSchedule(sch.scheduleId)}>
                                {sch.remainingSeats === 0 ? "満席" : "選ぶ"}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
