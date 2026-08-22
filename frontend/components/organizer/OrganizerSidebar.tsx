"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Users,
  UsersRound,
  Gavel,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ArrowLeft,
} from "lucide-react";

import { logout } from "@/services/auth";

export default function OrganizerSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Detect whether we are inside a specific hackathon
  const match = pathname.match(
    /^\/organizer\/hackathons\/([^/]+)/
  );

  const hackathonId = match?.[1];

  const items = [
    {
      label: "Dashboard",
      href: "/organizer",
      icon: LayoutDashboard,
    },
    {
      label: "Hackathons",
      href: "/organizer/hackathons",
      icon: Trophy,
    },
  ];

  const hackathonItems = hackathonId
    ? [
        {
          label: "Overview",
          href: `/organizer/hackathons/${hackathonId}`,
          icon: Trophy,
        },
        {
          label: "Participants",
          href: `/organizer/hackathons/${hackathonId}/participants`,
          icon: Users,
        },
        {
          label: "Teams",
          href: `/organizer/hackathons/${hackathonId}/teams`,
          icon: UsersRound,
        },
        {
          label: "Judges",
          href: `/organizer/hackathons/${hackathonId}/judges`,
          icon: Gavel,
        },
        {
          label: "Analytics",
          href: `/organizer/hackathons/${hackathonId}/analytics`,
          icon: BarChart3,
        },
      ]
    : [];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/organizer") {
      return pathname === "/organizer";
    }

    return pathname === href;
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-white">

      {/* =====================================================
          LOGO
      ====================================================== */}
      <div className="flex h-20 items-center border-b px-6">
        <div>
          <div className="text-lg font-bold text-violet-600">
            TEAMBUILDERS
          </div>

          <div className="text-xs font-medium text-gray-500">
            Organizer Portal
          </div>
        </div>
      </div>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">

        {/* Main Navigation */}
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

        {/* =================================================
            HACKATHON MANAGEMENT
        ================================================== */}

        {hackathonId && (
          <>
            <div className="px-4 pt-6 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Hackathon Management
            </div>

            {hackathonItems.map((item) => {
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

            {/* Back to Hackathons */}
            <button
              onClick={() =>
                router.push("/organizer/hackathons")
              }
              className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />

              All Hackathons
            </button>
          </>
        )}
      </nav>

      {/* =====================================================
          BOTTOM ACTIONS
      ====================================================== */}
      <div className="border-t p-4">

        {/* Student Dashboard */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />

          Student Dashboard
        </button>

        {/* Settings */}
        <button
          onClick={() => router.push("/organizer/settings")}
          className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <Settings className="h-5 w-5" />

          Settings
        </button>

        {/* Logout */}
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