"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Trophy,
  Users,
  FolderGit2,
  Sparkles,
  PenSquare,
  UserCircle,
  Award,
  CircleHelp,
  LogOut,
} from "lucide-react";

const menu = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Explore Hackathons",
    href: "/dashboard/hackathons",
    icon: Trophy,
  },
  {
    title: "AI Matchmaker",
    href: "/dashboard/matchmaker",
    icon: Sparkles,
  },
  {
    title: "My Team",
    href: "/dashboard/team",
    icon: Users,
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    icon: FolderGit2,
  },
  {
    title: "AI Content Studio",
    href: "/dashboard/content",
    icon: PenSquare,
  },
  {
    title: "Portfolio",
    href: "/dashboard/portfolio",
    icon: UserCircle,
  },
  {
    title: "Achievements",
    href: "/dashboard/achievements",
    icon: Award,
  },
  {
    title: "AI Help Center",
    href: "/dashboard/help",
    icon: CircleHelp,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-[#0F172A] text-white min-h-screen flex flex-col">

      {/* Logo */}

      <div className="px-8 py-8 border-b border-slate-700">

        <h1 className="text-3xl font-extrabold tracking-wide text-violet-400">
          TEAMBUILDERS
        </h1>

        <p className="text-slate-400 mt-2 text-sm">
          Student Dashboard
        </p>

      </div>

      {/* Navigation */}

      <div className="flex-1 px-5 py-6">

        <div className="space-y-2">

          {menu.map((item) => {

            const Icon = item.icon;

            const active = pathname === item.href;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all
                ${
                  active
                    ? "bg-violet-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={22} />

                <span className="font-medium">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>

      </div>

      {/* Profile */}

      <div className="border-t border-slate-700 p-6">

        <div className="flex items-center gap-4">

          <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-lg font-bold">
            S
          </div>

          <div>

            <p className="font-semibold">
              Sumitra RK
            </p>

            <p className="text-slate-400 text-sm">
              Student
            </p>

          </div>

        </div>

        <button
          className="mt-6 flex items-center gap-3 text-red-400 hover:text-red-300"
        >
          <LogOut size={20} />

          Logout
        </button>

      </div>

    </aside>
  );
}