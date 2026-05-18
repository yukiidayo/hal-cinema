import { useRef, useEffect } from "react"

export type DayInfo = {
  iso: string;
  label: string;
};

type Props = {
  days: DayInfo[];
  selectedDate: string;
  onSelect: (iso: string) => void;
};

export function DateSelector({ days, selectedDate, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  // selectedDate が変わったら対応アイテムを中央にスクロール
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const idx = days.findIndex(d => d.iso === selectedDate)
    if (idx < 0) return
    const items = container.querySelectorAll<HTMLElement>("[data-day-item]")
    const item = items[idx]
    if (!item) return
    const targetLeft = item.offsetLeft + item.offsetWidth / 2 - container.clientWidth / 2
    container.scrollTo({
      left: targetLeft,
      behavior: isFirstRender.current ? "instant" : "smooth",
    })
    isFirstRender.current = false
  }, [selectedDate, days])

  // スクロールが止まった瞬間に中央アイテムを選択
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleScrollEnd = () => {
      const centerX = container.scrollLeft + container.clientWidth / 2
      const items = Array.from(container.querySelectorAll<HTMLElement>("[data-day-item]"))
      let closestIdx = 0
      let minDist = Infinity
      items.forEach((el, i) => {
        const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - centerX)
        if (dist < minDist) { minDist = dist; closestIdx = i }
      })
      onSelect(days[closestIdx].iso)
    }

    container.addEventListener("scrollend", handleScrollEnd)
    return () => container.removeEventListener("scrollend", handleScrollEnd)
  }, [days, onSelect])

  const renderButton = (day: DayInfo, index: number, extraClass = "") => {
    const labelText = index === 0 ? "今日" : index === 1 ? "明日" : ""
    const dateObj = new Date(day.iso)
    const dayNum = dateObj.getDate()
    const weekDay = dateObj.toLocaleDateString("ja-JP", { weekday: "short" })
    const isActive = selectedDate === day.iso

    return (
      <button
        key={day.iso}
        onClick={() => onSelect(day.iso)}
        className={`flex flex-col items-center rounded-lg py-3 transition-all ${
          isActive ? "bg-primary text-primary-foreground" : "bg-muted/40 hover:bg-muted"
        } ${extraClass}`}
      >
        <span className={`text-[10px] font-bold ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {labelText || " "}
        </span>
        <span className={`text-xl font-black ${isActive ? "text-primary-foreground" : "text-foreground"}`}>
          {dayNum}
        </span>
        <span className={`text-[10px] font-bold ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          ({weekDay})
        </span>
      </button>
    )
  }

  return (
    <>
      {/* モバイル: CSS scroll snap で3つ表示、指を離すとスナップ */}
      <div
        ref={scrollRef}
        className="mb-8 sm:hidden flex overflow-x-scroll snap-x snap-mandatory no-scrollbar"
      >
        {/* 端のアイテムも中央に止まれるようにするダミー */}
        <div className="shrink-0 w-1/3" aria-hidden="true" />

        {days.map((day, index) => {
          const isActive = selectedDate === day.iso
          const labelText = index === 0 ? "今日" : index === 1 ? "明日" : ""
          const dateObj = new Date(day.iso)
          const dayNum = dateObj.getDate()
          const weekDay = dateObj.toLocaleDateString("ja-JP", { weekday: "short" })

          return (
            <button
              key={day.iso}
              data-day-item
              onClick={() => onSelect(day.iso)}
              className={`snap-center shrink-0 w-1/3 flex flex-col items-center rounded-lg py-3 transition-all ${
                isActive ? "bg-primary text-primary-foreground" : "bg-muted/40 hover:bg-muted"
              }`}
            >
              <span className={`text-[10px] font-bold ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {labelText || " "}
              </span>
              <span className={`text-xl font-black ${isActive ? "text-primary-foreground" : "text-foreground"}`}>
                {dayNum}
              </span>
              <span className={`text-[10px] font-bold ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                ({weekDay})
              </span>
            </button>
          )
        })}

        <div className="shrink-0 w-1/3" aria-hidden="true" />
      </div>

      {/* PC: 全件横並び（変更なし） */}
      <div className="mb-8 hidden sm:flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {days.map((day, index) => renderButton(day, index, "w-full"))}
      </div>
    </>
  )
}
