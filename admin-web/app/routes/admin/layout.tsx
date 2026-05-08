import { Outlet } from "react-router";
import { AdminSidebar } from "~/components/admin/AdminSidebar";
import { AdminHeader } from "~/components/admin/AdminHeader";

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar />
      <main className="ml-60 flex h-screen flex-col flex-1">
        <AdminHeader />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
