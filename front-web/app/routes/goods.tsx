import type { Route } from "./+types/goods"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "グッズ | HALシネマ" },
    { name: "description", content: "映画関連グッズ・オリジナルアイテム" },
  ]
}

const GOODS_ITEMS = [
  { name: "パンフレット", price: "￥800", description: "上映作品のメイキングや解説が充実。", tag: "Recommend" },
  { name: "クリアファイルセット", price: "￥600", description: "オリジナルデザインの2枚組セット。", tag: "New" },
  { name: "ポスターカレンダー", price: "￥1,200", description: "名シーンを収めた2026年度版カレンダー。", tag: "Limited" },
  { name: "シネマトートバッグ", price: "￥1,800", description: "丈夫なキャンバス地のオリジナルバッグ。", tag: "Recommend" },
]

export default function Goods() {
  return (
    <div className="py-16">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-4">グッズショップ</h1>
          <p className="text-muted-foreground">
            ここでしか手に入らない限定アイテムや公式パンフレット。
          </p>
        </div>
        <div className="text-sm font-bold text-primary bg-primary/10 px-4 py-2 rounded-full">
          オンラインストアCOMING SOON
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {GOODS_ITEMS.map((item) => (
          <div key={item.name} className="flex gap-6 p-6 rounded-2xl border border-border bg-card hover:bg-accent/50 transition-colors group">
            <div className="h-32 w-32 shrink-0 rounded-xl bg-muted flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
              🖼️
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-tighter">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <div className="text-lg font-black">{item.price}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground">
          ※商品の在庫状況は劇場により異なります。品切れの際はご容赦ください。
        </p>
      </div>
    </div>
  )
}
