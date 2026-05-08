import { NavLink } from "react-router";
import { LayoutDashboard, Film, Calendar, Monitor, Ticket, Users, Settings, LogOut } from "lucide-react";
import type { ComponentType } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/movies", label: "Movies", icon: Film },
  { to: "/admin/schedules", label: "Schedules", icon: Calendar },
  { to: "/admin/screens", label: "Screens", icon: Monitor },
  { to: "/admin/reservations", label: "Reservations", icon: Ticket },
  { to: "/admin/members", label: "Members", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex-shrink-0 h-14 flex items-center border-b border-gray-200 px-5">
        <div>
          <p className="text-sm font-black text-gray-900 leading-none">HAL Cinema</p>
          <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/admin"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex-shrink-0 border-t border-gray-100 px-3 py-4">
        <a
          href="/login"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </a>
      </div>
    </aside>
  );
}
