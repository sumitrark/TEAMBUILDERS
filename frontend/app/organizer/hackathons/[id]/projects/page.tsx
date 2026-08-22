"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ExternalLink,
  GitBranch,
  FolderGit2,
  Users,
} from "lucide-react";

import {
  getHackathonProjects,
  OrganizerProject,
} from "@/services/organizerHackathon";

export default function ProjectsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [projects, setProjects] = useState<OrganizerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError("");

        const data = await getHackathonProjects(id);

        setProjects(data);
      } catch (err: any) {
        console.error("Failed to load projects:", err);

        setError(
          err?.response?.data?.detail ||
            "Failed to load projects"
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadProjects();
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-violet-100 p-3">
              <FolderGit2 className="h-7 w-7 text-violet-600" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Projects
              </h1>

              <p className="mt-1 text-gray-500">
                View projects submitted by hackathon teams.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Projects
            </p>

            <p className="mt-2 text-3xl font-bold">
              {projects.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Projects With GitHub
            </p>

            <p className="mt-2 text-3xl font-bold">
              {
                projects.filter(
                  (project) => project.github_url
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Projects With Demo
            </p>

            <p className="mt-2 text-3xl font-bold">
              {
                projects.filter(
                  (project) => project.demo_url
                ).length
              }
            </p>
          </div>

        </div>

        {/* Content */}
        {loading ? (
          <div className="rounded-2xl border bg-white p-12 text-center">
            <p className="text-gray-500">
              Loading projects...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-600">
              {error}
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border bg-white p-12 text-center">
            <FolderGit2 className="mx-auto h-12 w-12 text-gray-300" />

            <h2 className="mt-4 text-xl font-semibold">
              No projects yet
            </h2>

            <p className="mt-2 text-gray-500">
              Teams have not submitted any projects yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
              >

                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-xl bg-violet-100 p-3">
                    <FolderGit2 className="h-5 w-5 text-violet-600" />
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                    Submitted
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900">
                  {project.title}
                </h2>

                <p className="mt-2 line-clamp-3 text-sm text-gray-500">
                  {project.description ||
                    "No description provided."}
                </p>

                {project.tech_stack && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase text-gray-400">
                      Tech Stack
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      {project.tech_stack}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">

                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      <GitBranch className="h-4 w-4" />
                      GitHub
                    </a>
                  )}

                  {project.demo_url && (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Demo
                    </a>
                  )}

                </div>

                <button
                  onClick={() =>
                    router.push(
                      `/organizer/hackathons/${id}/projects/${project.id}`
                    )
                  }
                  className="mt-5 w-full rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-700"
                >
                  View Project
                </button>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}