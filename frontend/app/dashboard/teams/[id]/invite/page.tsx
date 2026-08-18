"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface User {
  id: string;
  full_name: string;
  username: string | null;
  email: string;
  college?: string | null;
  course?: string | null;
  skills?: string[] | null;
  preferred_roles?: string[] | null;
}

interface Team {
  id: string;
  name: string;
  max_members: number;
}

export default function InviteMemberPage() {
  const params = useParams();
  const router = useRouter();

  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        // Load my teams
        const teamsResponse = await api.get("/teams/my");

        const currentTeam = teamsResponse.data.find(
          (item: Team) => item.id === teamId
        );

        if (!currentTeam) {
          setError("Team not found.");
          return;
        }

        setTeam(currentTeam);

        // Load registered users
        const usersResponse = await api.get("/users");

        setUsers(usersResponse.data);
      } catch (err: any) {
        console.error("Failed to load invite page:", err);

        if (err.response?.status === 401) {
          setError("Your session has expired. Please login again.");
        } else {
          setError(
            err.response?.data?.detail ||
              "Failed to load students."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    if (teamId) {
      loadData();
    }
  }, [teamId]);

  // =========================
  // SEND INVITATION
  // =========================

  async function inviteUser(userId: string) {
    try {
      setInviting(userId);
      setMessage("");
      setError("");

      await api.post(
        `/team-invitations/${teamId}`,
        {
          user_id: userId,
        }
      );

      setMessage("Invitation sent successfully.");

    } catch (err: any) {
      console.error("Invitation failed:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to send invitation."
      );
    } finally {
      setInviting(null);
    }
  }

  // =========================
  // SEARCH
  // =========================

  const query = search.trim().toLowerCase();

  const filteredUsers = users.filter((user) => {
    if (!query) {
      return true;
    }

    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.college?.toLowerCase().includes(query)
    );
  });

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-violet-600" />

          <p className="mt-4 text-gray-500">
            Finding teammates...
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // TEAM NOT FOUND
  // =========================

  if (error && !team) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <button
          onClick={() => router.back()}
          className="mb-6 text-sm text-gray-500 hover:text-black"
        >
          ← Back
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <div className="mx-auto max-w-5xl p-6">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-gray-500 hover:text-black"
      >
        ← Back to Team
      </button>

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-violet-600">
          {team?.name}
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Invite Teammates
        </h1>

        <p className="mt-2 text-gray-500">
          Find students and invite them to join your team.
        </p>
      </div>

      {/* Success */}
      {message && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          ✓ {message}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">

        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Search students
        </label>

        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setMessage("");
            setError("");
          }}
          placeholder="Search by name, username, email or college..."
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        />

        <p className="mt-2 text-sm text-gray-400">
          {filteredUsers.length} student
          {filteredUsers.length === 1 ? "" : "s"} found
        </p>
      </div>

      {/* Users */}
      <div className="space-y-4">

        {filteredUsers.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <p className="font-semibold text-gray-700">
              No students found
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Try searching with a different name or email.
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
            >

              <div className="flex items-center gap-4">

                {/* Avatar */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">
                  {user.full_name?.charAt(0).toUpperCase() || "U"}
                </div>

                {/* User information */}
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {user.full_name}
                  </h2>

                  <p className="text-sm text-gray-500">
                    @{user.username || "user"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {user.email}
                  </p>

                  {user.college && (
                    <p className="mt-1 text-xs text-gray-400">
                      {user.college}
                    </p>
                  )}
                </div>

              </div>

              {/* Invite */}
              <button
                type="button"
                onClick={() => inviteUser(user.id)}
                disabled={inviting === user.id}
                className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {inviting === user.id
                  ? "Sending..."
                  : "Invite"}
              </button>

            </div>
          ))
        )}

      </div>

    </div>
  );
}