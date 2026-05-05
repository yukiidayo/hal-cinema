import type { Route } from "./+types/home"
import { Link } from "react-router"
import { AppConfig } from "~/shared/config/app"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "HALシネマ" },
    { name: "description", content: "HALシネマのWeb座席予約システム" },
  ]
}

export default function Home() {
  return (
    <div className="py-16 text-center">
      <h1 className="mb-4 text-4xl font-bold">{AppConfig.name}へようこそ</h1>
      <p className="mb-8 text-lg text-gray-600">
        上映中の映画をチェックして、座席を予約しましょう。
      </p>
      <Link
        to="/movies"
        className="inline-flex items-center justify-center rounded-lg bg-red-600 px-8 py-3 text-lg font-bold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
      >
        映画一覧を見る
      </Link>
    </div>
  )
}
