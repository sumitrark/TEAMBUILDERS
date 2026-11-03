
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTeam() {
      try {
        setLoading(true);
        setError("");

        const teamsResponse = await api.get("/teams/my");

        const foundTeam = teamsResponse.data.find(
          (item: Team) => item.id === teamId
        );

        if (!foundTeam) {
          setError("Team not found");
          return;
        }

        setTeam(foundTeam);

        const membersResponse = await api.get(
          `/team-members/${teamId}`
        );

        setMembers(membersResponse.data);
      } catch (err: any) {
        console.error("Failed to load team:", err);

        if (err.response?.status === 401) {
          setError(
            "Your session has expired. Please log in again."
          );
        } else if (err.response?.status === 403) {
          setError(
            "You don't have permission to view this team."
          );
        } else {
          setError("Failed to load team details.");
        }
      } finally {
        setLoading(false);
      }
    }

    if (teamId) {
      loadTeam();
    }
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-violet-600" />
          <p className="text-gray-500">Loading team...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="mb-6 text-sm text-gray-500 hover:text-black"
        >
          ← Back
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-700">
            Unable to load team
          </h2>
          <p className="mt-2 text-sm text-red-600">
            {error || "Team not found"}
          </p>
        </div>
      </div>
    );
  }

  const memberCount = members.length;
  const maxMembers = team.max_members;
  const availableSlots = Math.max(
    maxMembers - memberCount,
    0
  );
  const canInvite = availableSlots > 0;

  const openInvitePage = () => {
    router.push(`/dashboard/teams/${team.id}/invite`);
  };

  const openChatPage = () => {
    router.push(`/dashboard/teams/${team.id}/chat`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 transition hover:text-black"
      >
        ← Back to My Teams
      </button>

      {/* Team Header */}
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white">
              Team
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              {team.name}
            </h1>

            <p className="mt-3 max-w-2xl text-gray-600">
              {team.description ||
                "No team description provided."}
            </p>
          </div>

          <button
            type="button"
            disabled={!canInvite}
            onClick={openInvitePage}
            className="shrink-0 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {canInvite ? "+ Invite Member" : "Team Full"}
          </button>
        </div>

        {/* Team Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">Members</p>
            <p className="mt-1 text-2xl font-bold">
              {memberCount}
              <span className="text-base font-normal text-gray-400">
                {" "}/ {maxMembers}
              </span>
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Available Slots
            </p>
            <p className="mt-1 text-2xl font-bold">
              {availableSlots}
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">Status</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              Active
            </p>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">
              Team Members
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              People currently participating in this team.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
              {memberCount}/{maxMembers}
            </span>

            {canInvite && (
              <button
                type="button"
                onClick={openInvitePage}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Invite
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {members.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <div className="text-3xl">👥</div>

              <h3 className="mt-3 font-semibold">
                No members yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Invite teammates to start building your team.
              </p>

              {canInvite && (
                <button
                  type="button"
                  onClick={openInvitePage}
                  className="mt-4 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  + Invite Teammate
                </button>
              )}
            </div>
          ) : (
            members.map((member, index) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-2xl border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 font-bold">
                    {member.role === "owner" ? "👑" : "👤"}
                  </div>

                  <div>
                    <p className="font-semibold">
                      {member.role === "owner"
                        ? "Team Owner"
                        : `Member ${index + 1}`}
                    </p>

                    <p className="text-sm text-gray-500">
                      User ID: {member.user_id}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize">
                  {member.role}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* TEAM WORKSPACE */}
      <section className="overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-sm">
        <div className="border-b border-violet-100 bg-violet-50/50 p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Team Workspace
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Your team's collaboration and communication space.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">

          {/* TEAM CHAT */}
          <button
            type="button"
            onClick={openChatPage}
            className="group flex items-center gap-5 rounded-2xl border-2 border-violet-200 bg-violet-50 p-6 text-left transition hover:border-violet-500 hover:bg-violet-100"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-3xl text-white shadow-sm">
              💬
            </div>

            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900">
                Team Chat
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                Communicate and share updates with your teammates.
              </p>

              <span className="mt-3 inline-block font-semibold text-violet-700 group-hover:underline">
                Open Team Chat →
              </span>
            </div>
          </button>

          {/* TEAM MEMBERS */}
          <div className="flex items-center gap-5 rounded-2xl border p-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
              👥
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Team Members
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                {memberCount} members collaborating in this team.
              </p>

              <span className="mt-3 inline-block text-sm font-semibold text-blue-700">
                {memberCount} Active Members
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* OTHER TEAM ACTIONS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* Invite */}
        <button
          type="button"
          disabled={!canInvite}
          onClick={openInvitePage}
          className="rounded-2xl border bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="text-2xl">🤝</div>

          <h3 className="mt-3 font-semibold">
            Invite Teammates
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Find students and invite them to your team.
          </p>

          <span className="mt-4 inline-block text-sm font-semibold text-violet-600">
            Invite →
          </span>
        </button>

        {/* AI Matchmaker */}
        <button
          type="button"
          onClick={() =>
            alert("AI Matchmaker will be available soon.")
          }
          className="rounded-2xl border bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-md"
        >
          <div className="text-2xl">🧠</div>

          <h3 className="mt-3 font-semibold">
            AI Matchmaker
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Get AI-powered teammate recommendations based on skills and roles.
          </p>
        </button>

        {/* Schedule */}
        <button
          type="button"
          onClick={() =>
            alert("Schedule checking will be available soon.")
          }
          className="rounded-2xl border bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-md"
        >
          <div className="text-2xl">📅</div>

          <h3 className="mt-3 font-semibold">
            Schedule Check
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Automatically prevent conflicting hackathon participation.
          </p>
        </button>
      </div>
    </div>
  );
}
