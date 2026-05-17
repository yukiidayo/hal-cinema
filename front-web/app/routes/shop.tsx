import type { Route } from "./+types/shop"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "ショップ | HALシネマ" },
    { name: "description", content: "HALシネマのフード＆ドリンクメニュー" },
  ]
}

const MENU_ITEMS = [
  { name: "塩ポップコーン", price: "￥500", category: "Popcorn", icon: "🍿" },
  { name: "キャラメルポップコーン", price: "￥600", category: "Popcorn", icon: "🍿" },
  { name: "コカ・コーラ", price: "￥350", category: "Drink", icon: "🥤" },
  { name: "ホットドッグ", price: "￥550", category: "Food", icon: "🌭" },
  { name: "チュリトス", price: "￥450", category: "Food", icon: "🥨" },
  { name: "プレミアムビール", price: "￥700", category: "Drink", icon: "🍺" },
]

export default function Shop() {
  return (
    <div className="py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-black mb-4">フード＆ドリンク</h1>
        <p className="text-muted-foreground">
          映画鑑賞をさらに楽しく。こだわりのフードとドリンクをご用意しています。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MENU_ITEMS.map((item) => (
          <div key={item.name} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
            <div className="mb-4 text-4xl">{item.icon}</div>
            <div className="mb-1 text-xs font-bold uppercase tracking-widest text-primary/60">{item.category}</div>
            <h3 className="text-lg font-bold mb-2">{item.name}</h3>
            <div className="text-xl font-black">{item.price}</div>
            <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-bold">+</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 p-8 rounded-2xl bg-primary/5 border border-primary/10">
        <h2 className="text-xl font-bold mb-4">モバイルオーダーのご案内</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          HALシネマ公式アプリから、事前にフード・ドリンクを注文いただけます。
          行列に並ばず、指定の時間にカウンターで受け取るだけ。スマートな映画体験を。
        </p>
      </div>
    </div>
  )
}
