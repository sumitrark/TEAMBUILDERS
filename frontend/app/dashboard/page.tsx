import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import StatsCards from "@/components/dashboard/StatsCards";
import HackathonSection from "@/components/dashboard/HackathonSection";
import MyHackathons from "@/components/dashboard/MyHackathons";
import TeamSection from "@/components/dashboard/TeamSection";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <WelcomeBanner />

      <StatsCards />

      <HackathonSection />

      <MyHackathons />

      <TeamSection />
    </div>
  );
}