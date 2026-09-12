"use client";

import NotificationBell from "@/components/dashboard/NotificationBell";

export default function OrganizerTopbar() {
  return (
    <div className="flex h-16 items-center justify-end border-b bg-white px-6">
      <NotificationBell />
    </div>
  );
}
