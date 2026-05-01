export type TicketType = "general" | "university" | "highschool" | "child"

export const TICKET_PRICES: Record<TicketType, number> = {
  general: 1800,
  university: 1600,
  highschool: 1400,
  child: 1000,
}

export const TICKET_LABELS: Record<TicketType, string> = {
  general: "一般",
  university: "大学生",
  highschool: "高校生以下",
  child: "子供",
}

export const TICKET_TYPES: TicketType[] = ["general", "university", "highschool", "child"]

export type TicketCounts = Record<TicketType, number>

export function buildTypeQueue(counts: TicketCounts): TicketType[] {
  return TICKET_TYPES.flatMap(type => Array<TicketType>(counts[type]).fill(type))
}

export function calcTotalPrice(counts: TicketCounts): number {
  return TICKET_TYPES.reduce((sum, t) => sum + counts[t] * TICKET_PRICES[t], 0)
}

export function totalTicketCount(counts: TicketCounts): number {
  return TICKET_TYPES.reduce((sum, t) => sum + counts[t], 0)
}

export function formatJst(isoOrDate: string | Date): string {
  return new Date(isoOrDate).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDateJst(isoOrDate: string | Date): string {
  return new Date(isoOrDate).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })
}

export function todayJst(): string {
  return new Date().toLocaleDateString("sv", { timeZone: "Asia/Tokyo" })
}

export function jstDateLabel(isoString: string): string {
  return new Date(isoString).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  })
}