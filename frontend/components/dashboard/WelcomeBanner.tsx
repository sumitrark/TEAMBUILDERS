export default function WelcomeBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 p-10 text-white">

      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" />

      <div className="relative flex items-center justify-between">

        <div>

          <p className="uppercase tracking-widest text-violet-200">
            TEAMBUILDERS AI
          </p>

          <h1 className="mt-4 text-5xl font-bold">
            Welcome back,
            <br />
            Sumitra 👋
          </h1>

          <p className="mt-5 max-w-xl text-lg text-violet-100">
            Discover hackathons, build amazing teams,
            generate project ideas using AI and showcase
            your portfolio.
          </p>

          <button className="mt-8 rounded-xl bg-white px-7 py-3 font-semibold text-violet-700">
            Explore Hackathons
          </button>

        </div>

        <div className="hidden xl:flex h-64 w-64 items-center justify-center rounded-full bg-white/10 text-8xl">
          🚀
        </div>

      </div>

    </section>
  );
}