"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Trophy,
  Users,
  FolderGit2,
  PenSquare,
  UserCircle,
  Settings,
  Sparkles,
  Award,
  HelpCircle,
  LogOut,
  Mail,
} from "lucide-react";

import { logout, getCurrentUser } from "@/services/auth";

interface CurrentUser {
  id: string;
  full_name: string;
  username?: string | null;
  email: string;
  role: string;
}

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
    title: "My Teams",
    href: "/dashboard/teams",
    icon: Users,
  },
  {
    title: "Invitations",
    href: "/dashboard/invitations",
    icon: Mail,
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
    title: "Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
  title: "AI Matchmaker",
  href: "/dashboard/matchmaker",
  icon: Sparkles,
  },
  {
  title: "Achievements",
  href: "/dashboard/achievements",
  icon: Award,
},
  {
  title: "Help Center",
  href: "/dashboard/help-center",
  icon: HelpCircle,
  },


];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [userLoading, setUserLoading] =
    useState(true);

  // ==================================================
  // LOAD LOGGED-IN USER
  // ==================================================

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);
      } catch (error) {
        console.error(
          "Failed to load current user:",
          error
        );
      } finally {
        setUserLoading(false);
      }
    }

    loadUser();
  }, []);

  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout = () => {
    logout();

    router.replace("/login");

    router.refresh();
  };

  // ==================================================
  // USER INITIAL
  // ==================================================

  const userInitial =
    user?.full_name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "U";

  return (
    <aside className="flex min-h-screen w-72 flex-col bg-slate-950 text-white">

      {/* ==================================================
          LOGO
      ================================================== */}

      <div className="border-b border-slate-800 p-8">

        <h1 className="text-3xl font-bold text-violet-500">
          TEAMBUILDERS
        </h1>

        <p className="mt-2 text-slate-400">
          Student Dashboard
        </p>

      </div>

      {/* ==================================================
          NAVIGATION
      ================================================== */}

      <nav className="flex-1 px-4 py-6">

        {menu.map((item) => {

          const Icon = item.icon;

          const active =
            item.href !== "#" &&
            (pathname === item.href ||
              pathname.startsWith(
                `${item.href}/`
              ));

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`mb-2 flex items-center gap-4 rounded-xl px-5 py-4 transition ${
                active
                  ? "bg-violet-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >

              <Icon size={22} />

              {item.title}

            </Link>
          );
        })}

      </nav>

      {/* ==================================================
          LOGGED-IN USER
      ================================================== */}

      <div className="border-t border-slate-800 p-6">

        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-800"
        >

          {/* Avatar */}

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold">

            {userLoading
              ? "..."
              : userInitial}

          </div>

          {/* User Information */}

          <div className="min-w-0">

            <p className="truncate font-semibold">

              {userLoading
                ? "Loading..."
                : user?.full_name ||
                  "User"}

            </p>

            <p className="truncate text-sm capitalize text-slate-400">

              {user?.role || "Student"}

            </p>

          </div>

        </Link>

        {/* ==================================================
            LOGOUT
        ================================================== */}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-red-400 transition hover:bg-slate-800 hover:text-red-300"
        >

          <LogOut size={18} />

          Logout

        </button>

      </div>

    </aside>
  );
}