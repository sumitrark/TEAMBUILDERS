"use client";

import { useRouter } from "next/navigation";
import { useMyHackathons } from "@/hooks/useMyHackathons";

export default function MyHackathons() {
  const router = useRouter();

  const {
    hackathons,
    loading,
  } = useMyHackathons();

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="mb-5 flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-bold">
            My Hackathons
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Hackathons you are participating in.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard/hackathons"
            )
          }
          className="text-sm font-semibold text-violet-600 hover:text-violet-700"
        >
          Explore All →
        </button>

      </div>

      {loading ? (

        <div className="space-y-3">

          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-xl bg-gray-100"
            />
          ))}

        </div>

      ) : hackathons.length === 0 ? (

        <div className="rounded-2xl border border-dashed p-8 text-center">

          <div className="text-3xl">
            🏆
          </div>

          <h3 className="mt-3 font-semibold">
            No hackathons yet
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Explore hackathons and register to
            start participating.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard/hackathons"
              )
            }
            className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Explore Hackathons
          </button>

        </div>

      ) : (

        <div className="space-y-4">

          {hackathons.map((item: any) => (

            <button
              type="button"
              key={item.id}
              onClick={() =>
                router.push(
                  `/dashboard/hackathons/${item.id}`
                )
              }
              className="w-full rounded-xl border p-4 text-left transition hover:border-violet-300 hover:bg-violet-50/30"
            >

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="font-bold text-lg">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-gray-500">
                    {item.organizer}
                  </p>

                  <p className="mt-1 text-sm text-violet-600">
                    📍 {item.location}
                  </p>

                </div>

                <span className="text-violet-600">
                  →
                </span>

              </div>

            </button>

          ))}

        </div>

      )}

    </div>
  );
}