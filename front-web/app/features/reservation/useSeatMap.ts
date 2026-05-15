import { useState, useEffect } from "react"
import { apiFetch } from "~/shared/api/client"

export type SeatData = {
  seatId: number
  row: string
  col: number
  positionTopPct: number
  positionLeftPct: number
  seatWidthPct: number
  seatHeightPct: number
  status: "available" | "reserved"
}

export type SeatMapData = {
  scheduleId: number
  layout: {
    aspectRatio: string
    layoutVersion: number
  }
  seats: SeatData[]
}

export function useSeatMap(selectedScheduleId: number | null) {
  const [mapData, setMapData] = useState<SeatMapData | null>(null)
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([])
  const [mapLoading, setMapLoading] = useState(false)
  const [error, setError] = useState("")
  const [toastMsg, setToastMsg] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!selectedScheduleId) {
      setMapData(null)
      setSelectedSeatIds([])
      setError("")
      return
    }

    setMapLoading(true)
    setError("")
    apiFetch<SeatMapData>(`/reservations/schedules/${selectedScheduleId}/seats`)
      .then(data => {
        setMapData(data)
        setError("")
      })
      .catch(() => {
        setMapData(null)
        setSelectedSeatIds([])
        setError("座席情報の取得に失敗しました")
      })
      .finally(() => setMapLoading(false))
  }, [selectedScheduleId, reloadKey])

  function retryLoadSeatMap() {
    setReloadKey(prev => prev + 1)
  }

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 2500)
  }

  function toggleSeat(seat: SeatData) {
    if (seat.status === "reserved") return
    if (selectedSeatIds.includes(seat.seatId)) {
      setSelectedSeatIds(prev => prev.filter(id => id !== seat.seatId))
    } else {
      if (selectedSeatIds.length >= 8) {
        showToast("最大8席まで選択できます。")
        return
      }
      setSelectedSeatIds(prev => [...prev, seat.seatId])
    }
  }

  return {
    mapData,
    mapLoading,
    selectedSeatIds,
    toggleSeat,
    error,
    toastMsg,
    showToast,
    retryLoadSeatMap,
  }
}
