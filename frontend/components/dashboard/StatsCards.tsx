import {
  Trophy,
  Users,
  Folder,
  Award,
} from "lucide-react";

function StatCard({
  title,
  value,
  Icon,
  color,
}: {
  title: string;
  value: string;
  Icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500">{title}</p>
          <h2 className="mt-3 text-3xl font-bold">{value}</h2>
        </div>

        <div
          className={`h-14 w-14 rounded-2xl ${color} flex items-center justify-center text-white`}
        >
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
}

export default function StatsCards() {
  const stats = [
    {
      title: "Hackathons",
      value: "12",
      Icon: Trophy,
      color: "bg-violet-600",
    },
    {
      title: "Teams",
      value: "5",
      Icon: Users,
      color: "bg-blue-600",
    },
    {
      title: "Projects",
      value: "8",
      Icon: Folder,
      color: "bg-green-600",
    },
    {
      title: "Achievements",
      value: "4",
      Icon: Award,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((item) => (
        <StatCard
          key={item.title}
          title={item.title}
          value={item.value}
          Icon={item.Icon}
          color={item.color}
        />
      ))}
    </div>
  );
}