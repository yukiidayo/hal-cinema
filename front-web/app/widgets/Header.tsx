import { Link, useNavigate } from "react-router"
import { useEffect, useState } from "react"
import { AppConfig } from "~/shared/config/app"
import { getAuthState, type AuthState } from "~/shared/api/auth"
import { apiFetch } from "~/shared/api/client"
import { Button } from "~/shared/ui/Button"

export function Header() {
  const [auth, setAuth] = useState<AuthState>({ authenticated: false })
  const navigate = useNavigate()

  useEffect(() => {
    getAuthState().then(setAuth)
  }, [])

  async function handleLogout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" })
      setAuth({ authenticated: false })
      navigate("/")
    } catch {
      // Ignore error
    }
  }

  return (
    <header className="bg-white border-b border-gray-100 z-50 py-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-2xl font-black tracking-tighter text-red-600">
          {AppConfig.name}
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/reservations/lookup" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
            予約確認
          </Link>
          
          <div className="h-4 w-px bg-gray-200" />

          {auth.authenticated ? (
            <div className="flex items-center gap-4">
              <Link to="/member/reservations" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                予約履歴
              </Link>
              <div className="h-4 w-px bg-gray-200" />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="font-bold">
                ログアウト
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="primary" size="sm" className="font-bold px-6">
                ログイン
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
