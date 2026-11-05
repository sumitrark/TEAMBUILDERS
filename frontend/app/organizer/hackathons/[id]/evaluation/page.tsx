"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

interface Judge {
  id: string;
  user_id: string;
  name: string;
  username?: string;
  email: string;
  status: string;
}

interface Project {
  id: string;
  title: string;
  team_id: string | null;
  is_submitted?: boolean;
}

interface Assignment {
  id: string;
  judge_id: string;
  project_id: string;
  created_at: string;
}

interface Progress {
  submitted_projects: number;
  evaluated_projects: number;
  pending_projects: number;
  all_projects_evaluated: boolean;
  results_announcement_at: string | null;
}

export default function OrganizerEvaluationPage() {
  const params = useParams();
  const hackathonId = params.id as string;

  const [judges, setJudges] = useState<Judge[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);

  const [selectedJudge, setSelectedJudge] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [announcementAt, setAnnouncementAt] = useState("");

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [judgesRes, projectsRes, assignmentsRes, progressRes] =
        await Promise.all([
          api.get(`/organizer/hackathons/${hackathonId}/judges`),
          api.get(`/organizer/hackathons/${hackathonId}/projects`),
          api.get(`/organizer/hackathons/${hackathonId}/assignments`),
          api.get(
            `/organizer/hackathons/${hackathonId}/evaluation-progress`
          ),
        ]);

      setJudges(judgesRes.data || []);
      setProjects(projectsRes.data || []);
      setAssignments(assignmentsRes.data || []);
      setProgress(progressRes.data);

      if (progressRes.data?.results_announcement_at) {
        const date = new Date(
          progressRes.data.results_announcement_at
        );

        const local = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000
        );

        setAnnouncementAt(
          local.toISOString().slice(0, 16)
        );
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load evaluation management."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hackathonId) {
      loadData();
    }
  }, [hackathonId]);

  async function assignProject() {
    if (!selectedJudge || !selectedProject) {
      setError("Select both a judge and a project.");
      return;
    }

    try {
      setWorking(true);
      setError("");
      setMessage("");

      await api.post(
        `/organizer/hackathons/${hackathonId}/assignments`,
        {
          judge_id: selectedJudge,
          project_id: selectedProject,
        }
      );

      setMessage("Project assigned successfully.");
      setSelectedProject("");
      await loadData();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to assign project."
      );
    } finally {
      setWorking(false);
    }
  }

  async function removeAssignment(
    judgeId: string,
    projectId: string
  ) {
    try {
      setWorking(true);
      setError("");
      setMessage("");

      await api.delete(
        `/organizer/hackathons/${hackathonId}/assignments/${judgeId}/${projectId}`
      );

      setMessage("Assignment removed.");
      await loadData();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to remove assignment."
      );
    } finally {
      setWorking(false);
    }
  }

  async function scheduleAnnouncement() {
    if (!announcementAt) {
      setError("Choose an announcement date and time.");
      return;
    }

    try {
      setWorking(true);
      setError("");
      setMessage("");

      await api.put(
        `/organizer/hackathons/${hackathonId}/results-announcement`,
        {
          announcement_at: new Date(
            announcementAt
          ).toISOString(),
        }
      );

      setMessage(
        "Results announcement scheduled successfully."
      );

      await loadData();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to schedule results."
      );
    } finally {
      setWorking(false);
    }
  }

  async function clearAnnouncement() {
    try {
      setWorking(true);
      setError("");
      setMessage("");

      await api.delete(
        `/organizer/hackathons/${hackathonId}/results-announcement`
      );

      setAnnouncementAt("");
      setMessage("Results announcement cleared.");

      await loadData();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to clear announcement."
      );
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-10 text-center shadow-sm">
          Loading evaluation management...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">

        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">
            Organizer
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Evaluation & Results
          </h1>

          <p className="mt-2 text-gray-500">
            Assign submitted projects to judges, track evaluations,
            and publish the final leaderboard.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* PROGRESS */}

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          <Stat
            label="Submitted"
            value={progress?.submitted_projects ?? 0}
          />

          <Stat
            label="Evaluated"
            value={progress?.evaluated_projects ?? 0}
          />

          <Stat
            label="Pending"
            value={progress?.pending_projects ?? 0}
          />

          <Stat
            label="Ready to Publish"
            value={
              progress?.all_projects_evaluated
                ? "YES"
                : "NO"
            }
          />
        </section>

        {/* ASSIGN */}

        <section className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Assign Project to Judge
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Only assigned judges can submit evaluations.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <select
              value={selectedJudge}
              onChange={(e) =>
                setSelectedJudge(e.target.value)
              }
              className="rounded-xl border px-4 py-3"
            >
              <option value="">Select judge</option>

              {judges
                .filter(
                  (judge) => judge.status === "active" || judge.status === "accepted"
                )
                .map((judge) => (
                  <option
                    key={judge.id}
                    value={judge.id}
                  >
                    {judge.name || judge.email} ({judge.status})
                  </option>
                ))}
            </select>

            <select
              value={selectedProject}
              onChange={(e) =>
                setSelectedProject(e.target.value)
              }
              className="rounded-xl border px-4 py-3"
            >
              <option value="">Select project</option>

              {projects
                .filter((p) => p.is_submitted)
                .map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.title}
                  </option>
                ))}
            </select>

            <button
              type="button"
              onClick={assignProject}
              disabled={working}
              className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              Assign Project
            </button>
          </div>
        </section>

        {/* ASSIGNMENTS */}

        <section className="mb-8 rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-bold text-gray-900">
              Current Assignments
            </h2>
          </div>

          {assignments.length === 0 ? (
            <p className="p-6 text-gray-500">
              No project assignments yet.
            </p>
          ) : (
            <div className="divide-y">
              {assignments.map((assignment) => {
                const project = projects.find(
                  (item) =>
                    item.id === assignment.project_id
                );

                return (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-4 p-5"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {project?.title ||
                          assignment.project_id}
                      </p>

                      <p className="text-sm text-gray-500">
                        {(() => {
                          const judge = judges.find(
                            (j) => j.id === assignment.judge_id
                          );
                          return judge
                            ? `${judge.name || judge.email}`
                            : `Judge ${assignment.judge_id.slice(0, 8)}`;
                        })()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeAssignment(
                          assignment.judge_id,
                          assignment.project_id
                        )
                      }
                      disabled={working}
                      className="rounded-lg border px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ANNOUNCEMENT */}

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Results Announcement
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Results remain hidden from participants until this
            announcement time.
          </p>

          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Announcement date & time
              </label>

              <input
                type="datetime-local"
                value={announcementAt}
                onChange={(e) =>
                  setAnnouncementAt(e.target.value)
                }
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <button
              type="button"
              onClick={scheduleAnnouncement}
              disabled={working}
              className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Schedule Results
            </button>

            <button
              type="button"
              onClick={clearAnnouncement}
              disabled={working}
              className="rounded-xl border px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          {!progress?.all_projects_evaluated && (
            <p className="mt-4 text-sm font-medium text-amber-600">
              Complete all project evaluations before publishing
              results.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-gray-900">
        {value}
      </p>
    </div>
  );
}
