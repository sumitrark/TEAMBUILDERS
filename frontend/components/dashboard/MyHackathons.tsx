"use client";

import { useMyHackathons } from "@/hooks/useMyHackathons";

export default function MyHackathons() {
  const { hackathons, loading } = useMyHackathons();

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-5">
        My Hackathons
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : hackathons.length === 0 ? (
        <p className="text-gray-500">
          You haven't joined any hackathons yet.
        </p>
      ) : (
        <div className="space-y-4">
          {hackathons.map((item: any) => (
            <div
              key={item.id}
              className="border rounded-xl p-4"
            >
              <h3 className="font-bold text-lg">
                {item.title}
              </h3>

              <p className="text-gray-500">
                {item.organizer}
              </p>

              <p className="text-sm text-violet-600">
                {item.location}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}