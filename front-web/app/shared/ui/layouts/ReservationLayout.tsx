import { Outlet } from "react-router"
import { ReservationHeader } from "~/widgets/ReservationHeader"
import { ReservationStepBanner } from "~/widgets/ReservationStepBanner"

export default function ReservationLayout() {
  return (
    <>
      <ReservationHeader />
      <ReservationStepBanner />
      <main className="container-center flex-1">
        <Outlet />
      </main>
    </>
  )
}
