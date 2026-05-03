export function getNext7Days(): { iso: string; label: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const iso = d.toLocaleDateString("sv", { timeZone: "Asia/Tokyo" })
    const label =
      i === 0 ? "今日" : i === 1 ? "明日"
      : d.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short" })
    return { iso, label }
  })
}
