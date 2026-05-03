import { useState } from "react"
import { useNavigate } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { Header } from "~/widgets/Header"
import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"

export function LookupPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError("予約番号を入力してください"); return }
    setError("")
    setLoading(true)
    try {
      await apiFetch(`/reservations/${trimmed}`)
      navigate(`/reservations/r/${trimmed}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("予約が見つかりませんでした。予約番号をご確認ください。")
      } else {
        setError("エラーが発生しました。再度お試しください。")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold">予約確認</h1>
        <p className="mb-6 text-sm text-gray-500">
          予約番号を入力して予約内容を確認できます。
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="code"
            label="予約番号"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))}
            placeholder="例：ABCD1234"
            autoComplete="off"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "検索中..." : "予約を確認する"}
          </Button>
        </form>
      </main>
    </>
  )
}
