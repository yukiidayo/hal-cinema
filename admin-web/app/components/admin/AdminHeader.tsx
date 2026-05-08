import { Bell } from "lucide-react";

export function AdminHeader() {
  return (
    <header className="flex-shrink-0 sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div />
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
            A
          </div>
          <span className="text-sm font-semibold text-gray-700">Admin</span>
        </div>
      </div>
    </header>
  );
}
