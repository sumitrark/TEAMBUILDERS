
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Pencil,
  Trash2,
  Users,
  Plus,
  X,
  Loader2,
  UserPlus,
  UserMinus,
  Eye,
} from "lucide-react";

import { api } from "@/lib/api";

import {
  createTeam,
  updateTeam,
  deleteTeam,
  Team,
} from "@/services/team";

import {
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  TeamMember,
} from "@/services/teamMember";

import { useTeams } from "@/hooks/useTeams";

export default function TeamsPage() {
  const router = useRouter();

  const { teams, loading: teamsLoading } = useTeams();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  const [form, setForm] = useState({
    name: "",
    description: "",
    max_members: 4,
  });

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [memberUserId, setMemberUserId] = useState("");

  const [loading, setLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Load the authenticated user.
  useEffect(() => {
    let mounted = true;

    async function loadCurrentUser() {
      try {
        const response = await api.get("/auth/me");

        if (mounted) {
          setCurrentUserId(String(response.data.id));
        }
      } catch (err) {
        console.error("Unable to load current user:", err);

        if (mounted) {
          setError("Unable to identify your account. Please log in again.");
        }
      } finally {
        if (mounted) {
          setUserLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  // Load actual member counts. The owner is counted separately.
  useEffect(() => {
    let mounted = true;

    async function loadMemberCounts() {
      if (!teams.length) {
        setMemberCounts({});
        return;
      }

      try {
        const results = await Promise.all(
          teams.map(async (team) => {
            try {
              const teamMembers = await getTeamMembers(team.id);
              return [team.id, teamMembers.length + 1] as const;
            } catch (err) {
              console.error(
                `Unable to load members for ${team.name}:`,
                err
              );
              return [team.id, 1] as const;
            }
          })
        );

        if (mounted) {
          setMemberCounts(Object.fromEntries(results));
        }
      } catch (err) {
        console.error("Unable to load team member counts:", err);
      }
    }

    loadMemberCounts();

    return () => {
      mounted = false;
    };
  }, [teams]);

  // Separate teams according to their actual owner.
  const ownedTeams = useMemo(
    () =>
      currentUserId
        ? teams.filter(
            (team) => String(team.owner_id) === currentUserId
          )
        : [],
    [teams, currentUserId]
  );

  const joinedTeams = useMemo(
    () =>
      currentUserId
        ? teams.filter(
            (team) => String(team.owner_id) !== currentUserId
          )
        : [],
    [teams, currentUserId]
  );

  // CREATE TEAM
  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Team name is required.");
      return;
    }

    if (form.max_members < 2 || form.max_members > 10) {
      setError("Maximum members must be between 2 and 10.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createTeam({
        name: form.name.trim(),
        description: form.description.trim(),
        max_members: form.max_members,
      });

      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail || "Unable to create team."
      );
    } finally {
      setLoading(false);
    }
  }

  // START EDITING
  function startEditing(team: Team) {
    setEditingTeam(team);

    setForm({
      name: team.name,
      description: team.description || "",
      max_members: team.max_members,
    });

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // UPDATE TEAM
  async function handleUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingTeam) return;

    if (!form.name.trim()) {
      setError("Team name is required.");
      return;
    }

    if (form.max_members < 2 || form.max_members > 10) {
      setError("Maximum members must be between 2 and 10.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await updateTeam(editingTeam.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        max_members: form.max_members,
      });

      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail || "Unable to update team."
      );
    } finally {
      setLoading(false);
    }
  }

  // CANCEL EDIT
  function cancelEdit() {
    setEditingTeam(null);
    setForm({
      name: "",
      description: "",
      max_members: 4,
    });
    setError("");
  }

  // DELETE TEAM
  async function handleDelete(team: Team) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${team.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(team.id);
      setError("");

      await deleteTeam(team.id);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail || "Unable to delete team."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // OPEN TEAM DETAILS
  function openTeamDetails(team: Team) {
    router.push(`/dashboard/teams/${team.id}`);
  }

  // OPEN INVITATION PAGE
  function openInvitePage(team: Team) {
    router.push(`/dashboard/teams/${team.id}/invite`);
  }

  // MANAGE MEMBERS
  async function openMembers(team: Team) {
    try {
      setSelectedTeam(team);
      setMemberLoading(true);
      setError("");

      const data = await getTeamMembers(team.id);
      setMembers(data);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail || "Unable to load team members."
      );
    } finally {
      setMemberLoading(false);
    }
  }

  // ADD MEMBER
  async function handleAddMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedTeam) return;

    if (!memberUserId.trim()) {
      setError("Enter a user ID.");
      return;
    }

    try {
      setMemberLoading(true);
      setError("");

      await addTeamMember(selectedTeam.id, memberUserId.trim());

      setMemberUserId("");

      const updatedMembers = await getTeamMembers(selectedTeam.id);
      setMembers(updatedMembers);

      setMemberCounts((previous) => ({
        ...previous,
        [selectedTeam.id]: updatedMembers.length + 1,
      }));
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail || "Unable to add member."
      );
    } finally {
      setMemberLoading(false);
    }
  }

  // REMOVE MEMBER
  async function handleRemoveMember(userId: string) {
    if (!selectedTeam) return;

    const confirmed = window.confirm(
      "Remove this member from the team?"
    );

    if (!confirmed) return;

    try {
      setMemberLoading(true);
      setError("");

      await removeTeamMember(selectedTeam.id, userId);

      const updatedMembers = await getTeamMembers(selectedTeam.id);
      setMembers(updatedMembers);

      setMemberCounts((previous) => ({
        ...previous,
        [selectedTeam.id]: updatedMembers.length + 1,
      }));
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail || "Unable to remove member."
      );
    } finally {
      setMemberLoading(false);
    }
  }

  // CLOSE MEMBERS
  function closeMembers() {
    setSelectedTeam(null);
    setMembers([]);
    setMemberUserId("");
    setError("");
  }

  // TEAM CARD
  function TeamCard({
    team,
    isOwner,
  }: {
    team: Team;
    isOwner: boolean;
  }) {
    const count = memberCounts[team.id] ?? 1;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
              <Users size={22} className="text-violet-600" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {team.name}
              </h3>

              <p className="text-sm text-slate-500">
                {isOwner ? "Created by you" : "Joined team"}
              </p>
            </div>
          </div>

          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            {isOwner ? "Owner" : "Member"}
          </span>
        </div>

        <p className="mt-5 min-h-[48px] text-sm leading-6 text-slate-600">
          {team.description || "No description provided."}
        </p>

        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
          <Users size={17} />
          <span>
            Members: {count} / {team.max_members}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openTeamDetails(team)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            <Eye size={16} />
            View Details
          </button>

          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => openMembers(team)}
                className="flex items-center justify-center gap-2 rounded-xl bg-violet-50 px-3 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-100"
              >
                <UserPlus size={16} />
                Members
              </button>

              <button
                type="button"
                onClick={() => openInvitePage(team)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Invite
              </button>

              <button
                type="button"
                onClick={() => startEditing(team)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={16} />
                Edit
              </button>

              <button
                type="button"
                onClick={() => handleDelete(team)}
                disabled={deletingId === team.id}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                {deletingId === team.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8">
      {/* HEADER */}
      <div>
        <p className="text-sm font-semibold text-violet-600">
          TEAM MANAGEMENT
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          My Teams
        </h1>

        <p className="mt-2 text-slate-500">
          Create and manage your hackathon teams.
        </p>
      </div>

      {/* ERROR */}
      {error && !selectedTeam && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CREATE / EDIT TEAM */}
      <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100">
            {editingTeam ? (
              <Pencil size={21} className="text-violet-600" />
            ) : (
              <Plus size={22} className="text-violet-600" />
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {editingTeam ? "Edit Team" : "Create Team"}
            </h2>

            <p className="text-sm text-slate-500">
              {editingTeam
                ? "Update your team information."
                : "Start a new hackathon team."}
            </p>
          </div>
        </div>

        <form
          onSubmit={editingTeam ? handleUpdate : handleCreate}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Team Name
            </label>

            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="Enter team name"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Tell us about your team"
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Maximum Members
            </label>

            <input
              type="number"
              min={2}
              max={10}
              value={form.max_members}
              onChange={(e) =>
                setForm({
                  ...form,
                  max_members: Number(e.target.value),
                })
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />

            <p className="mt-1 text-xs text-slate-500">
              Choose between 2 and 10 members.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {loading && (
                <Loader2 size={18} className="animate-spin" />
              )}
              {editingTeam ? "Save Changes" : "Create Team"}
            </button>

            {editingTeam && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TEAMS LOADING */}
      {teamsLoading || userLoading ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-3">
            <Loader2
              size={30}
              className="animate-spin text-violet-600"
            />
            <p className="text-sm text-slate-500">
              Loading your teams...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* CREATED BY YOU */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Teams Created by You
                </h2>
                <p className="text-sm text-slate-500">
                  Teams where you are the owner.
                </p>
              </div>

              <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
                {ownedTeams.length}{" "}
                {ownedTeams.length === 1 ? "Team" : "Teams"}
              </span>
            </div>

            {ownedTeams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <Users
                  size={36}
                  className="mx-auto mb-3 text-slate-400"
                />
                <p className="font-semibold text-slate-700">
                  You haven't created a team yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {ownedTeams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    isOwner={true}
                  />
                ))}
              </div>
            )}
          </section>

          {/* JOINED TEAMS */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Joined Teams
                </h2>
                <p className="text-sm text-slate-500">
                  Teams you joined after accepting an invitation.
                </p>
              </div>

              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                {joinedTeams.length}{" "}
                {joinedTeams.length === 1 ? "Team" : "Teams"}
              </span>
            </div>

            {joinedTeams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <Users
                  size={36}
                  className="mx-auto mb-3 text-slate-400"
                />
                <p className="font-semibold text-slate-700">
                  You haven't joined any teams yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {joinedTeams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    isOwner={false}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* MEMBERS MODAL - OWNER ONLY */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Manage Members
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedTeam.name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeMembers}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6">
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-slate-900">
                  Add Member Directly
                </h3>

                <form
                  onSubmit={handleAddMember}
                  className="flex gap-2"
                >
                  <input
                    value={memberUserId}
                    onChange={(e) => setMemberUserId(e.target.value)}
                    placeholder="Enter user ID"
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                  />

                  <button
                    type="submit"
                    disabled={memberLoading}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {memberLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <UserPlus size={16} />
                    )}
                    Add
                  </button>
                </form>

                <p className="mt-2 text-xs text-slate-400">
                  For normal users, use the Invite button instead.
                  They must accept the invitation.
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-slate-900">
                  Current Members
                </h3>

                {memberLoading && members.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Loader2
                      size={24}
                      className="animate-spin text-violet-600"
                    />
                  </div>
                ) : members.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                    No additional members yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700">
                            M
                          </div>

                          <div>
                            <p className="font-medium text-slate-900">
                              Member
                            </p>
                            <p className="text-xs text-slate-500">
                              {member.role}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveMember(member.user_id)
                          }
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          title="Remove member"
                        >
                          <UserMinus size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
