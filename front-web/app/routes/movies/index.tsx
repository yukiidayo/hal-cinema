import {useState} from "react"
import {Link} from "react-router"
import {useMovies} from "~/features/movie/useMovies"
import {formatJst} from "~/entities/ticket"

export default function MoviesPage() {
    const {
        movies,
        loading,
        error,
        days,
        selectedDate,
        selectedStatus,
        sortBy,
        setDate,
        setStatus,
        setSort
    } = useMovies()
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

    return (
        <div className="py-6">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">映画一覧</h1>
                    {/* 日付ナビ */}
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <button
                            onClick={() => setDate("")}
                            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                !selectedDate ? "bg-red-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            すべて
                        </button>
                        {days.map(d => (
                            <button
                                key={d.iso}
                                onClick={() => setDate(d.iso)}
                                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                    selectedDate === d.iso ? "bg-red-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* 表示モード切り替え */}
                    <div className="flex rounded-lg bg-gray-100 p-1">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`rounded-md px-3 py-1 text-xs font-bold transition ${viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            グリッド
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`rounded-md px-3 py-1 text-xs font-bold transition ${viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            リスト
                        </button>
                    </div>

                    {/* ソート */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSort(e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                        <option value="newest">新着順</option>
                        <option value="title">名前順</option>
                        <option value="duration">上映時間順</option>
                    </select>
                </div>
            </div>

            {/* ステータスフィルタ */}
            <div className="mb-8 flex gap-2">
                {(["", "now_showing", "coming_soon"] as const).map(s => (
                    <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`rounded-full px-4 py-1 text-sm font-medium transition ${
                            selectedStatus === s ? "bg-gray-800 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        {s === "" ? "すべて" : s === "now_showing" ? "上映中" : "上映予定"}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="flex flex-col items-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"/>
                    <p className="mt-4 text-sm text-gray-500 font-medium">読み込み中...</p>
                </div>
            )}
            {error && <div className="rounded-xl bg-red-50 p-4 text-center text-red-600 font-medium">{error}</div>}

            {!loading && !error && movies.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
                    <p className="text-gray-500 font-medium">
                        {selectedDate ? "選択した日の上映はありません。" : "該当する映画が見つかりません。"}
                    </p>
                </div>
            )}

            {viewMode === "grid" ? (
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {movies.map(movie => (
                        <Link key={movie.id} to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
                              className="group block">
                            <div
                                className="relative aspect-2/3 overflow-hidden rounded-xl bg-gray-100 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                                {movie.thumbnailUrl ? (
                                    <img
                                        src={movie.thumbnailUrl}
                                        alt={movie.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div
                                        className="flex h-full items-center justify-center text-gray-300 text-5xl">🎬</div>
                                )}
                                <div className="absolute top-2 right-2">
                    <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${
                            movie.status === "now_showing" ? "bg-green-500/90" : "bg-orange-500/90"
                        }`}>
                      {movie.status === "now_showing" ? "上映中" : "予定"}
                    </span>
                                </div>
                            </div>
                            <div className="mt-3">
                                <h2 className="line-clamp-2 text-sm font-bold leading-tight text-gray-900 group-hover:text-red-600 transition-colors">{movie.title}</h2>
                                <p className="mt-1 text-xs text-gray-500 font-medium">{movie.durationMin}分</p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {movies.map(movie => (
                        <div key={movie.id}
                             className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:flex-row">
                            <Link to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
                                  className="block w-full shrink-0 sm:w-40 md:w-48">
                                <div className="aspect-2/3 sm:aspect-auto sm:h-full bg-gray-100">
                                    {movie.thumbnailUrl ? (
                                        <img src={movie.thumbnailUrl} alt={movie.title}
                                             className="h-full w-full object-cover"/>
                                    ) : (
                                        <div
                                            className="flex h-full items-center justify-center text-gray-300 text-4xl">🎬</div>
                                    )}
                                </div>
                            </Link>
                            <div className="flex flex-1 flex-col p-5">
                                <div className="mb-4">
                                    <Link to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
                                          className="hover:text-red-600 transition-colors">
                                        <h2 className="text-xl font-extrabold text-gray-900">{movie.title}</h2>
                                    </Link>
                                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 font-medium">
                                        <span>{movie.durationMin}分</span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                movie.status === "now_showing" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                            }`}>
                        {movie.status === "now_showing" ? "上映中" : "上映予定"}
                      </span>
                                    </div>
                                </div>

                                {movie.schedules && movie.schedules.length > 0 ? (
                                    <div
                                        className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                                        {movie.schedules.map(sch => (
                                            <Link
                                                key={sch.scheduleId}
                                                to={`/reservations/booking/${movie.id}?date=${selectedDate}&scheduleId=${sch.scheduleId}`}
                                                className={`flex flex-col items-center rounded-lg border p-2 transition-all ${
                                                    sch.remainingSeats > 0
                                                        ? "border-gray-200 hover:border-red-500 hover:bg-red-50"
                                                        : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                                }`}
                                            >
                                                <span
                                                    className="text-sm font-bold text-gray-900">{formatJst(sch.startsAt)}</span>
                                                <span
                                                    className="mt-0.5 text-[10px] text-gray-500">{sch.remainingSeats > 0 ? `残${sch.remainingSeats}席` : "満席"}</span>
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
                    ))}
                </div>
            )}
        </div>
    )
}
