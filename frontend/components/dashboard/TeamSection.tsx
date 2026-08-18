"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Team {
  id: string;
  name: string;
  description: string | null;
  max_members: number;
  owner_id: string;
  hackathon_id: string | null;
  created_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export default function TeamSection() {
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [memberCounts, setMemberCounts] =
    useState<Record<string, number>>({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);

        const response =
          await api.get("/teams/my");

        const myTeams: Team[] =
          response.data || [];

        setTeams(myTeams);

        const counts: Record<string, number> =
          {};

        await Promise.all(
          myTeams.map(async (team) => {
            try {
              const membersResponse =
                await api.get(
                  `/team-members/${team.id}`
                );

              counts[team.id] =
                membersResponse.data?.length || 0;
            } catch {
              counts[team.id] = 0;
            }
          })
        );

        setMemberCounts(counts);
      } catch (error) {
        console.error(
          "Failed to load teams:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, []);

  if (loading) {
    return (
      <section>

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            My Teams
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-2xl bg-white shadow-sm"
            />
          ))}

        </div>

      </section>
    );
  }

  return (
    <section>

      <div className="mb-5 flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-bold">
            My Teams
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Teams you are currently part of.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/dashboard/teams")
          }
          className="text-sm font-semibold text-violet-600 hover:text-violet-700"
        >
          View All →
        </button>

      </div>

      {teams.length === 0 ? (

        <div className="rounded-2xl border border-dashed bg-white p-8 text-center">

          <div className="text-4xl">
            👥
          </div>

          <h3 className="mt-3 font-semibold">
            No teams yet
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Create a team and start building
            something amazing.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard/teams"
              )
            }
            className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Create Team
          </button>

        </div>

      ) : (

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {teams.slice(0, 4).map((team) => {

            const memberCount =
              memberCounts[team.id] || 0;

            const availableSlots =
              Math.max(
                team.max_members -
                  memberCount,
                0
              );

            return (
              <button
                type="button"
                key={team.id}
                onClick={() =>
                  router.push(
                    `/dashboard/teams/${team.id}`
                  )
                }
                className="rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-xl">
                    👥
                  </div>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Active
                  </span>

                </div>

                <h3 className="mt-5 text-lg font-bold">
                  {team.name}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                  {team.description ||
                    "No team description provided."}
                </p>

                <div className="mt-5 flex items-center justify-between border-t pt-4">

                  <span className="text-sm text-gray-500">
                    👤 {memberCount}/
                    {team.max_members} members
                  </span>

                  <span className="text-sm font-semibold text-violet-600">
                    {availableSlots} slots
                    available
                  </span>

                </div>

              </button>
            );
          })}

        </div>

      )}

    </section>
  );
}