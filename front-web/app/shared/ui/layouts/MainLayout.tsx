import { Outlet } from "react-router"
import { Header } from "~/widgets/Header"
import { Footer } from "~/widgets/Footer"

export default function MainLayout() {
  return (
    <>
      <Header />
      <main className="container-center flex-1">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
