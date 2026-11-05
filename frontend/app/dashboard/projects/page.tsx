"use client";

import { useEffect, useState } from "react";
import {
  createProject,
  deleteProject,
  getMyProjects,
  updateProject,
  Project,
  ProjectPayload,
} from "@/services/project";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  const [form, setForm] = useState<ProjectPayload>({
    title: "",
    description: "",
    tech_stack: "",
    github_url: "",
    demo_url: "",
    team_id: null,
    ai_tools_used: "",
  });

  const [saving, setSaving] = useState(false);

  // =====================================================
  // LOAD PROJECTS
  // =====================================================

  async function loadProjects() {
    try {
      setLoading(true);

      const data = await getMyProjects();

      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  // =====================================================
  // FORM HELPERS
  // =====================================================

  function resetForm() {
    setForm({
      title: "",
      description: "",
      tech_stack: "",
      github_url: "",
      demo_url: "",
      team_id: null,
      ai_tools_used: "",
    });

    setEditingProject(null);
    setShowForm(false);
  }

  function startCreate() {
    setEditingProject(null);

    setForm({
      title: "",
      description: "",
      tech_stack: "",
      github_url: "",
      demo_url: "",
      team_id: null,
      ai_tools_used: "",
    });

    setShowForm(true);
  }

  function startEdit(project: Project) {
    setEditingProject(project);

    setForm({
      title: project.title,
      description: project.description || "",
      tech_stack: project.tech_stack || "",
      github_url: project.github_url || "",
      demo_url: project.demo_url || "",
      team_id: project.team_id,
      ai_tools_used: project.ai_tools_used || "",
    });

    setShowForm(true);
  }

  // =====================================================
  // CREATE / UPDATE
  // =====================================================

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Project title is required");
      return;
    }

    try {
      setSaving(true);

      if (editingProject) {
        await updateProject(
          editingProject.id,
          form
        );
      } else {
        await createProject(form);
      }

      await loadProjects();

      resetForm();
    } catch (error) {
      console.error(
        "Failed to save project:",
        error
      );

      alert(
        "Failed to save project. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // DELETE
  // =====================================================

  async function handleDelete(
    projectId: string
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject(projectId);

      setProjects((current) =>
        current.filter(
          (project) =>
            project.id !== projectId
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete project:",
        error
      );

      alert(
        "Failed to delete project."
      );
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-32 rounded-xl bg-gray-200" />
          <div className="h-32 rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-full bg-gray-50 p-6">
      {/* HEADER */}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Projects
          </h1>

          <p className="mt-1 text-gray-500">
            Build, manage and showcase your projects.
          </p>
        </div>

        <button
          onClick={startCreate}
          className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          + New Project
        </button>
      </div>

      {/* CREATE / EDIT FORM */}

      {showForm && (
        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {editingProject
                ? "Edit Project"
                : "Create Project"}
            </h2>

            <button
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-black"
            >
              Cancel
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* TITLE */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Project Title *
              </label>

              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                placeholder="Enter project title"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* DESCRIPTION */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>

              <textarea
                value={form.description || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target.value,
                  })
                }
                placeholder="Describe your project"
                rows={4}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* TECH STACK */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Tech Stack
              </label>

              <input
                type="text"
                value={form.tech_stack || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tech_stack:
                      e.target.value,
                  })
                }
                placeholder="React, FastAPI, PostgreSQL..."
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* URLS */}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  GitHub URL
                </label>

                <input
                  type="url"
                  value={form.github_url || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      github_url:
                        e.target.value,
                    })
                  }
                  placeholder="https://github.com/..."
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Demo URL
                </label>

                <input
                  type="url"
                  value={form.demo_url || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      demo_url:
                        e.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                AI Tools Used (optional)
              </label>

              <p className="mb-2 text-xs text-gray-400">
                Transparency, not policing - let judges know what AI
                assistance you used, if any.
              </p>

              <textarea
                value={form.ai_tools_used || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    ai_tools_used: e.target.value,
                  })
                }
                placeholder="e.g. ChatGPT for boilerplate code, GitHub Copilot for autocomplete"
                rows={2}
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* BUTTONS */}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-black px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingProject
                    ? "Update Project"
                    : "Create Project"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border px-6 py-3 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EMPTY STATE */}

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
            🚀
          </div>

          <h2 className="text-xl font-semibold text-gray-900">
            No projects yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-gray-500">
            Create your first project and start
            building your portfolio.
          </p>

          <button
            onClick={startCreate}
            className="mt-6 rounded-xl bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        /* PROJECT GRID */

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              {/* PROJECT TITLE */}

              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {project.title}
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    Created{" "}
                    {new Date(
                      project.created_at
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-100 px-3 py-2 text-lg">
                  💻
                </div>
              </div>

              {/* DESCRIPTION */}

              <p className="mb-4 line-clamp-3 text-sm text-gray-600">
                {project.description ||
                  "No description provided."}
              </p>

              {/* TECH STACK */}

              {project.tech_stack && (
                <div className="mb-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Tech Stack
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {project.tech_stack
                      .split(",")
                      .map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                        >
                          {tech.trim()}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* LINKS */}

              <div className="mb-5 flex gap-3">
                {project.github_url && (
                  <a
                    href={
                      project.github_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    GitHub ↗
                  </a>
                )}

                {project.demo_url && (
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Live Demo ↗
                  </a>
                )}
              </div>

              {project.ai_tools_used && (
                <div className="rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-700">
                  <span className="font-medium">AI tools used:</span>{" "}
                  {project.ai_tools_used}
                </div>
              )}

              {/* ACTIONS */}

              <div className="flex gap-2 border-t pt-4">
                <button
                  onClick={() =>
                    startEdit(project)
                  }
                  className="flex-1 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    handleDelete(project.id)
                  }
                  className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}