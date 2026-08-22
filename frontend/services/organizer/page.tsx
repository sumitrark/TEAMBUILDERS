"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Users,
  UsersRound,
  FolderKanban,
  Plus,
  ArrowRight,
  CalendarDays,
  Activity,
} from "lucide-react";

import {
  getOrganizerStats,
  getOrganizerHackathons,
} from "@/services/organizer";

type Stats = {
  hackathons: number;
  participants: number;
  teams: number;
  projects: number;
};

type Hackathon = {
  id: string;
  title: string;
  description: string;
  location: string;
  mode: string;
  team_size: number;
  status: string;
  start_date: string;
  end_date: string;
  prize_pool: string;
};

export default function OrganizerDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    hackathons: 0,
    participants: 0,
    teams: 0,
    projects: 0,
  });

  const [hackathons, setHackathons] = useState<Hackathon[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsData, hackathonData] =
          await Promise.all([
            getOrganizerStats(),
            getOrganizerHackathons(),
          ]);

        setStats(statsData);
        setHackathons(hackathonData);
      } catch (error) {
        console.error(
          "Failed to load organizer dashboard:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const statCards = [
    {
      title: "Hackathons",
      value: stats.hackathons,
      icon: Trophy,
      bg: "bg-violet-100",
      iconColor: "text-violet-600",
    },
    {
      title: "Participants",
      value: stats.participants,
      icon: Users,
      bg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Teams",
      value: stats.teams,
      icon: UsersRound,
      bg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Projects",
      value: stats.projects,
      icon: FolderKanban,
      bg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
                TEAMBUILDERS
              </p>

              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                Organizer Dashboard
              </h1>

              <p className="mt-1 text-gray-500">
                Manage your hackathons, participants,
                teams and projects.
              </p>
            </div>

            <button
              onClick={() =>
                router.push(
                  "/organizer/hackathons/create"
                )
              }
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              <Plus className="h-5 w-5" />
              Create Hackathon
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* Stats */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {card.title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {loading ? "—" : card.value}
                    </p>
                  </div>

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}
                  >
                    <Icon
                      className={`h-6 w-6 ${card.iconColor}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Overview */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  My Hackathons
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Hackathons created and managed by you.
                </p>
              </div>

              <button
                onClick={() =>
                  router.push(
                    "/organizer/hackathons"
                  )
                }
                className="flex items-center gap-1 text-sm font-semibold text-violet-600 hover:underline"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-500">
                Loading hackathons...
              </div>
            ) : hackathons.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <Trophy className="mx-auto h-10 w-10 text-gray-300" />

                <h3 className="mt-4 font-semibold text-gray-800">
                  No hackathons yet
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Create your first hackathon to get
                  started.
                </p>

                <button
                  onClick={() =>
                    router.push(
                      "/organizer/hackathons/create"
                    )
                  }
                  className="mt-5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Create Hackathon
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {hackathons.slice(0, 5).map(
                  (hackathon) => (
                    <div
                      key={hackathon.id}
                      className="rounded-xl border p-5 transition hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-gray-900">
                              {hackathon.title}
                            </h3>

                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              {hackathon.status}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-4 w-4" />
                              {hackathon.start_date}
                            </span>

                            <span>
                              {hackathon.location}
                            </span>

                            <span>
                              {hackathon.mode}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            router.push(
                              `/organizer/hackathons/${hackathon.id}`
                            )
                          }
                          className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                        >
                          Manage
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Frequently used organizer tools.
            </p>

            <div className="mt-6 space-y-3">
              <button
                onClick={() =>
                  router.push(
                    "/organizer/hackathons/create"
                  )
                }
                className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition hover:bg-violet-50"
              >
                <div className="rounded-lg bg-violet-100 p-2">
                  <Plus className="h-5 w-5 text-violet-600" />
                </div>

                <div>
                  <p className="font-semibold text-gray-900">
                    Create Hackathon
                  </p>

                  <p className="text-xs text-gray-500">
                    Start a new event
                  </p>
                </div>
              </button>

              <button
                onClick={() =>
                  router.push(
                    "/organizer/hackathons"
                  )
                }
                className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition hover:bg-blue-50"
              >
                <div className="rounded-lg bg-blue-100 p-2">
                  <Trophy className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <p className="font-semibold text-gray-900">
                    Manage Hackathons
                  </p>

                  <p className="text-xs text-gray-500">
                    View and manage events
                  </p>
                </div>
              </button>

              <button
                onClick={() =>
                  router.push(
                    "/organizer/analytics"
                  )
                }
                className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition hover:bg-green-50"
              >
                <div className="rounded-lg bg-green-100 p-2">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>

                <div>
                  <p className="font-semibold text-gray-900">
                    Analytics
                  </p>

                  <p className="text-xs text-gray-500">
                    Track event performance
                  </p>
                </div>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}