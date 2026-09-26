"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  Users,
  FolderGit2,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

import { getWorkspace, WorkspaceData } from "@/services/hackathon";
import { submitProject } from "@/services/project";
import ProctoringCheckIn from "@/components/dashboard/ProctoringCheckIn";

function formatCountdown(seconds: number | null): string {
  if (seconds === null) return "";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function statusLabel(status: string): { text: string; color: string } {
  switch (status) {
    case "UPCOMING":
      return { text: "Upcoming", color: "bg-slate-100 text-slate-600" };
    case "REGISTRATION_OPEN":
      return {
        text: "Registration Open",
        color: "bg-blue-100 text-blue-700",
      };
    case "REGISTRATION_CLOSED":
      return {
        text: "Registration Closed",
        color: "bg-amber-100 text-amber-700",
      };
    case "LIVE":
      return { text: "Live", color: "bg-emerald-100 text-emerald-700" };
    case "COMPLETED":
      return { text: "Completed", color: "bg-slate-200 text-slate-700" };
    case "CANCELLED":
      return { text: "Cancelled", color: "bg-red-100 text-red-700" };
    default:
      return { text: status, color: "bg-slate-100 text-slate-600" };
  }
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.id as string;

  const [data, setData] = useState<WorkspaceData | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const result = await getWorkspace(hackathonId);
      setData(result);
      setSecondsRemaining(result.seconds_remaining);
    } catch (err: any) {
      console.error("Failed to load workspace:", err);
      setError(
        err?.response?.data?.detail ||
          "Unable to load your hackathon workspace."
      );
    } finally {
      setLoading(false);
    }
  }, [hackathonId]);

  // Initial load, then re-sync with the server periodically (never
  // trust the client-side countdown alone for anything beyond
  // display - every enforcement decision happens backend-side).
  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  // Client-side ticking between server syncs, purely for display.
  useEffect(() => {
    if (secondsRemaining === null) return;

    const tick = setInterval(() => {
      setSecondsRemaining((prev) =>
        prev !== null && prev > 0 ? prev - 1 : prev
      );
    }, 1000);

    return () => clearInterval(tick);
  }, [secondsRemaining !== null]);

  async function handleSubmit() {
    if (!data?.project) return;

    try {
      setSubmitting(true);
      setSubmitMessage("");
      const result = await submitProject(data.project.id);
      setSubmitMessage(
        `Submitted successfully (version ${result.version_number}).`
      );
      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || "Failed to submit your project."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your workspace...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const badge = statusLabel(data.lifecycle_status);
  const isLive = data.lifecycle_status === "LIVE";
  const isCompleted = data.lifecycle_status === "COMPLETED";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">

      {/* HEADER */}
      <div className="mb-8">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {badge.text}
        </span>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          {data.hackathon.title}
        </h1>

        <p className="mt-2 text-slate-500">{data.hackathon.description}</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* COUNTDOWN */}
      {secondsRemaining !== null && (
        <div className="mb-8 rounded-2xl border border-violet-200 bg-violet-50 p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-violet-600">
            <Clock className="h-4 w-4" />
            {data.lifecycle_status === "UPCOMING"
              ? "Starts in"
              : "Time remaining"}
          </div>
          <p className="mt-2 font-mono text-4xl font-bold text-violet-900">
            {formatCountdown(secondsRemaining)}
          </p>
          {isLive && secondsRemaining < 3600 && (
            <p className="mt-2 text-sm font-medium text-amber-600">
              Less than 1 hour remaining
            </p>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
          Submission is closed. This hackathon has ended.
        </div>
      )}

      {/* TEAM + PROJECT */}
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <Users className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Team
            </span>
          </div>

          {data.team ? (
            <p className="text-lg font-bold text-slate-900">
              {data.team.name}
            </p>
          ) : (
            <div>
              <p className="text-sm text-slate-400">
                You haven't joined a team yet.
              </p>
              <button
                onClick={() => router.push("/dashboard/teams")}
                className="mt-3 flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-800"
              >
                Find or create a team <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <FolderGit2 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Project
            </span>
          </div>

          {data.project ? (
            <>
              <p className="text-lg font-bold text-slate-900">
                {data.project.title}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Status:{" "}
                <span className="font-semibold">{data.project.status}</span>
                {data.latest_submission_version && (
                  <> · Version {data.latest_submission_version}</>
                )}
              </p>
            </>
          ) : (
            <div>
              <p className="text-sm text-slate-400">
                {data.team
                  ? "No project created yet."
                  : "Join a team first to create a project."}
              </p>
              {data.team && (
                <button
                  onClick={() => router.push("/dashboard/projects")}
                  className="mt-3 flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-800"
                >
                  Create a project <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      {data.project && isLive && (
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => router.push("/dashboard/projects")}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
          >
            Continue Building
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-xl bg-violet-600 py-3 text-center font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Project"}
          </button>
        </div>
      )}

      {submitMessage && (
        <div className="mb-8 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {submitMessage}
        </div>
      )}

      {/* PROCTORING */}
      {isLive && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Proctoring
            </span>
          </div>
          <ProctoringCheckIn hackathonId={hackathonId} />
        </div>
      )}

    </div>
  );
}
