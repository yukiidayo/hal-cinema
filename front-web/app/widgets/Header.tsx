import { Link, useNavigate } from "react-router"
import { AppConfig } from "~/shared/config/app"
import { useAuth } from "~/shared/api/auth"
import { apiFetch } from "~/shared/api/client"
import { Button } from "~/shared/ui/Button"

export function Header() {
  const { auth, setAuth } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" })
    } catch {
      // ignore
    }
    setAuth({ authenticated: false })
    navigate("/")
  }

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border z-50 py-4 sticky top-0">
      <div className="container-center flex items-center justify-between">
        <Link to="/" className="text-2xl font-black tracking-tighter text-primary">
          {AppConfig.name}
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/shop" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
            ショップ
          </Link>
          <Link to="/goods" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
            グッズ
          </Link>
          <Link to="/reservations/lookup" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
            予約確認
          </Link>

          <div className="h-4 w-px bg-border" />

          <button className="relative text-muted-foreground hover:text-foreground transition-colors">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              0
            </span>
          </button>

          <div className="h-4 w-px bg-border" />

          {auth.authenticated ? (
            <div className="flex items-center gap-4">
              <Link to="/member/reservations" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                予約履歴
              </Link>
              <div className="h-4 w-px bg-border" />
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
