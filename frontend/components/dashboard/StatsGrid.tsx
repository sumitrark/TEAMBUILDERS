import StatCard from "./StatCard";

export default function StatsGrid() {
  return (
    <div className="grid grid-cols-4 gap-6">

      <StatCard
        title="Hackathons"
        value="12"
      />

      <StatCard
        title="Projects"
        value="4"
      />

      <StatCard
        title="Teams"
        value="6"
      />

      <StatCard
        title="Achievements"
        value="8"
      />

    </div>
  );
}