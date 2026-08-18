"use client";

import { FormEvent, useState } from "react";
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
} from "lucide-react";

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

  const {
    teams,
    loading: teamsLoading,
  } = useTeams();

  // ==================================================
  // FORM
  // ==================================================

  const [form, setForm] = useState({
    name: "",
    description: "",
    max_members: 4,
  });

  const [editingTeam, setEditingTeam] =
    useState<Team | null>(null);

  const [selectedTeam, setSelectedTeam] =
    useState<Team | null>(null);

  const [members, setMembers] =
    useState<TeamMember[]>([]);

  const [memberUserId, setMemberUserId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [memberLoading, setMemberLoading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  // ==================================================
  // CREATE TEAM
  // ==================================================

  async function handleCreate(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Team name is required.");
      return;
    }

    if (
      form.max_members < 2 ||
      form.max_members > 10
    ) {
      setError(
        "Maximum members must be between 2 and 10."
      );
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

      setForm({
        name: "",
        description: "",
        max_members: 4,
      });

      window.location.reload();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to create team."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // START EDITING
  // ==================================================

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

  // ==================================================
  // UPDATE TEAM
  // ==================================================

  async function handleUpdate(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!editingTeam) return;

    if (!form.name.trim()) {
      setError("Team name is required.");
      return;
    }

    if (
      form.max_members < 2 ||
      form.max_members > 10
    ) {
      setError(
        "Maximum members must be between 2 and 10."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await updateTeam(
        editingTeam.id,
        {
          name: form.name.trim(),
          description: form.description.trim(),
          max_members: form.max_members,
        }
      );

      setEditingTeam(null);

      setForm({
        name: "",
        description: "",
        max_members: 4,
      });

      window.location.reload();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to update team."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // DELETE TEAM
  // ==================================================

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
        err?.response?.data?.detail ||
          "Unable to delete team."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ==================================================
  // MANAGE MEMBERS
  // ==================================================

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
        err?.response?.data?.detail ||
          "Unable to load team members."
      );
    } finally {
      setMemberLoading(false);
    }
  }

  // ==================================================
  // ADD MEMBER
  // ==================================================

  async function handleAddMember(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!selectedTeam) return;

    if (!memberUserId.trim()) {
      setError("Enter a user ID.");
      return;
    }

    try {
      setMemberLoading(true);
      setError("");

      await addTeamMember(
        selectedTeam.id,
        memberUserId.trim()
      );

      setMemberUserId("");

      const updatedMembers =
        await getTeamMembers(
          selectedTeam.id
        );

      setMembers(updatedMembers);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to add member."
      );
    } finally {
      setMemberLoading(false);
    }
  }

  // ==================================================
  // REMOVE MEMBER
  // ==================================================

  async function handleRemoveMember(
    userId: string
  ) {
    if (!selectedTeam) return;

    const confirmed = window.confirm(
      "Remove this member from the team?"
    );

    if (!confirmed) return;

    try {
      setMemberLoading(true);
      setError("");

      await removeTeamMember(
        selectedTeam.id,
        userId
      );

      const updatedMembers =
        await getTeamMembers(
          selectedTeam.id
        );

      setMembers(updatedMembers);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to remove member."
      );
    } finally {
      setMemberLoading(false);
    }
  }

  // ==================================================
  // CANCEL EDIT
  // ==================================================

  function cancelEdit() {
    setEditingTeam(null);

    setForm({
      name: "",
      description: "",
      max_members: 4,
    });

    setError("");
  }

  // ==================================================
  // CLOSE MEMBERS
  // ==================================================

  function closeMembers() {
    setSelectedTeam(null);
    setMembers([]);
    setMemberUserId("");
    setError("");
  }

  // ==================================================
  // OPEN INVITATION PAGE
  // ==================================================

  function openInvitePage(team: Team) {
    router.push(
      `/dashboard/teams/${team.id}/invite`
    );
  }

  // ==================================================
  // UI
  // ==================================================

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

        <div className="mb-6 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100">

              {editingTeam ? (
                <Pencil
                  size={21}
                  className="text-violet-600"
                />
              ) : (
                <Plus
                  size={22}
                  className="text-violet-600"
                />
              )}

            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                {editingTeam
                  ? "Edit Team"
                  : "Create Team"}
              </h2>

              <p className="text-sm text-slate-500">
                {editingTeam
                  ? "Update your team information."
                  : "Start a new hackathon team."}
              </p>

            </div>

          </div>

          {editingTeam && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          )}

        </div>

        <form
          onSubmit={
            editingTeam
              ? handleUpdate
              : handleCreate
          }
          className="space-y-5"
        >

          {/* TEAM NAME */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Team Name
            </label>

            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              placeholder="Enter team name"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />

          </div>

          {/* DESCRIPTION */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              placeholder="Tell us about your team"
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />

          </div>

          {/* MAXIMUM MEMBERS */}

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
                  max_members:
                    Number(e.target.value),
                })
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />

            <p className="mt-1 text-xs text-slate-500">
              Choose between 2 and 10 members.
            </p>

          </div>

          {/* BUTTONS */}

          <div className="flex gap-3">

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading && (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )}

              {editingTeam
                ? "Save Changes"
                : "Create Team"}

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

      {/* MY TEAMS */}

      <div>

        <div className="mb-5 flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-bold text-slate-900">
              My Teams
            </h2>

            <p className="text-sm text-slate-500">
              Teams created by you.
            </p>

          </div>

          <div className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
            {teams.length}{" "}
            {teams.length === 1
              ? "Team"
              : "Teams"}
          </div>

        </div>

        {/* LOADING */}

        {teamsLoading ? (

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

        ) : teams.length === 0 ? (

          /* EMPTY */

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

            <Users
              size={42}
              className="mx-auto mb-4 text-slate-400"
            />

            <h3 className="text-lg font-semibold text-slate-800">
              No teams yet
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Create your first team to get started.
            </p>

          </div>

        ) : (

          /* TEAM CARDS */

          <div className="grid gap-5 md:grid-cols-2">

            {teams.map((team: Team) => (

              <div
                key={team.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                {/* TEAM HEADER */}

                <div className="flex items-start justify-between">

                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">

                      <Users
                        size={22}
                        className="text-violet-600"
                      />

                    </div>

                    <div>

                      <h3 className="text-xl font-bold text-slate-900">
                        {team.name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        Team Owner
                      </p>

                    </div>

                  </div>

                </div>

                {/* DESCRIPTION */}

                <p className="mt-5 min-h-[48px] text-sm leading-6 text-slate-600">
                  {team.description ||
                    "No description provided."}
                </p>

                {/* MEMBER COUNT */}

                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">

                  <Users size={17} />

                  <span>
                    Members: 1 / {team.max_members}
                  </span>

                </div>

                {/* ACTIONS */}

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">

                  {/* MEMBERS */}

                  <button
                    type="button"
                    onClick={() =>
                      openMembers(team)
                    }
                    className="flex items-center justify-center gap-1 rounded-xl bg-violet-50 px-3 py-2.5 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
                  >
                    <UserPlus size={16} />
                    Members
                  </button>

                  {/* INVITE */}

                  <button
                    type="button"
                    onClick={() =>
                      openInvitePage(team)
                    }
                    className="flex items-center justify-center gap-1 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    <UserPlus size={16} />
                    Invite
                  </button>

                  {/* EDIT */}

                  <button
                    type="button"
                    onClick={() =>
                      startEditing(team)
                    }
                    className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                  {/* DELETE */}

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(team)
                    }
                    disabled={
                      deletingId === team.id
                    }
                    className="flex items-center justify-center gap-1 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >

                    {deletingId === team.id ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={16} />
                    )}

                    Delete

                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* MEMBERS MODAL */}

      {selectedTeam && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

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

            {/* CONTENT */}

            <div className="max-h-[70vh] overflow-y-auto p-6">

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* OLD DIRECT ADD MEMBER */}

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
                    onChange={(e) =>
                      setMemberUserId(
                        e.target.value
                      )
                    }
                    placeholder="Enter user ID"
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                  />

                  <button
                    type="submit"
                    disabled={memberLoading}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >

                    {memberLoading ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <UserPlus size={16} />
                    )}

                    Add

                  </button>

                </form>

                <p className="mt-2 text-xs text-slate-400">
                  For normal users, use the Invite button
                  instead. They must accept the invitation.
                </p>

              </div>

              {/* CURRENT MEMBERS */}

              <div>

                <h3 className="mb-3 font-semibold text-slate-900">
                  Current Members
                </h3>

                {memberLoading &&
                members.length === 0 ? (

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

                    {members.map(
                      (member) => (

                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                        >

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700">

                              {member.role ===
                              "owner"
                                ? "O"
                                : "M"}

                            </div>

                            <div>

                              <p className="font-medium text-slate-900">
                                User
                              </p>

                              <p className="text-xs text-slate-500">
                                {member.role}
                              </p>

                            </div>

                          </div>

                          {member.role !==
                            "owner" && (

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveMember(
                                  member.user_id
                                )
                              }
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                              title="Remove member"
                            >
                              <UserMinus
                                size={18}
                              />
                            </button>

                          )}

                        </div>

                      )
                    )}

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