import OrganizerSidebar from "@/components/organizer/OrganizerSidebar";
import OrganizerTopbar from "@/components/organizer/OrganizerTopbar";

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <OrganizerSidebar />

      <main className="min-h-screen pl-64">
        <OrganizerTopbar />
        <div>{children}</div>
      </main>
    </div>
  );
}