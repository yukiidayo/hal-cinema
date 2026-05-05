import {Button} from "~/shared/ui/Button"
import {formatJst} from "~/entities/ticket"
import {useBooking} from "~/features/reservation/useBooking"

export default function BookingPage() {
    const {
        movie, days, selectedDate, setSelectedDate,
        schedules, selectedScheduleId, setSelectedScheduleId,
        mapData, mapLoading, selectedSeatIds, toggleSeat,
        loading, error, toastMsg, handleNext
    } = useBooking()

    if (loading) return <div className="py-20 text-center text-gray-500">読み込み中...</div>
    if (error) return <div className="py-20 text-center text-red-600 font-bold">{error}</div>

    return (
        <div className="py-6">
            <h1 className="text-xl font-bold text-gray-900">予約：{movie?.title}</h1>

            {/* 1. 日付選択 */}
            <div className="mt-6">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">1. 日付を選択</h2>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {days.map(d => (
                        <button
                            key={d.iso}
                            onClick={() => setSelectedDate(d.iso)}
                            className={`shrink-0 rounded-lg border-2 px-4 py-2 text-sm font-bold transition-all ${
                                selectedDate === d.iso ? "border-red-600 bg-red-50 text-red-700" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                            }`}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. 時間選択 */}
            {selectedDate && (
                <div className="mt-8">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">2. 時間を選択</h2>
                    <div className="mt-3 flex flex-wrap gap-3">
                        {schedules.length > 0 ? (
                            schedules.map(sch => (
                                <button
                                    key={sch.scheduleId}
                                    disabled={sch.remainingSeats === 0}
                                    onClick={() => setSelectedScheduleId(sch.scheduleId)}
                                    className={`flex flex-col items-center rounded-xl border-2 px-6 py-3 transition-all ${
                                        selectedScheduleId === sch.scheduleId
                                            ? "border-red-600 bg-red-50 text-red-700 shadow-inner"
                                            : sch.remainingSeats > 0
                                                ? "border-gray-200 bg-white text-gray-900 hover:border-red-300"
                                                : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                                    }`}
                                >
                                    <span className="text-lg font-black">{formatJst(sch.startsAt)}</span>
                                    <span className="mt-0.5 text-[10px] font-bold uppercase">{sch.screenName}</span>
                                    <span
                                        className="mt-1 text-[10px]">{sch.remainingSeats > 0 ? `残${sch.remainingSeats}席` : "満席"}</span>
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400 italic">この日の上映予定はありません。</p>
                        )}
                    </div>
                </div>
            )}

            {/* 3. 座席選択 */}
            {selectedScheduleId && (
                <div className="mt-10 border-t border-gray-100 pt-10">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">3. 座席を選択</h2>
                    <p className="mt-1 text-xs text-gray-400">最大8席まで選択できます</p>

                    <div className="mt-6 flex justify-center gap-6 text-xs font-bold text-gray-500">
                        <span className="flex items-center gap-1.5"><span
                            className="h-3 w-3 rounded-sm bg-emerald-400"/>空席</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-red-500"/>選択中</span>
                        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-gray-300"/>予約済</span>
                    </div>

                    {mapLoading ? (
                        <div
                            className="flex aspect-video w-full items-center justify-center rounded-2xl bg-gray-900 mt-6">
                            <div
                                className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-red-600"/>
                        </div>
                    ) : mapData && (
                        <div
                            className="relative mx-auto mt-6 w-full max-w-2xl overflow-hidden rounded-2xl bg-gray-900 p-8 shadow-2xl"
                            style={{aspectRatio: mapData.layout.aspectRatio.replace("/", " / ")}}>
                            <div
                                className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-gray-800 px-10 py-1 text-[10px] font-black tracking-[0.5em] text-gray-500">SCREEN
                            </div>
                            {mapData.seats.map(seat => (
                                <button
                                    key={seat.seatId}
                                    onClick={() => toggleSeat(seat)}
                                    disabled={seat.status === "reserved"}
                                    style={{
                                        position: "absolute",
                                        left: `${seat.positionLeftPct}%`,
                                        top: `${seat.positionTopPct}%`,
                                        width: `${seat.seatWidthPct}%`,
                                        height: `${seat.seatHeightPct}%`,
                                        transform: "translate(-50%, -50%)"
                                    }}
                                    className={`rounded-sm transition-all duration-200 ${
                                        seat.status === "reserved"
                                            ? "bg-gray-700 opacity-40 cursor-not-allowed"
                                            : selectedSeatIds.includes(seat.seatId)
                                                ? "bg-red-500 ring-4 ring-red-500/30 scale-125 z-10"
                                                : "bg-emerald-400 hover:bg-emerald-300 hover:scale-110"
                                    }`}
                                />
                            ))}
                        </div>
                    )}

                    {selectedSeatIds.length > 0 && (
                        <div
                            className="sticky bottom-6 mt-10 flex items-center justify-between rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">選択中の座席</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {selectedSeatIds.map(id => {
                                        const s = mapData?.seats.find(x => x.seatId === id)
                                        return (
                                            <span key={id}
                                                  className="rounded-md bg-gray-900 px-3 py-1 text-xs font-black text-white">
                          {s?.row}-{s?.col}
                        </span>
                                        )
                                    })}
                                </div>
                            </div>
                            <Button size="lg" className="px-10 h-14 text-lg font-black shadow-lg shadow-red-600/20"
                                    onClick={handleNext}>
                                次へ進む
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {toastMsg && (
                <div
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-gray-900/90 px-6 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-md transition-all animate-bounce">
                    {toastMsg}
                </div>
            )}
        </div>
    )
}
