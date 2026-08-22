"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  useParams,
  useSearchParams,
  useRouter,
} from "next/navigation";

import {
  getJudgeProject,
  getMyEvaluation,
  createEvaluation,
  JudgeProject,
  Evaluation,
} from "@/services/judge";

export default function EvaluateProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = params.projectId as string;

  const hackathonId =
    searchParams.get("hackathon") || "";

  const [project, setProject] =
    useState<JudgeProject | null>(null);

  const [evaluation, setEvaluation] =
    useState<Evaluation | null>(null);

  const [innovation, setInnovation] =
    useState(5);

  const [technical, setTechnical] =
    useState(5);

  const [impact, setImpact] =
    useState(5);

  const [presentation, setPresentation] =
    useState(5);

  const [overall, setOverall] =
    useState(5);

  const [feedback, setFeedback] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  // =========================================================
  // LOAD PROJECT + EXISTING EVALUATION
  // =========================================================

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        if (!hackathonId) {
          setError(
            "Hackathon ID is missing."
          );
          return;
        }

        // -----------------------------------------------
        // Load project
        // -----------------------------------------------

        const projectData =
          await getJudgeProject(
            hackathonId,
            projectId
          );

        setProject(projectData);

        // -----------------------------------------------
        // Check whether this judge already evaluated it
        // -----------------------------------------------

        try {
          const existing =
            await getMyEvaluation(
              projectId
            );

          if (existing) {
            setEvaluation(existing);

            setInnovation(
              existing.innovation_score
            );

            setTechnical(
              existing.technical_score
            );

            setImpact(
              existing.impact_score
            );

            setPresentation(
              existing.presentation_score
            );

            setOverall(
              existing.overall_score
            );

            setFeedback(
              existing.feedback || ""
            );
          }
        } catch (evaluationError) {
          console.error(
            "Could not load existing evaluation:",
            evaluationError
          );

          // Do not block project loading if
          // there is no existing evaluation.
        }
      } catch (err: any) {
        console.error(
          "Failed to load project:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Failed to load project."
        );
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      load();
    }
  }, [projectId, hackathonId]);

  // =========================================================
  // SUBMIT EVALUATION
  // =========================================================

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    // -----------------------------------------------
    // Prevent duplicate submission
    // -----------------------------------------------

    if (evaluation) {
      setError(
        "You have already evaluated this project."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const data = {
        project_id: projectId,

        innovation_score:
          innovation,

        technical_score:
          technical,

        impact_score:
          impact,

        presentation_score:
          presentation,

        overall_score:
          overall,

        feedback:
          feedback.trim() || undefined,
      };

      const created =
        await createEvaluation(data);

      setEvaluation(created);

      setMessage(
        "Evaluation submitted successfully."
      );
    } catch (err: any) {
      console.error(
        "Failed to submit evaluation:",
        err
      );

      const status =
        err?.response?.status;

      const detail =
        err?.response?.data?.detail;

      if (status === 409) {
        setError(
          detail ||
            "You have already evaluated this project."
        );
      } else if (status === 403) {
        setError(
          detail ||
            "You are not authorized to evaluate this project."
        );
      } else {
        setError(
          detail ||
            "Failed to submit evaluation."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-10 text-center shadow-sm">
          <p className="text-gray-500">
            Loading project...
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // ERROR WITHOUT PROJECT
  // =========================================================

  if (error && !project) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => router.back()}
            className="mb-6 text-sm font-semibold text-violet-600 hover:text-violet-800"
          >
            ← Back to Projects
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!project) {
    return null;
  }

  // =========================================================
  // SCORE INPUT
  // =========================================================

  function ScoreInput({
    label,
    value,
    setValue,
  }: {
    label: string;
    value: number;
    setValue: (value: number) => void;
  }) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="font-semibold text-gray-700">
            {label}
          </label>

          <span className="rounded-lg bg-violet-100 px-3 py-1 font-bold text-violet-700">
            {value}/10
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={value}
          disabled={!!evaluation}
          onChange={(e) =>
            setValue(
              Number(e.target.value)
            )
          }
          className="w-full accent-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>1</span>
          <span>10</span>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl">

        {/* ================================================= */}
        {/* BACK */}
        {/* ================================================= */}

        <button
          onClick={() => router.back()}
          className="mb-6 text-sm font-semibold text-violet-600 hover:text-violet-800"
        >
          ← Back to Projects
        </button>

        {/* ================================================= */}
        {/* PROJECT DETAILS */}
        {/* ================================================= */}

        <div className="rounded-3xl border bg-white p-8 shadow-sm">

          <div className="flex flex-col justify-between gap-6 md:flex-row">

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">
                Project
              </p>

              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                {project.title}
              </h1>

              <p className="mt-2 text-gray-500">
                Team:{" "}
                <span className="font-semibold text-gray-700">
                  {project.team_name}
                </span>
              </p>
            </div>

            {/* LINKS */}

            <div className="flex gap-3">

              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  GitHub
                </a>
              )}

              {project.demo_url && (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Live Demo
                </a>
              )}

            </div>
          </div>

          {/* DESCRIPTION */}

          <div className="mt-8 border-t pt-6">

            <h2 className="text-xl font-bold text-gray-900">
              Project Description
            </h2>

            <p className="mt-3 leading-7 text-gray-600">
              {project.description ||
                "No description provided."}
            </p>

            {/* TECH STACK */}

            {project.tech_stack && (
              <div className="mt-6">

                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Technology Stack
                </h3>

                <p className="mt-2 text-gray-700">
                  {project.tech_stack}
                </p>

              </div>
            )}

          </div>
        </div>

        {/* ================================================= */}
        {/* EVALUATION */}
        {/* ================================================= */}

        <div className="mt-6 rounded-3xl border bg-white p-8 shadow-sm">

          <div className="mb-8">

            <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">
              Judge Evaluation
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              {evaluation
                ? "Evaluation Submitted"
                : "Evaluate Project"}
            </h2>

            {evaluation && (
              <p className="mt-2 text-sm text-gray-500">
                You have already evaluated this
                project. Each judge can evaluate a
                project only once.
              </p>
            )}

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {message && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
              {message}
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="space-y-8"
          >

            {/* INNOVATION */}

            <ScoreInput
              label="Innovation"
              value={innovation}
              setValue={setInnovation}
            />

            {/* TECHNICAL */}

            <ScoreInput
              label="Technical Quality"
              value={technical}
              setValue={setTechnical}
            />

            {/* IMPACT */}

            <ScoreInput
              label="Impact"
              value={impact}
              setValue={setImpact}
            />

            {/* PRESENTATION */}

            <ScoreInput
              label="Presentation"
              value={presentation}
              setValue={setPresentation}
            />

            {/* OVERALL */}

            <ScoreInput
              label="Overall Score"
              value={overall}
              setValue={setOverall}
            />

            {/* FEEDBACK */}

            <div>

              <label className="mb-2 block font-semibold text-gray-700">
                Feedback
              </label>

              <textarea
                value={feedback}
                disabled={!!evaluation}
                onChange={(e) =>
                  setFeedback(
                    e.target.value
                  )
                }
                rows={5}
                maxLength={5000}
                placeholder="Provide constructive feedback for the team..."
                className="w-full rounded-xl border border-gray-300 p-4 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-50"
              />

              <p className="mt-1 text-right text-xs text-gray-400">
                {feedback.length}/5000
              </p>

            </div>

            {/* SUBMIT */}

            {!evaluation ? (
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-violet-600 py-4 font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Submitting Evaluation..."
                  : "Submit Evaluation"}
              </button>
            ) : (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center font-semibold text-green-700">
                ✓ Evaluation saved successfully
              </div>
            )}

          </form>

        </div>

      </div>
    </main>
  );
}