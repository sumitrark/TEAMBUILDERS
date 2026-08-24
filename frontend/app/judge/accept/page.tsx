"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface PendingInvitation {
  judge_id: string;
  hackathon_id: string;
  hackathon_title: string;
  status: string;
  created_at: string;
}

export default function JudgeAcceptPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [pending, setPending] = useState<PendingInvitation[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // =========================================================
  // LOAD PENDING EMAIL INVITATIONS
  // =========================================================

  useEffect(() => {
    async function loadPending() {
      try {
        setLoadingPending(true);

        const response = await api.get(
          "/judge/invitations/pending"
        );

        setPending(
          Array.isArray(response.data) ? response.data : []
        );
      } catch (err) {
        console.error("Failed to load pending invitations:", err);
      } finally {
        setLoadingPending(false);
      }
    }

    loadPending();
  }, []);

  // =========================================================
  // RESPOND TO A PENDING EMAIL INVITATION
  // =========================================================

  async function respondToInvitation(
    judgeId: string,
    action: "accept" | "decline"
  ) {
    try {
      setRespondingId(judgeId);
      setError("");
      setMessage("");

      const response = await api.post(
        `/judge/invitations/${judgeId}/${action}`
      );

      setMessage(
        response.data?.message ||
          (action === "accept"
            ? "Invitation accepted."
            : "Invitation declined.")
      );

      setPending((previous) =>
        previous.filter((item) => item.judge_id !== judgeId)
      );

      if (action === "accept") {
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      }
    } catch (err: any) {
      console.error(
        `Failed to ${action} invitation:`,
        err
      );

      setError(
        err?.response?.data?.detail ||
          `Failed to ${action} invitation.`
      );
    } finally {
      setRespondingId(null);
    }
  }

  async function handleAccept(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const invitationCode = code.trim();

    if (!invitationCode) {
      setError("Please enter the invitation code.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await api.post(
        "/judge/hackathons/accept",
        {
          invitation_code: invitationCode,
        }
      );

      setMessage(
        response.data?.message ||
          "Judge invitation accepted successfully."
      );

      setCode("");

      // Give the user time to see the success message.
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error(
        "Failed to accept invitation:",
        error
      );

      setError(
        error?.response?.data?.detail ||
          "Failed to accept invitation. Please check the code and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 px-6 py-12">
      <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center gap-6">

        {/* Pending email invitations */}
        {!loadingPending && pending.length > 0 && (
          <div className="w-full rounded-3xl border border-gray-200 bg-white p-6 shadow-xl">

            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Pending Judge Invitations
            </h2>

            <div className="space-y-3">
              {pending.map((invite) => (
                <div
                  key={invite.judge_id}
                  className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {invite.hackathon_title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Invited to judge this hackathon
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        respondToInvitation(invite.judge_id, "accept")
                      }
                      disabled={respondingId === invite.judge_id}
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Accept
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        respondToInvitation(invite.judge_id, "decline")
                      }
                      disabled={respondingId === invite.judge_id}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        <div className="w-full rounded-3xl border border-gray-200 bg-white p-8 shadow-xl">
          
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-3xl">
              ⚖️
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Judge Invitation
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              You have been invited to become a judge.
              Enter the secure invitation code provided
              by the hackathon organizer.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleAccept}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="invitation-code"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Invitation Code
              </label>

              <input
                id="invitation-code"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                  setMessage("");
                }}
                placeholder="Enter invitation code"
                autoComplete="off"
                disabled={loading}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-mono text-sm outline-none transition placeholder:font-sans placeholder:text-gray-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <span className="text-base">⚠️</span>

                <p>{error}</p>
              </div>
            )}

            {/* Success */}
            {message && (
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                <span className="text-base">✓</span>

                <p>{message}</p>
              </div>
            )}

            {/* Accept */}
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full rounded-xl bg-violet-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Accepting Invitation..."
                : "Accept Judge Invitation"}
            </button>
          </form>

          {/* Back */}
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="mt-4 w-full rounded-xl border border-gray-200 py-3 font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Go Back
          </button>

          {/* Security note */}
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-xs leading-5 text-gray-500">
              🔒 Keep your invitation code private.
              It is used to authorize your judge access.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}