import type { ReservationDraft } from "~/entities/reservation/draft"

export type ReservationFlowIssue = {
  message: string
  redirectTo: string
}

export function getEntryGuardIssue(draft: ReservationDraft): ReservationFlowIssue | null {
  if (!draft.selectedSeats || draft.selectedSeats.length === 0) {
    return { message: "座席情報が不足しています。上映回選択からやり直してください。", redirectTo: "/movies" }
  }
  return null
}

export function getCustomerGuardIssue(draft: ReservationDraft): ReservationFlowIssue | null {
  if (!draft.selectedSeats || draft.selectedSeats.length === 0) {
    return { message: "座席情報が不足しています。上映回選択からやり直してください。", redirectTo: "/movies" }
  }
  return null
}

export function getTicketsGuardIssue(draft: ReservationDraft): ReservationFlowIssue | null {
  if (!draft.scheduleId || !draft.selectedSeats || draft.selectedSeats.length === 0) {
    return { message: "予約情報が不足しています。上映回選択からやり直してください。", redirectTo: "/movies" }
  }
  return null
}

export function getConfirmGuardIssue(draft: ReservationDraft): ReservationFlowIssue | null {
  if (!draft.scheduleId || !draft.selectedSeats || draft.selectedSeats.length === 0) {
    return { message: "予約情報が不足しています。上映回選択からやり直してください。", redirectTo: "/movies" }
  }
  if (!draft.customer?.name || !draft.customer?.email) {
    return { message: "お客様情報が不足しています。入力画面へ戻ります。", redirectTo: "/reservations/customer" }
  }
  return null
}

export function getPaymentGuardIssue(draft: ReservationDraft): ReservationFlowIssue | null {
  const confirmIssue = getConfirmGuardIssue(draft)
  if (confirmIssue) return confirmIssue
  if (!draft.layoutVersion || !draft.reservationCode) {
    return { message: "座席の仮押さえ情報が不足しています。座席選択からやり直してください。", redirectTo: "/movies" }
  }
  return null
}
