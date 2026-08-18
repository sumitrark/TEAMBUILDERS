import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import StatsGrid from "@/components/dashboard/StatsCards";
import HackathonSection from "@/components/dashboard/HackathonSection";
import TeamSection from "@/components/dashboard/TeamSection";
import MyHackathons from "@/components/dashboard/MyHackathons";

export default function DashboardPage() {
  return (
    <div className="space-y-8">

      <WelcomeBanner />

      <StatsGrid />

      <HackathonSection />

      <MyHackathons />

      <TeamSection />

    </div>
  );
}