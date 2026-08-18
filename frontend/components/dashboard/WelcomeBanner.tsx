"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/services/auth";

interface User {
  full_name: string;
  username?: string | null;
}

export default function WelcomeBanner() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();

        setUser(currentUser);
      } catch (error) {
        console.error(
          "Failed to load current user:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const firstName =
    user?.full_name?.split(" ")[0] || "there";

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 p-10 text-white">

      {/* Decorative elements */}

      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

      <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" />

      <div className="relative flex items-center justify-between">

        <div>

          <p className="uppercase tracking-widest text-violet-200">
            TEAMBUILDERS AI
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            {loading ? (
              <>
                Welcome back,
                <br />
                <span className="text-violet-200">
                  Loading...
                </span>
              </>
            ) : (
              <>
                Welcome back,
                <br />
                {firstName} 👋
              </>
            )}
          </h1>

          <p className="mt-5 max-w-xl text-lg text-violet-100">
            Discover hackathons, build amazing teams,
            generate project ideas using AI and showcase
            your portfolio.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/hackathons"
                )
              }
              className="rounded-xl bg-white px-7 py-3 font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50"
            >
              Explore Hackathons
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/teams"
                )
              }
              className="rounded-xl border border-white/30 bg-white/10 px-7 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Build Your Team
            </button>

          </div>

        </div>

        <div className="hidden h-64 w-64 items-center justify-center rounded-full bg-white/10 text-8xl xl:flex">
          🚀
        </div>

      </div>

    </section>
  );
}