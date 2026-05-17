import {Link} from "react-router"
import {Button} from "~/shared/ui/Button"
import {formatJst} from "~/entities/ticket"
import {useSchedules} from "~/features/movie/useSchedules"
import {DateSelector} from "~/widgets/DateSelector"

export default function MovieDetailPage() {
    const {data, loading, error, days, selectedDate, setDate, selectSchedule} = useSchedules()

    return (
        <div className="py-6">
            <nav className="mb-4 text-sm text-muted-foreground">
                <Link to={`/movies${selectedDate ? `?date=${selectedDate}` : ""}`}
                      className="hover:underline text-muted-foreground">映画一覧</Link>
                <span className="mx-2 text-border">/</span>
                <span className="text-foreground">{data?.movie.title ?? "..."}</span>
            </nav>

            {data && (
                <div className="mb-10 flex flex-col gap-6 md:flex-row">
                    <div className="w-full shrink-0 md:w-64">
                        {data.movie.thumbnailUrl ? (
                            <img src={data.movie.thumbnailUrl} alt={data.movie.title}
                                 className="w-full rounded-xl shadow-lg object-cover"/>
                        ) : (
                            <div
                                className="flex aspect-2/3 w-full items-center justify-center rounded-xl bg-muted text-muted-foreground text-6xl">🎬</div>
                        )}
                    </div>
                    <div className="flex-1">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  data.movie.status === "now_showing" ? "bg-emerald-950 text-emerald-400" : "bg-orange-950 text-orange-400"
              }`}>
                {data.movie.status === "now_showing" ? "上映中" : "上映予定"}
              </span>
                        <h1 className="mt-2 text-3xl font-extrabold text-foreground md:text-4xl">{data.movie.title}</h1>
                        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-medium">{data.movie.durationMin}分</span>
                            <span className="h-1 w-1 rounded-full bg-border"/>
                            <span>2D / 字幕・吹替</span>
                        </div>
                        <div className="mt-6">
                            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">作品紹介</h2>
                            <p className="mt-2 leading-relaxed text-muted-foreground">{data.movie.description}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="border-t border-border pt-8">
                <h2 className="mb-6 text-2xl font-bold text-foreground">上映スケジュール</h2>

                <div className="mb-6">
                    <button
                        onClick={() => setDate("")}
                        className={`mb-3 shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                            !selectedDate ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                        すべて
                    </button>
                    <DateSelector days={days} selectedDate={selectedDate} onSelect={setDate}/>
                </div>

                {loading && <p className="text-muted-foreground">読み込み中...</p>}
                {error && <p className="text-primary">{error}</p>}
                {!loading && !error && data?.schedules.length === 0 && (
                    <p className="text-muted-foreground">選択した日の上映回はありません。</p>
                )}

                <div className="flex flex-col gap-3">
                    {data?.schedules.map(sch => (
                        <div key={sch.scheduleId}
                             className="flex items-center justify-between rounded-lg border border-border p-4">
                            <div>
                                <p className="font-medium">{formatJst(sch.startsAt)} 〜</p>
                                <p className="mt-0.5 text-sm text-muted-foreground">{sch.screenName} ・
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
