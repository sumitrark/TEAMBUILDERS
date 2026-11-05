"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  ClipboardCheck,
  UserCircle,
  LogOut,
  ChevronLeft,
} from "lucide-react";

import { logout } from "@/services/auth";

export default function JudgeSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    {
      label: "Dashboard",
      href: "/judge",
      icon: LayoutDashboard,
    },
    {
      label: "Hackathons",
      href: "/judge/hackathons",
      icon: Trophy,
    },
    {
      label: "Evaluations",
      href: "/judge/evaluations",
      icon: ClipboardCheck,
    },
    {
      label: "Profile",
      href: "/dashboard/profile",
      icon: UserCircle,
    },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/judge") {
      return pathname === "/judge";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-white">

      {/* LOGO */}
      <div className="flex h-20 items-center border-b px-6">
        <div>
          <div className="text-lg font-bold text-violet-600">
            TEAMBUILDERS
          </div>

          <div className="text-xs font-medium text-gray-500">
            Judge Portal
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                isActive(item.href)
                  ? "bg-violet-100 text-violet-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* BOTTOM ACTIONS */}
      <div className="border-t p-4">

        {/* Switch back to student dashboard - a judge invitation never
            removes a user's underlying account capabilities. */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
          Student Dashboard
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>

      </div>
    </aside>
  );
}
