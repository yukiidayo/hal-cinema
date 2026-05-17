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
        <div className="py-8">
            {/* 日付ナビ - カード形式 */}
            <div className="mb-8 flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {days.map((d, i) => {
                    const label = i === 0 ? "今日" : i === 1 ? "明日" : "";
                    const dateObj = new Date(d.iso);
                    const dayNum = dateObj.getDate();
                    const weekDay = dateObj.toLocaleDateString("ja-JP", { weekday: "short" });
                    
                    return (
                        <button
                            key={d.iso}
                            onClick={() => setDate(d.iso)}
                            className={`flex min-w-[100px] flex-col items-center rounded-lg py-3 transition-all ${
                                selectedDate === d.iso 
                                ? "bg-muted ring-1 ring-primary shadow-lg" 
                                : "bg-muted/40 hover:bg-muted"
                            }`}
                        >
                            <span className="text-[10px] font-bold text-muted-foreground">{label || "\u00A0"}</span>
                            <span className={`text-xl font-black ${selectedDate === d.iso ? "text-primary" : "text-foreground"}`}>
                                {dayNum}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground">({weekDay})</span>
                        </button>
                    );
                })}
            </div>

            {/* 検索・フィルタバー */}
            <div className="mb-8 flex items-center gap-4 rounded-xl bg-muted/60 p-4 border border-border">
                <button
                    onClick={() => setStatus("")}
                    className="rounded-md border border-border px-6 py-2 text-sm font-bold text-foreground transition hover:bg-muted"
                >
                    すべて
                </button>
                
                <div className="flex-1" />

                <div className="relative flex items-center">
                    <div className="flex items-center rounded-lg border border-border bg-background px-4 py-2 w-64">
                        <svg className="mr-2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="検索"
                            className="bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground w-full"
                        />
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col items-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"/>
                    <p className="mt-4 text-sm text-muted-foreground font-medium">読み込み中...</p>
                </div>
            )}
            {error && <div className="rounded-xl bg-red-500/10 p-4 text-center text-red-500 font-medium border border-red-500/20">{error}</div>}

            {!loading && !error && movies.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-border py-20 text-center">
                    <p className="text-muted-foreground font-medium">
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
