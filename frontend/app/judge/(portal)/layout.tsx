import JudgeSidebar from "@/components/judge/JudgeSidebar";
import NotificationBell from "@/components/dashboard/NotificationBell";

export default function JudgePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
