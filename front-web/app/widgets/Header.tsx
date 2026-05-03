import { Link } from "react-router"
import { AppConfig } from "~/shared/config/app"

export function Header() {
  return (
    <header className=" bg-gray-300">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold tracking-tight">
          {AppConfig.name}
        </Link>
      </div>
    </header>
  )
}
