import type { Route } from "./+types/home"
export { HomePage as default } from "~/pages/home"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "HALシネマ" },
    { name: "description", content: "HALシネマのWeb座席予約システム" },
  ]
}
