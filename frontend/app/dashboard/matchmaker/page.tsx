"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Team {
  id: string;
  name: string;
  max_members: number;
  owner_id: string;
}

interface TeamWithCount extends Team {
  member_count: number;
}

interface Recommendation {
  user_id: string;
  full_name: string;
  username: string | null;
  college: string;
  course: string;
  year: number;
  bio: string | null;
  skills: string[];
  preferred_roles: string[];
  match_score: number;
  matched_skills: string[];
  matched_roles: string[];
}

interface MatchmakerResponse {
  recommendations: Recommendation[];
}

export default function MatchmakerPage() {
  const router = useRouter();

  const [recommendations, setRecommendations] = useState<
    Recommendation[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Invitation states
  const [teams, setTeams] = useState<TeamWithCount[]>([]);
  const [selectedUser, setSelectedUser] =
    useState<Recommendation | null>(null);

  const [selectedTeam, setSelectedTeam] = useState("");

  const [loadingTeams, setLoadingTeams] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");

  // =========================================================
  // LOAD TEAMS
  // =========================================================

  async function loadTeams() {
    try {
      setLoadingTeams(true);
      setInviteError("");

      const response = await api.get("/teams/my");

      const myTeams: Team[] = response.data || [];

      const teamsWithCounts = await Promise.all(
        myTeams.map(async (team) => {
          try {
            const membersResponse = await api.get(
              `/team-members/${team.id}`
            );

            return {
              ...team,
              member_count:
                membersResponse.data?.length || 0,
            };
          } catch (err) {
            console.error(
              `Failed to load members for team ${team.id}`,
              err
            );

            return {
              ...team,
              member_count: 0,
            };
          }
        })
      );

      setTeams(teamsWithCounts);
    } catch (err: any) {
      console.error(
        "Failed to load teams:",
        err
      );

      if (err.response?.status === 401) {
        setInviteError(
          "Your session has expired. Please login again."
        );
      } else {
        setInviteError(
          err.response?.data?.detail ||
            "Failed to load your teams."
        );
      }
    } finally {
      setLoadingTeams(false);
    }
  }

  // =========================================================
  // LOAD RECOMMENDATIONS
  // =========================================================

  async function loadRecommendations() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<MatchmakerResponse>(
          "/matchmaker/recommendations?limit=20"
        );

      setRecommendations(
        response.data.recommendations || []
      );
    } catch (err: any) {
      console.error(
        "Failed to load matchmaker recommendations:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to load teammate recommendations."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecommendations();
  }, []);

  // =========================================================
  // OPEN INVITE MODAL
  // =========================================================

  async function openInviteModal(
    user: Recommendation
  ) {
    setSelectedUser(user);
    setSelectedTeam("");
    setInviteMessage("");
    setInviteError("");

    await loadTeams();
  }

  // =========================================================
  // CLOSE INVITE MODAL
  // =========================================================

  function closeInviteModal() {
    if (sendingInvite) {
      return;
    }

    setSelectedUser(null);
    setSelectedTeam("");
    setInviteMessage("");
    setInviteError("");
  }

  // =========================================================
  // SEND INVITATION
  // =========================================================

  async function sendInvitation() {
    if (!selectedUser) {
      return;
    }

    if (!selectedTeam) {
      setInviteError(
        "Please select a team first."
      );
      return;
    }

    try {
      setSendingInvite(true);
      setInviteError("");
      setInviteMessage("");

      await api.post(
        `/team-invitations/${selectedTeam}`,
        {
          user_id: selectedUser.user_id,
        }
      );

      setInviteMessage(
        `Invitation sent to ${selectedUser.full_name}.`
      );

      // Close modal after a short success message
      setTimeout(() => {
        setSelectedUser(null);
        setSelectedTeam("");
        setInviteMessage("");
      }, 1800);
    } catch (err: any) {
      console.error(
        "Failed to send invitation:",
        err
      );

      if (err.response?.status === 401) {
        setInviteError(
          "Your session has expired. Please login again."
        );
      } else {
        setInviteError(
          err.response?.data?.detail ||
            "Failed to send invitation."
        );
      }
    } finally {
      setSendingInvite(false);
    }
  }

  // =========================================================
  // HELPERS
  // =========================================================

  function getMatchColor(score: number) {
    if (score >= 80) {
      return "text-green-600";
    }

    if (score >= 60) {
      return "text-violet-600";
    }

    if (score >= 40) {
      return "text-amber-600";
    }

    return "text-slate-500";
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">

          <div className="h-10 w-72 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-3 h-5 w-96 animate-pulse rounded bg-slate-200" />

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="h-80 animate-pulse rounded-3xl bg-white shadow-sm"
                />
              )
            )}

          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-2xl">

          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-3xl">
              ⚠️
            </div>

            <h2 className="mt-5 text-xl font-bold text-red-800">
              Unable to load Matchmaker
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={loadRecommendations}
              className="mt-6 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="border-b bg-white">

        <div className="mx-auto max-w-7xl px-6 py-8">

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

            <div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                🤖 SMART MATCHMAKER
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Find Your Perfect Teammates
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Discover students whose skills and
                preferred roles complement yours.
              </p>

            </div>

            <button
              type="button"
              onClick={loadRecommendations}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              ↻ Refresh Matches
            </button>

          </div>

        </div>

      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Matchmaker explanation */}

        <div className="mb-8 rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-7 text-white shadow-lg">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-sm font-semibold text-violet-200">
                PERSONALIZED RECOMMENDATIONS
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Your next teammate could be here.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100">
                Matches are calculated using skills,
                preferred roles, course compatibility
                and profile information.
              </p>

            </div>

            <div className="rounded-2xl bg-white/10 px-6 py-5 backdrop-blur">

              <p className="text-xs font-medium uppercase tracking-wide text-violet-200">
                Matches Found
              </p>

              <p className="mt-1 text-3xl font-bold">
                {recommendations.length}
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            EMPTY STATE
        ================================================== */}

        {recommendations.length === 0 ? (

          <div className="rounded-3xl border bg-white p-12 text-center shadow-sm">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-4xl">
              👥
            </div>

            <h2 className="mt-6 text-xl font-bold text-slate-900">
              No teammates found yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try adding more skills and preferred
              roles to your profile so the Matchmaker
              can find better recommendations.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/profile"
                )
              }
              className="mt-6 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Update My Profile
            </button>

          </div>

        ) : (

          /* =================================================
             RECOMMENDATION GRID
          ================================================== */

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            {recommendations.map(
              (person, index) => (

                <div
                  key={person.user_id}
                  className="group rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >

                  {/* Rank + Match */}

                  <div className="flex items-center justify-between">

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      #{index + 1} Match
                    </span>

                    <span
                      className={`text-2xl font-bold ${getMatchColor(
                        person.match_score
                      )}`}
                    >
                      {Math.round(
                        person.match_score
                      )}
                      %
                    </span>

                  </div>

                  {/* Profile */}

                  <div className="mt-6 flex items-center gap-4">

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-bold text-white">
                      {getInitials(
                        person.full_name
                      )}
                    </div>

                    <div className="min-w-0">

                      <h3 className="truncate text-lg font-bold text-slate-900">
                        {person.full_name}
                      </h3>

                      {person.username && (
                        <p className="truncate text-sm text-slate-400">
                          @{person.username}
                        </p>
                      )}

                    </div>

                  </div>

                  {/* Basic Information */}

                  <div className="mt-5 space-y-2">

                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <span>🎓</span>

                      <span className="line-clamp-1">
                        {person.course}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <span>🏫</span>

                      <span className="line-clamp-1">
                        {person.college}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span>📚</span>

                      <span>
                        Year {person.year}
                      </span>
                    </div>

                  </div>

                  {/* Bio */}

                  {person.bio && (
                    <p className="mt-5 line-clamp-2 text-sm leading-5 text-slate-500">
                      {person.bio}
                    </p>
                  )}

                  {/* Matched Skills */}

                  <div className="mt-5">

                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Matched Skills
                    </p>

                    {person.matched_skills &&
                    person.matched_skills.length > 0 ? (

                      <div className="flex flex-wrap gap-2">

                        {person.matched_skills
                          .slice(0, 5)
                          .map(
                            (skill) => (
                              <span
                                key={skill}
                                className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                              >
                                ✓ {skill}
                              </span>
                            )
                          )}

                      </div>

                    ) : (

                      <p className="text-xs text-slate-400">
                        No direct skill overlap
                      </p>

                    )}

                  </div>

                  {/* Roles */}

                  <div className="mt-4">

                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Preferred Roles
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {(person.preferred_roles || [])
                        .slice(0, 3)
                        .map(
                          (role) => (
                            <span
                              key={role}
                              className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"
                            >
                              {role}
                            </span>
                          )
                        )}

                    </div>

                  </div>

                  {/* Match Breakdown */}

                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-xs font-medium text-slate-500">
                        Compatibility
                      </span>

                      <span className="text-xs font-bold text-slate-700">
                        {Math.round(
                          person.match_score
                        )}
                        %
                      </span>

                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">

                      <div
                        className="h-full rounded-full bg-violet-600 transition-all"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              person.match_score,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* Actions */}

                  <div className="mt-6 flex gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/profile/${person.user_id}`
                        )
                      }
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View Profile
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openInviteModal(person)
                      }
                      className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                    >
                      Invite
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* =====================================================
          INVITE MODAL
      ====================================================== */}

      {selectedUser && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeInviteModal();
            }
          }}
        >

          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">

            {/* Modal Header */}

            <div className="flex items-start justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-bold text-white">
                  {getInitials(
                    selectedUser.full_name
                  )}
                </div>

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Invite{" "}
                    {selectedUser.full_name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Choose a team to send the
                    invitation to.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={closeInviteModal}
                disabled={sendingInvite}
                className="rounded-xl px-3 py-2 text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* Teams */}

            <div className="mt-7">

              <p className="mb-3 text-sm font-semibold text-slate-800">
                Select Team
              </p>

              {loadingTeams ? (

                <div className="rounded-2xl bg-slate-50 p-8 text-center">

                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />

                  <p className="mt-3 text-sm text-slate-500">
                    Loading your teams...
                  </p>

                </div>

              ) : teams.length === 0 ? (

                <div className="rounded-2xl border border-dashed p-7 text-center">

                  <div className="text-3xl">
                    👥
                  </div>

                  <p className="mt-3 font-semibold text-slate-800">
                    You don't have a team yet
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Create a team first before
                    inviting teammates.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/dashboard/teams"
                      )
                    }
                    className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    Go to My Teams
                  </button>

                </div>

              ) : (

                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">

                  {teams.map((team) => {

                    const isFull =
                      team.member_count >=
                      team.max_members;

                    const isSelected =
                      selectedTeam === team.id;

                    return (

                      <button
                        key={team.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => {
                          setSelectedTeam(
                            team.id
                          );
                          setInviteError("");
                        }}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          isFull
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                            : isSelected
                            ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/20"
                            : "border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50"
                        }`}
                      >

                        <div className="flex items-center justify-between">

                          <div>

                            <p className="font-semibold text-slate-900">
                              {team.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {team.member_count} /{" "}
                              {team.max_members}{" "}
                              members
                            </p>

                          </div>

                          {isFull ? (

                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                              Full
                            </span>

                          ) : isSelected ? (

                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                              ✓
                            </span>

                          ) : (

                            <span className="h-7 w-7 rounded-full border-2 border-slate-300" />

                          )}

                        </div>

                      </button>

                    );
                  })}

                </div>

              )}

            </div>

            {/* Error */}

            {inviteError && (

              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {inviteError}
              </div>

            )}

            {/* Success */}

            {inviteMessage && (

              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                ✓ {inviteMessage}
              </div>

            )}

            {/* Send Button */}

            {teams.length > 0 && (

              <button
                type="button"
                disabled={
                  !selectedTeam ||
                  sendingInvite ||
                  loadingTeams
                }
                onClick={sendInvitation}
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {sendingInvite
                  ? "Sending Invitation..."
                  : "Send Invitation"}

              </button>

            )}

          </div>

        </div>

      )}

    </div>
  );
}