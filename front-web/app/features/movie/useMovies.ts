import { useState, useEffect } from "react"
import { useSearchParams } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { getNext7Days } from "~/shared/lib/date"
import type { Movie } from "~/entities/movie/types"

export function useMovies() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedDate = searchParams.get("date") ?? ""
  const selectedStatus = (searchParams.get("status") ?? "") as "" | "now_showing" | "coming_soon"

  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const days = getNext7Days()

  useEffect(() => {
    setLoading(true)
    setError("")
    const params = new URLSearchParams()
    if (selectedDate) params.set("date", selectedDate)
    if (selectedStatus) params.set("status", selectedStatus)
    const qs = params.toString()
    apiFetch<{ items: Movie[] }>(`/movies${qs ? `?${qs}` : ""}`)
      .then(d => setMovies(d.items))
      .catch(err => setError(err instanceof ApiError ? err.message : "読み込みに失敗しました"))
      .finally(() => setLoading(false))
  }, [selectedDate, selectedStatus])

  function setDate(date: string) {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      if (date) p.set("date", date); else p.delete("date")
      return p
    })
  }

  function setStatus(status: string) {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      if (status) p.set("status", status); else p.delete("status")
      return p
    })
  }

  return { movies, loading, error, days, selectedDate, selectedStatus, setDate, setStatus }
}
