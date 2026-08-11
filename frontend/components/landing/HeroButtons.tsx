export default function HeroButtons() {
  return (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row">
      <button className="rounded-full bg-violet-600 px-8 py-3 font-semibold text-white transition hover:bg-violet-700">
        Get Started
      </button>

      <button className="rounded-full border px-8 py-3 font-semibold transition hover:bg-muted">
        Explore Hackathons
      </button>
    </div>
  );
}