import {useState} from "react"
import {useMovies} from "~/features/movie/useMovies"
import {MovieGridCard, MovieListCard} from "~/widgets/MovieCard"

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
                        <MovieGridCard key={movie.id} movie={movie} selectedDate={selectedDate}/>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {movies.map(movie => (
                        <MovieListCard key={movie.id} movie={movie} selectedDate={selectedDate}/>
                    ))}
                </div>
            )}
        </div>
    )
}
