import { Link } from "react-router"

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold text-red-600 tracking-tight">
          HALシネマ
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            to="/movies"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            映画一覧
          </Link>
          <Link
            to="/reservations/lookup"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            予約確認
          </Link>
        </nav>
      </div>
    </header>
  )
}
