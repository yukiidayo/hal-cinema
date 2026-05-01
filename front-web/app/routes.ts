import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  // 映画情報
  route("/movies", "routes/movies.tsx"),
  route("/movies/:movieId/schedules", "routes/movies.$movieId.schedules.tsx"),

  // 認証
  route("/login", "routes/login.tsx"),
  route("/register", "routes/register.tsx"),
  route("/auth/otp", "routes/auth.otp.tsx"),

  // 予約フロー (静的ルートを先に定義)
  route("/reservations/tickets/:scheduleId", "routes/reservations.tickets.$scheduleId.tsx"),
  route("/reservations/seats/:scheduleId", "routes/reservations.seats.$scheduleId.tsx"),
  route("/reservations/entry", "routes/reservations.entry.tsx"),
  route("/reservations/customer", "routes/reservations.customer.tsx"),
  route("/reservations/confirm", "routes/reservations.confirm.tsx"),
  route("/reservations/payment", "routes/reservations.payment.tsx"),
  route("/reservations/complete", "routes/reservations.complete.tsx"),
  route("/reservations/lookup", "routes/reservations.lookup.tsx"),

  // 予約詳細 (動的ルートは最後)
  route("/reservations/r/:reservationCode", "routes/reservations.r.$reservationCode.tsx"),
] satisfies RouteConfig;
