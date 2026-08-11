import HackathonCard from "./HackathonCard";

export default function HackathonSection() {
  return (
    <div>

      <h2 className="mb-5 text-2xl font-bold">
        Upcoming Hackathons
      </h2>

      <div className="grid grid-cols-2 gap-5">

        <HackathonCard />
        <HackathonCard />

      </div>

    </div>
  );
}