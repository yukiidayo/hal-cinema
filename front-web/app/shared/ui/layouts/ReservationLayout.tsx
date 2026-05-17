import { Outlet } from "react-router"
import { ReservationHeader } from "~/widgets/ReservationHeader"

export default function ReservationLayout() {
  return (
    <>
      <ReservationHeader />
      <main className="container-center flex-1">
        <Outlet />
      </main>
    </>
  )
}
