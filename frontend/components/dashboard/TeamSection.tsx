import TeamCard from "./TeamCard";

export default function TeamSection() {
  return (
    <div>

      <h2 className="mb-5 text-2xl font-bold">
        Recommended Teams
      </h2>

      <div className="grid grid-cols-2 gap-5">

        <TeamCard />
        <TeamCard />

      </div>

    </div>
  );
}