const stats = [
  { value: "10K+", label: "Students" },
  { value: "500+", label: "Hackathons" },
  { value: "2K+", label: "Projects" },
];

export default function HeroStats() {
  return (
    <div className="mt-16 grid grid-cols-3 gap-8">
      {stats.map((item) => (
        <div key={item.label}>
          <h2 className="text-3xl font-bold text-violet-600">
            {item.value}
          </h2>

          <p className="text-muted-foreground">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}