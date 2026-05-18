import type { Route } from "./+types/goods"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "グッズショップ | HALシネマ" },
    { name: "description", content: "映画関連グッズ・オリジナルアイテム" },
  ]
}

const SAMPLE_ITEM = {
  title: "商品名",
  movie: "作品名",
  price: "2,000",
  isSoldOut: true,
  isNew: true
}

export default function Goods() {
  const items = Array(12).fill(SAMPLE_ITEM);

  return (
    <div className="pb-16">
      {/* カルーセルセクション (プレースホルダー) */}
      <div className="relative mb-12 pt-8">
        <div className="flex items-center justify-center gap-4 px-4 overflow-hidden">
          <button className="h-12 w-8 shrink-0 rounded bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-40 w-80 shrink-0 rounded-lg bg-zinc-800 ${i !== 2 ? 'opacity-50 scale-90' : ''}`} />
            ))}
          </div>

          <button className="h-12 w-8 shrink-0 rounded bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        
        <div className="mt-6 flex justify-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`h-2 w-2 rounded-full ${i === 1 ? 'bg-white' : 'bg-zinc-700'}`} />
          ))}
        </div>
      </div>

      <div className="container-center">
        {/* フィルタバー */}
        <div className="mb-12 flex items-center justify-between rounded-xl bg-zinc-900/50 p-4 border border-zinc-800">
          <div className="flex-1" />
          <button className="flex items-center gap-2 text-sm font-bold hover:text-primary transition-colors">
            <span>映画ごとに絞り込む</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* 商品グリッド */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-10">
          {items.map((item, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-zinc-800 border border-zinc-800 transition-all group-hover:border-zinc-700">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-zinc-600 text-6xl">🖼️</span>
                </div>
                
                {item.isSoldOut && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                    <span className="text-sm font-black text-white tracking-widest -rotate-12 border-2 border-white px-2 py-1">SOLD OUT</span>
                  </div>
                )}
                
                {item.isNew && i === 0 && (
                  <span className="absolute bottom-2 right-2 z-20 text-[10px] font-black text-white tracking-tighter">NEW</span>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-zinc-500">{item.movie}</div>
                <div className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{item.title}</div>
                <div className="pt-1">
                  <span className="inline-flex items-center rounded-full bg-zinc-800 px-3 py-1 text-[11px] font-black text-zinc-300">
                    ¥{item.price}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
