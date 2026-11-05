"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import JudgeSidebar from "@/components/judge/JudgeSidebar";
import NotificationBell from "@/components/dashboard/NotificationBell";

export default function JudgePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    if (!token) {
      // Preserve the destination so the user can come back after login.
      router.replace(
        `/login?redirect=${encodeURIComponent(pathname)}`
      );
    } else {
      setChecking(false);
    }
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <JudgeSidebar />

      <main className="min-h-screen pl-64">
        <div className="flex h-16 items-center justify-end border-b bg-white px-6">
          <NotificationBell />
        </div>

        <div>{children}</div>
      </main>
    </div>
  );
}
