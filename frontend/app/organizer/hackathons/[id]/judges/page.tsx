"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Gavel,
  UserPlus,
  Mail,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

import {
  getHackathonJudges,
  inviteJudge,
  removeJudge,
} from "@/services/organizerHackathon";

interface Judge {
  id: string;
  hackathon_id: string;
  user_id: string;
  name?: string;
  full_name?: string;
  username?: string;
  email: string;
  status: string;
  created_at?: string;
}

export default function JudgesPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [judges, setJudges] = useState<Judge[]>([]);
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadJudges() {
    try {
      setLoading(true);
      setError("");

      const data = await getHackathonJudges(id);

      setJudges(data);
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.detail ??
          "Failed to load judges"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadJudges();
    }
  }, [id]);

  async function handleInvite(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setInviting(true);
      setError("");

      await inviteJudge(
        id,
        email.trim()
      );

      setMessage("Judge invitation created successfully.");

      setEmail("");

      await loadJudges();
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.detail ??
          "Failed to invite judge"
      );
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(judgeId: string) {
    if (!confirm("Remove this judge from the hackathon?")) {
      return;
    }

    try {
      setRemovingId(judgeId);
      setError("");

      await removeJudge(id, judgeId);

      setMessage("Judge removed successfully.");

      await loadJudges();
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.detail ??
          "Failed to remove judge"
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">

          <div>
            <button
              onClick={() => router.back()}
              className="mb-3 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-100 p-3">
                <Gavel className="h-6 w-6 text-violet-600" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Judges
                </h1>

                <p className="mt-1 text-gray-500">
                  Manage judges for this hackathon.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={loadJudges}
            className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {message && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* INVITE */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-100 p-2">
                <UserPlus className="h-5 w-5 text-violet-600" />
              </div>

              <h2 className="text-lg font-bold">
                Invite Judge
              </h2>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Enter the email address of an existing
              user to invite them as a judge.
            </p>

            <form
              onSubmit={handleInvite}
              className="mt-6 space-y-4"
            >

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Judge Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="judge@example.com"
                    className="w-full rounded-xl border py-3 pl-10 pr-3 outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={inviting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                <UserPlus className="h-5 w-5" />

                {inviting
                  ? "Inviting..."
                  : "Invite Judge"}
              </button>

            </form>

          </div>

          {/* JUDGES LIST */}
          <div className="lg:col-span-2">

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

              <div className="border-b p-6">
                <h2 className="text-lg font-bold">
                  Authorized Judges
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {judges.length} judge
                  {judges.length !== 1 ? "s" : ""}
                </p>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading judges...
                </div>
              ) : judges.length === 0 ? (
                <div className="p-10 text-center">
                  <Gavel className="mx-auto h-10 w-10 text-gray-300" />

                  <p className="mt-3 font-medium text-gray-700">
                    No judges yet
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Invite a judge using the form.
                  </p>
                </div>
              ) : (
                <div>
                  {judges.map((judge) => (
                    <div
                      key={judge.id}
                      className="flex items-center justify-between border-b p-5 last:border-b-0"
                    >

                      <div className="flex items-center gap-4">

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700">
                          {(
                            judge.name ??
                            judge.full_name ??
                            judge.email
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900">
                            {judge.name ??
                              judge.full_name ??
                              judge.email}
                          </p>

                          <p className="text-sm text-gray-500">
                            {judge.email}
                          </p>

                          {judge.username && (
                            <p className="text-xs text-gray-400">
                              @{judge.username}
                            </p>
                          )}
                        </div>

                      </div>

                      <div className="flex items-center gap-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            judge.status === "active" ||
                            judge.status === "accepted"
                              ? "bg-green-100 text-green-700"
                              : judge.status === "invited"
                                ? "bg-amber-100 text-amber-700"
                                : judge.status === "declined"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {judge.status}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemove(judge.id)}
                          disabled={removingId === judge.id}
                          className="text-sm font-medium text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {removingId === judge.id
                            ? "Removing..."
                            : "Remove"}
                        </button>

                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}