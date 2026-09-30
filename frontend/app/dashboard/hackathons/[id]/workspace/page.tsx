"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderGit2,
  GitBranch,
  Loader2,
  Users,
} from "lucide-react";

import { getWorkspace, WorkspaceData } from "@/services/hackathon";
import { submitProject } from "@/services/project";
import ProctoringCheckIn from "@/components/dashboard/ProctoringCheckIn";

function formatCountdown(seconds: number | null): string {
  if (seconds === null) return "";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return [h, m, s]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function statusLabel(status: string) {
  switch (status) {
    case "UPCOMING":
      return {
        text: "Upcoming",
        color: "bg-slate-100 text-slate-600",
      };

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
      return {
        text: "Live",
        color: "bg-emerald-100 text-emerald-700",
      };

    case "COMPLETED":
      return {
        text: "Completed",
        color: "bg-slate-200 text-slate-700",
      };

    case "CANCELLED":
      return {
        text: "Cancelled",
        color: "bg-red-100 text-red-700",
      };

    default:
      return {
        text: status,
        color: "bg-slate-100 text-slate-600",
      };
  }
}

function presenceColor(presence: string) {
  switch (presence) {
    case "ONLINE":
      return "bg-emerald-500";

    case "AWAY":
      return "bg-amber-400";

    default:
      return "bg-slate-300";
  }
}

function presenceLabel(presence: string) {
  switch (presence) {
    case "ONLINE":
      return "Online";

    case "AWAY":
      return "Away";

    default:
      return "Offline";
  }
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();

  const hackathonId = params.id as string;

  const [data, setData] = useState<WorkspaceData | null>(null);
  const [secondsRemaining, setSecondsRemaining] =
    useState<number | null>(null);

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

  useEffect(() => {
    load();

    const interval = window.setInterval(load, 30000);

    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (secondsRemaining === null) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsRemaining((previous) =>
        previous !== null && previous > 0
          ? previous - 1
          : previous
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [secondsRemaining !== null]);

  async function handleSubmit() {
    if (!data?.project) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitMessage("");
      setError("");

      const result = await submitProject(
        hackathonId,
        data.project.id
      );

      setSubmitMessage(
        `Submitted successfully — version ${result.version_number}.`
      );

      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Failed to submit your project."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-slate-400">
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

  if (!data) {
    return null;
  }

  const badge = statusLabel(data.lifecycle_status);
  const isLive = data.lifecycle_status === "LIVE";
  const isCompleted = data.lifecycle_status === "COMPLETED";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {badge.text}
            </span>

            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              {data.hackathon.title}
            </h1>

            <p className="mt-2 max-w-3xl text-slate-500">
              {data.hackathon.description}
            </p>
          </div>

          {secondsRemaining !== null && (
            <div className="shrink-0 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-600">
                <Clock className="h-4 w-4" />
                {data.lifecycle_status === "UPCOMING"
                  ? "Starts in"
                  : "Time remaining"}
              </div>

              <p className="mt-1 font-mono text-2xl font-bold text-violet-900">
                {formatCountdown(secondsRemaining)}
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isCompleted && (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
          Submission is closed. This hackathon has ended.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* MAIN */}
        <div className="space-y-6 lg:col-span-2">
          {/* TEAM */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" />

              <div>
                <h2 className="font-bold text-slate-900">
                  {data.team?.name || "Your Team"}
                </h2>

                <p className="text-xs text-slate-500">
                  Shared team workspace
                </p>
              </div>
            </div>

            {data.team ? (
              <div className="space-y-3">
                {data.team_members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {member.name}

                        {member.is_current_user && (
                          <span className="ml-2 text-xs font-medium text-violet-600">
                            You
                          </span>
                        )}
                      </p>

                      <p className="truncate text-xs text-slate-400">
                        {member.email}
                      </p>
                    </div>

                    <div className="ml-4 flex shrink-0 items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${presenceColor(
                          member.presence
                        )}`}
                      />

                      <span className="text-xs font-medium text-slate-500">
                        {presenceLabel(member.presence)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-400">
                  You haven't joined a team yet.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/dashboard/teams")
                  }
                  className="mt-3 flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-800"
                >
                  Find or create a team
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </section>

          {/* PROJECT */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-violet-600" />

              <div>
                <h2 className="font-bold text-slate-900">
                  Project Workspace
                </h2>

                <p className="text-xs text-slate-500">
                  Shared project information
                </p>
              </div>
            </div>

            {data.project ? (
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {data.project.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {data.project.description ||
                        "No project description added yet."}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {data.project.status}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.project.github_url && (
                    <a
                      href={data.project.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <GitBranch className="h-4 w-4" />
                        GitHub Repository
                      </span>

                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </a>
                  )}

                  {data.project.demo_url && (
                    <a
                      href={data.project.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <ExternalLink className="h-4 w-4" />
                        Demo
                      </span>

                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </a>
                  )}
                </div>

                {/* AI DISCLOSURE */}
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    AI tools used
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {data.project.ai_tools_used ||
                      "No AI tools disclosed yet."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/dashboard/projects")
                  }
                  className="mt-5 flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-800"
                >
                  Continue building
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-400">
                  {data.team
                    ? "No project created yet."
                    : "Join a team first to create a project."}
                </p>

                {data.team && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push("/dashboard/projects")
                    }
                    className="mt-3 flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-800"
                  >
                    Create a project
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </section>

          {/* PROCTORING */}
          {isLive && (
            <ProctoringCheckIn
              hackathonId={hackathonId}
            />
          )}

          {/* SUBMISSION */}
          {isLive && (
            <section className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-violet-950">
                    {data.project
                      ? "Ready to submit?"
                      : "Submission"}
                  </h2>

                  <p className="mt-1 text-sm text-violet-700">
                    {data.project
                      ? data.submission_count > 0
                        ? `${data.submission_count} submission version${
                            data.submission_count === 1
                              ? ""
                              : "s"
                          } created.`
                        : "Your team has not submitted a version yet."
                      : "Create your team project first to activate submission."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!data.project || submitting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckCircle2 className="h-5 w-5" />

                  {submitting
                    ? "Submitting..."
                    : "Submit Project"}
                </button>
              </div>
            </section>
          )}

          {submitMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {submitMessage}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">
              Build freely
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use your normal development environment during
              the hackathon. VS Code, terminal, GitHub,
              browsers and permitted AI development tools can
              remain part of your workflow.
            </p>

            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <p>✓ Work locally on your laptop</p>
              <p>✓ Use your preferred browser</p>
              <p>✓ Push code to GitHub</p>
              <p>✓ Use permitted AI tools</p>
              <p>✓ Keep your team workspace updated</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">
              Submission
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Versions
                </span>

                <span className="font-semibold text-slate-800">
                  {data.submission_count}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Latest
                </span>

                <span className="font-semibold text-slate-800">
                  {data.latest_submission_version
                    ? `v${data.latest_submission_version}`
                    : "None"}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}