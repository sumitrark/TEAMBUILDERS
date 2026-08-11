export default function WelcomeBanner() {
  return (
    <div className="rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white">
      <h1 className="text-4xl font-bold">
        Welcome back, Sumitra 👋
      </h1>

      <p className="mt-3 text-violet-100">
        Ready to build your next winning hackathon project?
      </p>

      <button className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-violet-700">
        Explore Hackathons
      </button>
    </div>
  );
}