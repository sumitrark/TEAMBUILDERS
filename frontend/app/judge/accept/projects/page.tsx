"use client";

import { Suspense, useEffect, useState } from "react";
import {
  useSearchParams,
  useRouter,
} from "next/navigation";

import {
  getJudgeProjects,
  JudgeProject,
} from "@/services/judge";


// =========================================================
// PROJECTS CONTENT
// =========================================================

function JudgeProjectsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const hackathonId =
    searchParams.get("hackathon") || "";

  const [projects, setProjects] =
    useState<JudgeProject[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =======================================================
  // LOAD PROJECTS
  // =======================================================

  useEffect(() => {
    async function loadProjects() {
      if (!hackathonId) {
        setError(
          "Hackathon ID is missing."
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data =
          await getJudgeProjects(
            hackathonId
          );

        setProjects(data);
      } catch (err: any) {
        console.error(
          "Failed to load judge projects:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Failed to load projects."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [hackathonId]);


  // =======================================================
  // PAGE
  // =======================================================

  return (
    <main className="min-h-screen bg-slate-50 p-8">

      <div className="mx-auto max-w-7xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-8">

          <button
            type="button"
            onClick={() => router.back()}
            className="mb-5 text-sm font-semibold text-violet-600 hover:text-violet-800"
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Judge Projects
          </h1>

          <p className="mt-2 text-gray-500">
            Review and evaluate projects submitted
            to this hackathon.
          </p>

        </div>


        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}


        {/* ================================================= */}
        {/* LOADING */}
        {/* ================================================= */}

        {loading && (
          <div className="rounded-2xl border bg-white p-10 text-center text-gray-500 shadow-sm">
            Loading projects...
          </div>
        )}


        {/* ================================================= */}
        {/* NO PROJECTS */}
        {/* ================================================= */}

        {!loading &&
          !error &&
          projects.length === 0 && (
            <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">

              <div className="text-5xl">
                📁
              </div>

              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                No projects yet
              </h2>

              <p className="mt-2 text-gray-500">
                Projects submitted to this hackathon
                will appear here.
              </p>

            </div>
          )}


        {/* ================================================= */}
        {/* PROJECT LIST */}
        {/* ================================================= */}

        {!loading &&
          !error &&
          projects.length > 0 && (
            <>

              {/* PROJECT COUNT */}

              <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Submitted Projects
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Select a project to review and
                      submit your evaluation.
                    </p>
                  </div>

                  <div className="rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700">
                    {projects.length}{" "}
                    {projects.length === 1
                      ? "Project"
                      : "Projects"}
                  </div>

                </div>

              </div>


              {/* PROJECT CARDS */}

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {projects.map((project) => (

                  <div
                    key={project.id}
                    className="flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >

                    {/* CARD HEADER */}

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <h2 className="truncate text-xl font-bold text-gray-900">
                          {project.title}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          Team:{" "}
                          <span className="font-medium text-gray-700">
                            {project.team_name}
                          </span>
                        </p>

                      </div>

                      <span className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                        Project
                      </span>

                    </div>


                    {/* DESCRIPTION */}

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
                      {project.description ||
                        "No description provided."}
                    </p>


                    {/* TECH STACK */}

                    {project.tech_stack && (
                      <div className="mt-4">

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Tech Stack
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm text-gray-700">
                          {project.tech_stack}
                        </p>

                      </div>
                    )}


                    {/* LINKS */}

                    <div className="mt-4 flex gap-3">

                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-gray-600 hover:text-gray-900"
                        >
                          GitHub ↗
                        </a>
                      )}

                      {project.demo_url && (
                        <a
                          href={project.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-gray-600 hover:text-gray-900"
                        >
                          Live Demo ↗
                        </a>
                      )}

                    </div>


                    {/* PUSH BUTTON TO BOTTOM */}

                    <div className="mt-auto pt-6">

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/judge/accept/projects/${project.id}?hackathon=${hackathonId}`
                          )
                        }
                        className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700 active:scale-[0.99]"
                      >
                        Review & Evaluate
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            </>
          )}

      </div>

    </main>
  );
}


// =========================================================
// PAGE EXPORT WITH SUSPENSE
// =========================================================

export default function JudgeProjectsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-8">

          <div className="mx-auto max-w-5xl rounded-2xl border bg-white p-10 text-center shadow-sm">

            <p className="text-gray-500">
              Loading projects...
            </p>

          </div>

        </main>
      }
    >
      <JudgeProjectsContent />
    </Suspense>
  );
}