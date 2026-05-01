export type TicketType = "general" | "university" | "highschool" | "child"
export type TicketCounts = Record<TicketType, number>

export type SelectedSeat = {
  seatId: number
  row: string
  col: number
  ticketType: TicketType
}

export type ReservationDraft = {
  scheduleId?: number
  ticketCounts?: TicketCounts
  selectedSeats?: SelectedSeat[]
  layoutVersion?: number
  bookingType?: "member" | "guest"
  customer?: { name: string; email: string }
}

const KEY = "hal_cinema_reservation_draft"

export const draft = {
  get(): ReservationDraft {
    if (typeof window === "undefined") return {}
    try {
      const raw = sessionStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as ReservationDraft) : {}
    } catch {
      return {}
    }
  },

  set(partial: Partial<ReservationDraft>): void {
    if (typeof window === "undefined") return
    const current = draft.get()
    sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...partial }))
  },

  clear(): void {
    if (typeof window === "undefined") return
    sessionStorage.removeItem(KEY)
  },

  totalTickets(counts?: TicketCounts): number {
    if (!counts) return 0
    return Object.values(counts).reduce((a, b) => a + b, 0)
  },
}
