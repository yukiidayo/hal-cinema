import {Button} from "~/shared/ui/Button"
import {formatJst} from "~/entities/ticket"
import {useBooking} from "~/features/reservation/useBooking"
import {SeatMap} from "~/widgets/SeatMap"
import {DateSelector} from "~/widgets/DateSelector"

export default function BookingPage() {
    const {
        movie, days, selectedDate, setSelectedDate,
        schedules, selectedScheduleId, setSelectedScheduleId,
        mapData, mapLoading, selectedSeatIds, toggleSeat,
        loading, error, toastMsg, handleNext, retryLoad
    } = useBooking()

    if (loading) return <div className="py-20 text-center text-muted-foreground">読み込み中...</div>
    if (error) {
        return (
            <div className="py-20 text-center">
                <p className="font-bold text-primary">{error}</p>
                <Button className="mt-6" onClick={retryLoad}>再試行</Button>
            </div>
        )
    }

    return (
        <div className="py-6">
            <h1 className="text-xl font-bold text-foreground">予約：{movie?.title}</h1>

            {/* 1. 日付選択 */}
            <div className="mt-6">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">1. 日付を選択</h2>
                <DateSelector days={days} selectedDate={selectedDate} onSelect={setSelectedDate} />
            </div>

            {/* 2. 時間選択 */}
            {selectedDate && (
                <div className="mt-8">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">2. 時間を選択</h2>
                    <div className="mt-3 flex flex-wrap gap-3">
                        {schedules.length > 0 ? (
                            schedules.map(sch => (
                                <button
                                    key={sch.scheduleId}
                                    disabled={sch.remainingSeats === 0}
                                    onClick={() => setSelectedScheduleId(sch.scheduleId)}
                                    className={`flex flex-col items-center rounded-xl border-2 px-6 py-3 transition-all ${
                                        selectedScheduleId === sch.scheduleId
                                            ? "border-primary bg-muted text-primary shadow-lg shadow-primary/10"
                                            : sch.remainingSeats > 0
                                                ? "border-border bg-secondary text-foreground hover:border-primary/50"
                                                : "border-border bg-muted/40 text-muted-foreground/50 cursor-not-allowed"
                                    }`}
                                >
                                    <span className="text-lg font-black">{formatJst(sch.startsAt)}</span>
                                    <span className="mt-0.5 text-[10px] font-bold uppercase">{sch.screenName}</span>
                                    <span
                                        className="mt-1 text-[10px]">{sch.remainingSeats > 0 ? `残${sch.remainingSeats}席` : "満席"}</span>
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground italic">この日の上映予定はありません。</p>
                        )}
                    </div>
                </div>
            )}

            {/* 3. 座席選択 */}
            {selectedScheduleId && (
                <div className="mt-10 border-t border-border pt-10">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">3. 座席を選択</h2>
                    <p className="mt-1 text-xs text-muted-foreground">最大8席まで選択できます</p>

                    {mapData && (
                        <SeatMap
                            mapData={mapData}
                            mapLoading={mapLoading}
                            selectedSeatIds={selectedSeatIds}
                            toggleSeat={toggleSeat}
                        />
                    )}

                    {selectedSeatIds.length > 0 && (
                        <div
                            className="sticky bottom-6 mt-10 flex items-center justify-between rounded-2xl bg-secondary p-6 shadow-2xl border border-border">
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase">選択中の座席</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {selectedSeatIds.map(id => {
                                        const s = mapData?.seats.find(x => x.seatId === id)
                                        return (
                                            <span key={id}
                                                  className="rounded-md bg-foreground px-3 py-1 text-xs font-black text-background">
                          {s?.row}-{s?.col}
                        </span>
                                        )
                                    })}
                                </div>
                            </div>
                            <Button size="lg" className="px-10 h-14 text-lg font-black shadow-lg shadow-primary/20"
                                    onClick={handleNext}>
                                次へ進む
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {toastMsg && (
                <div
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-secondary/90 px-6 py-3 text-sm font-bold text-foreground shadow-2xl backdrop-blur-md transition-all animate-bounce">
                    {toastMsg}
                </div>
            )}
        </div>
    )
}
