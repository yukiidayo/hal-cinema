import type { Route } from "./+types/home"
import { Link } from "react-router"
import { AppConfig } from "~/shared/config/app"
import { Header } from "~/widgets/Header"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "HALシネマ" },
    { name: "description", content: "HALシネマのWeb座席予約システム" },
  ]
}

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="mb-4 text-4xl font-bold">{AppConfig.name}ようこそ</h1>
        <p className="mb-8 text-lg">
          上映中の映画をチェックして、座席を予約しましょう。
        </p>
        <Link
          to="/movies"
          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-8 py-3 text-lg font-medium text-white hover:bg-red-700 transition-colors"
        >
          映画一覧を見る
        </Link>
      </main>
    </>
  )
}
