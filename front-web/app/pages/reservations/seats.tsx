import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { draft, type SelectedSeat } from "~/entities/reservation/draft"
import { getAuthState } from "~/shared/api/auth"
import { Header } from "~/widgets/Header"
import { Button } from "~/shared/ui/Button"
import { buildTypeQueue, totalTicketCount } from "~/entities/ticket"

type SeatData = {
  seatId: number
  row: string
  col: number
  positionTopPct: number
  positionLeftPct: number
  seatWidthPct: number
  seatHeightPct: number
  hitRadiusPct: number | null
  status: "available" | "reserved"
}

type Layout = {
  screenId: number
  layoutVersion: number
  backgroundImageUrl: string
  aspectRatio: string
}

type SeatMapData = {
  scheduleId: number
  layout: Layout
  seats: SeatData[]
}

export function SeatsPage() {
  const { scheduleId } = useParams<{ scheduleId: string }>()
  const navigate = useNavigate()
  const [mapData, setMapData] = useState<SeatMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [toastMsg, setToastMsg] = useState("")

  const d = draft.get()
  const ticketCounts = d.ticketCounts
  const requiredCount = ticketCounts ? totalTicketCount(ticketCounts) : 0

  useEffect(() => {
    if (!ticketCounts || requiredCount === 0) {
      navigate("/movies", { replace: true })
    }
  }, [])

  useEffect(() => {
    if (!scheduleId || requiredCount === 0) return
    apiFetch<SeatMapData>(`/reservations/schedules/${scheduleId}/seats`)
      .then(setMapData)
      .catch(err => {
        if (err instanceof ApiError && err.status === 404) navigate("/movies", { replace: true })
      })
      .finally(() => setLoading(false))
  }, [scheduleId])

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 2500)
  }

  function toggleSeat(seat: SeatData) {
    if (seat.status === "reserved") return
    if (selectedIds.includes(seat.seatId)) {
      setSelectedIds(prev => prev.filter(id => id !== seat.seatId))
    } else {
      if (selectedIds.length >= requiredCount) {
        showToast(`選択上限（${requiredCount}席）に達しています。`)
        return
      }
      if (selectedIds.length >= 8) {
        showToast("最大8席まで選択できます。")
        return
      }
      setSelectedIds(prev => [...prev, seat.seatId])
    }
  }

  async function handleConfirm() {
    if (!mapData || !ticketCounts) return
    const typeQueue = buildTypeQueue(ticketCounts)
    const seats = mapData.seats.filter(s => selectedIds.includes(s.seatId))

    const selectedSeats: SelectedSeat[] = selectedIds.map((seatId, i) => {
      const s = seats.find(x => x.seatId === seatId)!
      return { seatId, row: s.row, col: s.col, ticketType: typeQueue[i] ?? "general" }
    })

    draft.set({ selectedSeats, layoutVersion: mapData.layout.layoutVersion })

    const auth = await getAuthState()
    if (auth.authenticated) {
      navigate("/reservations/customer")
    } else {
      navigate("/reservations/entry")
    }
  }

  const seatStatusClass = (seat: SeatData) => {
    if (seat.status === "reserved") return "bg-gray-400 cursor-not-allowed opacity-60"
    if (selectedIds.includes(seat.seatId)) return "bg-red-500 ring-2 ring-red-300 cursor-pointer"
    return "bg-emerald-400 hover:bg-emerald-500 cursor-pointer"
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="mb-4 text-xs text-gray-400">チケット選択 → 座席選択 → お客様情報 → 確認 → 決済</p>
        <h1 className="mb-2 text-xl font-bold">座席を選ぶ</h1>
        <p className="mb-4 text-sm text-gray-500">
          {selectedIds.length} / {requiredCount} 席選択中
        </p>

        <div className="mb-4 flex gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-emerald-400" />空席
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-red-500" />選択中
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-gray-400" />予約済
          </span>
        </div>

        {loading && <p className="text-gray-500">座席データを読み込み中...</p>}
        {mapData && (
          <div
            className="relative w-full overflow-hidden rounded-lg bg-gray-900"
            style={{ aspectRatio: mapData.layout.aspectRatio.replace("/", " / ") }}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded bg-gray-600 px-6 py-0.5 text-xs text-gray-300">
              SCREEN
            </div>
            {mapData.seats.map(seat => (
              <button
                key={seat.seatId}
                onClick={() => toggleSeat(seat)}
                title={`${seat.row}-${seat.col}`}
                style={{
                  position: "absolute",
                  left: `${seat.positionLeftPct}%`,
                  top: `${seat.positionTopPct}%`,
                  width: `${seat.seatWidthPct}%`,
                  height: `${seat.seatHeightPct}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className={`rounded-sm text-white transition-colors ${seatStatusClass(seat)}`}
              />
            ))}
          </div>
        )}

        {selectedIds.length > 0 && mapData && (
          <div className="mt-4 rounded-lg border border-gray-200 p-3">
            <p className="mb-2 text-sm font-medium">選択中の座席</p>
            <div className="flex flex-wrap gap-2">
              {selectedIds.map(id => {
                const s = mapData.seats.find(x => x.seatId === id)!
                return (
                  <span key={id} className="rounded-full bg-red-100 px-3 py-0.5 text-sm text-red-700">
                    {s.row}-{s.col}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <Button
          size="lg"
          className="mt-6"
          disabled={selectedIds.length !== requiredCount}
          onClick={handleConfirm}
        >
          確定して次へ
        </Button>

        {toastMsg && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white shadow-lg">
            {toastMsg}
          </div>
        )}
      </main>
    </>
  )
}
