"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Users,
  User,
  Crown,
  Trash2,
  UserMinus,
  Search,
  RefreshCw,
  UsersRound,
  AlertTriangle,
} from "lucide-react";

import {
  getHackathonTeams,
  removeTeamMember,
  deleteOrganizerTeam,
  OrganizerTeam,
} from "@/services/organizerHackathon";

export default function TeamsPage() {
  const params = useParams();
  const id = params.id as string;

  const [teams, setTeams] = useState<OrganizerTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function loadTeams() {
    try {
      setLoading(true);
      setError("");

      const data = await getHackathonTeams(id);

      setTeams(data);
    } catch (err: any) {
      console.error("Failed to load teams:", err);

      setError(
        err?.response?.data?.detail ||
          "Failed to load teams."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadTeams();
    }
  }, [id]);

  // ============================================================
  // REMOVE MEMBER
  // ============================================================

  async function handleRemoveMember(
    team: OrganizerTeam,
    member: {
      id: string;
      user_id?: string;
      name: string;
    }
  ) {
    const userId = member.user_id ?? member.id;

    const confirmed = window.confirm(
      `Remove ${member.name} from "${team.name}"?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(
        `remove-${team.id}-${userId}`
      );

      await removeTeamMember(
        id,
        team.id,
        userId
      );

      await loadTeams();
    } catch (err: any) {
      console.error(
        "Failed to remove team member:",
        err
      );

      alert(
        err?.response?.data?.detail ||
          "Failed to remove team member."
      );
    } finally {
      setActionLoading("");
    }
  }

  // ============================================================
  // DELETE TEAM
  // ============================================================

  async function handleDeleteTeam(
    team: OrganizerTeam
  ) {
    const confirmed = window.confirm(
      `Delete the team "${team.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(`delete-${team.id}`);

      await deleteOrganizerTeam(
        id,
        team.id
      );

      setTeams((current) =>
        current.filter(
          (item) => item.id !== team.id
        )
      );
    } catch (err: any) {
      console.error(
        "Failed to delete team:",
        err
      );

      alert(
        err?.response?.data?.detail ||
          "Failed to delete team."
      );
    } finally {
      setActionLoading("");
    }
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalMembers = useMemo(() => {
    return teams.reduce(
      (total, team) =>
        total + (team.members?.length ?? 0),
      0
    );
  }, [teams]);

  const totalCapacity = useMemo(() => {
    return teams.reduce(
      (total, team) =>
        total + (team.max_members ?? 0),
      0
    );
  }, [teams]);

  const averageTeamSize =
    teams.length > 0
      ? (totalMembers / teams.length).toFixed(1)
      : "0";

  const filteredTeams = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) return teams;

    return teams.filter((team) => {
      const teamMatch =
        team.name
          ?.toLowerCase()
          .includes(value) ||
        team.description
          ?.toLowerCase()
          .includes(value);

      const memberMatch =
        team.members?.some(
          (member) =>
            member.name
              ?.toLowerCase()
              .includes(value) ||
            member.email
              ?.toLowerCase()
              .includes(value) ||
            member.username
              ?.toLowerCase()
              .includes(value)
        );

      return teamMatch || memberMatch;
    });
  }, [teams, search]);

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Team Management
            </h1>

            <p className="mt-2 text-gray-500">
              Manage teams and their members for this
              hackathon.
            </p>
          </div>

          <button
            onClick={loadTeams}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border bg-white px-5 py-3 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Refresh
          </button>
        </div>

        {/* STATISTICS */}

        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Teams
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {teams.length}
                </p>
              </div>

              <div className="rounded-xl bg-violet-100 p-3 text-violet-600">
                <UsersRound className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Members
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {totalMembers}
                </p>
              </div>

              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Average Team Size
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {averageTeamSize}
                </p>
              </div>

              <div className="rounded-xl bg-green-100 p-3 text-green-600">
                <User className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Member Capacity
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {totalMembers}/{totalCapacity}
                </p>
              </div>

              <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
                <UsersRound className="h-6 w-6" />
              </div>
            </div>
          </div>

        </div>

        {/* SEARCH */}

        <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="relative">

            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search teams or members..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-4 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />

          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertTriangle className="h-5 w-5" />

            <span>{error}</span>
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-violet-600" />

            <p className="mt-4 text-gray-500">
              Loading teams...
            </p>
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredTeams.length === 0 && (
            <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">

              <UsersRound className="mx-auto h-12 w-12 text-gray-300" />

              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                {search
                  ? "No teams found"
                  : "No teams yet"}
              </h2>

              <p className="mt-2 text-gray-500">
                {search
                  ? "Try a different team or member name."
                  : "Teams will appear here when participants create them."}
              </p>

            </div>
          )}

        {/* TEAMS */}

        {!loading &&
          filteredTeams.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">

              {filteredTeams.map((team) => {

                const memberCount =
                  team.members?.length ?? 0;

                const maxMembers =
                  team.max_members ?? 0;

                const percentage =
                  maxMembers > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (memberCount /
                            maxMembers) *
                            100
                        )
                      )
                    : 0;

                return (
                  <div
                    key={team.id}
                    className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                  >

                    {/* TEAM HEADER */}

                    <div className="border-b p-6">

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <h2 className="truncate text-xl font-bold text-gray-900">
                            {team.name}
                          </h2>

                          <p className="mt-1 text-sm text-gray-500">
                            {team.description ||
                              "No team description"}
                          </p>

                        </div>

                        <button
                          onClick={() =>
                            handleDeleteTeam(team)
                          }
                          disabled={
                            actionLoading ===
                            `delete-${team.id}`
                          }
                          title="Delete team"
                          className="rounded-xl p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>

                      </div>

                      {/* CAPACITY */}

                      <div className="mt-5">

                        <div className="mb-2 flex justify-between text-sm">

                          <span className="font-medium text-gray-600">
                            Team capacity
                          </span>

                          <span className="font-semibold text-gray-900">
                            {memberCount}/
                            {maxMembers}
                          </span>

                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">

                          <div
                            className="h-full rounded-full bg-violet-600 transition-all"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />

                        </div>

                      </div>

                    </div>

                    {/* MEMBERS */}

                    <div className="p-6">

                      <div className="mb-4 flex items-center justify-between">

                        <h3 className="font-semibold text-gray-900">
                          Members
                        </h3>

                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                          {memberCount} members
                        </span>

                      </div>

                      {memberCount === 0 ? (
                        <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-gray-500">
                          No members in this team.
                        </div>
                      ) : (
                        <div className="space-y-3">

                          {team.members.map(
                            (member) => {

                              const isOwner =
                                member.id ===
                                team.owner_id ||
                                member.user_id ===
                                team.owner_id;

                              const removeKey =
                                `remove-${team.id}-${member.user_id ?? member.id}`;

                              return (
                                <div
                                  key={
                                    member.id
                                  }
                                  className="flex items-center justify-between rounded-xl border bg-slate-50 p-4"
                                >

                                  <div className="flex min-w-0 items-center gap-3">

                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700">
                                      {member.name
                                        ?.charAt(
                                          0
                                        )
                                        ?.toUpperCase() ||
                                        "U"}
                                    </div>

                                    <div className="min-w-0">

                                      <div className="flex items-center gap-2">

                                        <p className="truncate font-semibold text-gray-900">
                                          {member.name}
                                        </p>

                                        {isOwner && (
                                          <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                                            <Crown className="h-3 w-3" />
                                            Owner
                                          </span>
                                        )}

                                      </div>

                                      <p className="truncate text-sm text-gray-500">
                                        {member.email}
                                      </p>

                                      {member.username && (
                                        <p className="text-xs text-gray-400">
                                          @{member.username}
                                        </p>
                                      )}

                                    </div>

                                  </div>

                                  {!isOwner && (
                                    <button
                                      onClick={() =>
                                        handleRemoveMember(
                                          team,
                                          member
                                        )
                                      }
                                      disabled={
                                        actionLoading ===
                                        removeKey
                                      }
                                      title="Remove member"
                                      className="ml-3 shrink-0 rounded-xl p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                                    >
                                      {actionLoading ===
                                      removeKey ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <UserMinus className="h-4 w-4" />
                                      )}
                                    </button>
                                  )}

                                </div>
                              );
                            }
                          )}

                        </div>
                      )}

                    </div>

                  </div>
                );
              })}

            </div>
          )}

      </div>
    </div>
  );
}