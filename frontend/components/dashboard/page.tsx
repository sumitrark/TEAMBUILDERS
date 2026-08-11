import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import StatsGrid from "@/components/dashboard/StatsGrid";
import HackathonSection from "@/components/dashboard/HackathonSection";
import TeamSection from "@/components/dashboard/TeamSection";

export default function DashboardPage() {
  return (
    <div className="space-y-8">

      <WelcomeBanner />

      <StatsGrid />

      <HackathonSection />

      <TeamSection />

    </div>
  );
}
