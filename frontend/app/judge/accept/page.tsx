"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function JudgeAcceptPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

        {/* Pointer to the unified invitations page for email invitations */}
        <div className="w-full rounded-2xl border border-violet-200 bg-violet-50 p-5 text-center">
          <p className="text-sm text-violet-700">
            Were you invited to judge by email?{" "}
            <Link
              href="/dashboard/invitations"
              className="font-semibold underline hover:text-violet-900"
            >
              View your invitations
            </Link>
          </p>
        </div>

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
              If a hackathon organizer gave you an invitation code
              directly, enter it below.
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
                <span className="text-base">✅</span>

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
