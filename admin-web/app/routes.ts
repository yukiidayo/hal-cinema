import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/auth/login.tsx"),
  route("admin", "routes/admin/layout.tsx", [
    index("routes/admin/dashboard.tsx"),
    route("movies", "routes/admin/movies.tsx"),
    route("schedules", "routes/admin/schedules.tsx"),
    route("screens", "routes/admin/screens.tsx"),
    route("reservations", "routes/admin/reservations.tsx"),
    route("members", "routes/admin/members.tsx"),
    route("settings", "routes/admin/settings.tsx"),
  ]),
] satisfies RouteConfig;
