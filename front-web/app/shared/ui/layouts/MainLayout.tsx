import { Outlet, useLocation } from "react-router"
import { Header } from "~/widgets/Header"
import { Footer } from "~/widgets/Footer"

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/movies': { title: '映画一覧', subtitle: 'Now Showing & Coming Soon' },
  '/member/reservations': { title: '予約履歴', subtitle: 'My Reservations' },
  '/reservations/lookup': { title: '予約確認', subtitle: 'Reservation Lookup' },
  '/shop': { title: 'ショップ', subtitle: 'Shop' },
  '/goods': { title: 'グッズ', subtitle: 'Merchandise' },
}

export default function MainLayout() {
  const { pathname } = useLocation()
  const pageInfo = PAGE_TITLES[pathname]

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* 場所確保: ヘッダー高さ分（表示とは独立） */}
      <div className="h-16 shrink-0" aria-hidden="true" />

      {/* ヘッダー表示: viewport 固定 */}
      <div className="fixed inset-x-0 top-0 z-50">
        <Header />
      </div>

      {pageInfo && (
        <div className="border-b border-border bg-muted/30">
          <div className="container-center py-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
              HAL Cinema
            </p>
            <h1 className="mt-1 text-4xl font-black tracking-tight text-foreground">
              {pageInfo.title}
            </h1>
            {pageInfo.subtitle && (
              <p className="mt-1 text-sm text-muted-foreground font-medium">
                {pageInfo.subtitle}
              </p>
            )}
            <div className="mt-3 h-0.5 w-10 rounded-full bg-primary" />
          </div>
        </div>
      )}

      <main className="container-center flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
