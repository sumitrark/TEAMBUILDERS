import OrganizerSidebar from "@/components/organizer/OrganizerSidebar";

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <OrganizerSidebar />

      <main className="min-h-screen pl-64">
        {children}
      </main>
    </div>
  );
}