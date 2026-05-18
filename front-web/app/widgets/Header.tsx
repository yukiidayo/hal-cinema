import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router"
import { AppConfig } from "~/shared/config/app"
import { useAuth } from "~/shared/api/auth"
import { apiFetch } from "~/shared/api/client"
import { Button } from "~/shared/ui/Button"

export function Header() {
  const { auth, setAuth } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  async function handleLogout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" })
    } catch {
      // ignore
    }
    setAuth({ authenticated: false })
    navigate("/")
    setMenuOpen(false)
  }

  const NAV_LINKS = [
    { to: "/movies", label: "映画一覧" },
    { to: "/shop", label: "ショップ" },
    { to: "/goods", label: "グッズ" },
    { to: "/reservations/lookup", label: "予約確認" },
  ]

  return (
    <>
      <header className="bg-background/80 backdrop-blur-md border-b border-border py-4 relative z-50">
        <div className="container-center flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tighter text-primary" onClick={() => setMenuOpen(false)}>
            {AppConfig.name}
          </Link>

          {/* デスクトップ nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                {label}
              </Link>
            ))}

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

          {/* モバイル: ハンバーガーボタン */}
          <button
            className="md:hidden text-foreground transition-colors p-1"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="メニュー"
          >
            {menuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* フルスクリーンメニュー（モバイル） */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-background md:hidden overflow-y-auto">
          {/* 上部: ロゴ + 閉じるボタン */}
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <Link to="/" className="text-2xl font-black tracking-tighter text-primary" onClick={() => setMenuOpen(false)}>
              {AppConfig.name}
            </Link>
            <button
              className="text-foreground p-1"
              onClick={() => setMenuOpen(false)}
              aria-label="閉じる"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* メニュー本体 */}
          <nav className="flex flex-1 flex-col px-6 pt-8 gap-2">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-4 text-2xl font-black text-foreground hover:bg-muted hover:text-primary transition-colors"
              >
                {label}
              </Link>
            ))}

            <div className="my-4 border-t border-border" />

            {auth.authenticated ? (
              <>
                <Link
                  to="/member/reservations"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-4 text-xl font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  予約履歴
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-xl px-4 py-4 text-left text-xl font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-xl bg-primary px-4 py-4 text-center text-xl font-bold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                ログイン
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
