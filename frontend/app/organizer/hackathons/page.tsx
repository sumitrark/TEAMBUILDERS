"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Trophy,
  CalendarDays,
  MapPin,
  Users,
  MoreVertical,
} from "lucide-react";

import {
  getOrganizerHackathons,
  Hackathon,
} from "@/services/organizerHackathon";

export default function OrganizerHackathonsPage() {
  const router = useRouter();

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadHackathons() {
    try {
      setLoading(true);

      const data = await getOrganizerHackathons();

      setHackathons(data);
    } catch (error) {
      console.error(
        "Failed to load organizer hackathons:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHackathons();
  }, []);

  const filteredHackathons = hackathons.filter((hackathon) => {
    const query = search.toLowerCase();

    return (
      hackathon.title.toLowerCase().includes(query) ||
      hackathon.description.toLowerCase().includes(query) ||
      hackathon.location.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="border-b bg-white px-8 py-6">
        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hackathons
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Create and manage your hackathon events.
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/organizer/hackathons/create")
            }
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            <Plus className="h-5 w-5" />
            Create Hackathon
          </button>

        </div>
      </div>

      <div className="p-8">

        {/* Search */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">

          <Search className="h-5 w-5 text-gray-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hackathons..."
            className="w-full bg-transparent text-sm outline-none"
          />

        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border bg-white p-12 text-center">
            <p className="text-gray-500">
              Loading hackathons...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && filteredHackathons.length === 0 && (
          <div className="rounded-2xl border bg-white p-12 text-center">

            <Trophy className="mx-auto h-12 w-12 text-gray-300" />

            <h2 className="mt-4 text-lg font-semibold text-gray-800">
              No hackathons found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Create your first hackathon to get started.
            </p>

            <button
              onClick={() =>
                router.push("/organizer/hackathons/create")
              }
              className="mt-5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Create Hackathon
            </button>

          </div>
        )}

        {/* Hackathon Cards */}
        {!loading && filteredHackathons.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">

            {filteredHackathons.map((hackathon) => (
              <div
                key={hackathon.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
              >

                {/* Banner */}
                <div className="h-36 bg-gradient-to-br from-violet-500 to-indigo-600">

                  {hackathon.banner_image && (
                    <img
                      src={hackathon.banner_image}
                      alt={hackathon.title}
                      className="h-full w-full object-cover"
                    />
                  )}

                </div>

                <div className="p-5">

                  <div className="mb-3 flex items-start justify-between">

                    <div>
                      <h2 className="font-bold text-gray-900">
                        {hackathon.title}
                      </h2>

                      <span
                        className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          hackathon.status === "Open"
                            ? "bg-green-100 text-green-700"
                            : hackathon.status === "Cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {hackathon.status}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        router.push(
                          `/organizer/hackathons/${hackathon.id}`
                        )
                      }
                      className="rounded-lg p-2 hover:bg-gray-100"
                    >
                      <MoreVertical className="h-5 w-5 text-gray-500" />
                    </button>

                  </div>

                  <p className="mb-5 line-clamp-2 text-sm text-gray-500">
                    {hackathon.description}
                  </p>

                  <div className="space-y-3 text-sm text-gray-600">

                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {hackathon.start_date} →{" "}
                      {hackathon.end_date}
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {hackathon.location}
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Maximum team size:{" "}
                      {hackathon.team_size}
                    </div>

                  </div>

                  <button
                    onClick={() =>
                      router.push(
                        `/organizer/hackathons/${hackathon.id}`
                      )
                    }
                    className="mt-5 w-full rounded-xl border border-violet-200 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                  >
                    Manage Hackathon
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}