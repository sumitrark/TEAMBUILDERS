"use client";

import { useRouter } from "next/navigation";

import { useHackathons } from "@/hooks/useHackathons";
import { joinHackathon } from "@/services/participant";

export default function RecommendedHackathons() {
  const router = useRouter();

  const { hackathons, loading } = useHackathons();

  const handleJoin = async (id: string) => {
    try {
      await joinHackathon(id);

      alert("Successfully joined!");

      router.refresh();
    } catch (err: any) {
      alert(
        err?.response?.data?.detail ??
          "Unable to join hackathon"
      );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow">
        Loading hackathons...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Recommended Hackathons
        </h2>

        <button className="text-violet-600 font-semibold hover:underline">
          View All
        </button>
      </div>

      <div className="space-y-5">

        {hackathons.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No hackathons available.
          </div>
        ) : (
          hackathons.map((hackathon: any) => (
            <div
              key={hackathon.id}
              className="border rounded-xl p-5 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between">

                <div>
                  <h3 className="text-xl font-bold">
                    {hackathon.title}
                  </h3>

                  <p className="text-gray-500 mt-1">
                    📍 {hackathon.location}
                  </p>

                  <p className="text-gray-500">
                    👥 Team Size: {hackathon.team_size}
                  </p>

                  <p className="text-gray-500">
                    🏢 {hackathon.organizer}
                  </p>

                  <p className="text-gray-500">
                    💰 {hackathon.prize_pool}
                  </p>
                </div>

                <button
                  onClick={() => handleJoin(hackathon.id)}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Join
                </button>

              </div>
            </div>
          ))
        )}

      </div>

    </div>
  );
}