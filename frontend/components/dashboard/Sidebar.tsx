"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Trophy,
  Users,
  FolderGit2,
  UserCircle,
  Settings,
  LogOut,
} from "lucide-react";

const menu = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Hackathons",
    href: "/dashboard/hackathons",
    icon: Trophy,
  },
  {
    name: "Teams",
    href: "/dashboard/teams",
    icon: Users,
  },
  {
    name: "Projects",
    href: "/dashboard/projects",
    icon: FolderGit2,
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-white border-r h-screen flex flex-col">

      <div className="p-8 border-b">
        <h1 className="text-3xl font-bold text-violet-600">
          TEAMBUILDERS
        </h1>

        <p className="text-gray-500 mt-1">
          Student Portal
        </p>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2">

        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition"
            >
              <Icon size={22} />

              <span className="font-medium">
                {item.name}
              </span>
            </Link>
          );
        })}

      </nav>

      <div className="p-5 border-t">

        <button className="flex items-center gap-3 text-red-500 hover:text-red-700">

          <LogOut />

          Logout

        </button>

      </div>

    </aside>
  );
}