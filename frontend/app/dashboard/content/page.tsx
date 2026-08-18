"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getMyProjects } from "@/services/project";

interface Project {
  id: string;
  title: string;
  description?: string | null;
}


interface GeneratedContent {
  id: string;
  user_id: string;
  project_id: string | null;
  platform: string;
  content_type: string;
  tone: string;
  prompt: string | null;
  generated_content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const PLATFORMS = [
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "in",
    description: "Professional posts",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    icon: "𝕏",
    description: "Short-form posts",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "◎",
    description: "Captions & announcements",
  },
];

const CONTENT_TYPES = [
  "Hackathon Announcement",
  "Project Launch",
  "Project Showcase",
  "Team Announcement",
  "Achievement",
  "Event Announcement",
];

const TONES = [
  "Professional",
  "Casual",
  "Technical",
  "Inspiring",
];

export default function ContentPage() {
  const [platform, setPlatform] = useState("linkedin");
  const [contentType, setContentType] = useState(
    "Hackathon Announcement"
  );
  const [tone, setTone] = useState("Professional");
  const [projectId, setProjectId] = useState("");
  const [prompt, setPrompt] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [history, setHistory] = useState<GeneratedContent[]>([]);
  const [generated, setGenerated] =
    useState<GeneratedContent | null>(null);

  const [loadingProjects, setLoadingProjects] =
    useState(true);
  const [loadingHistory, setLoadingHistory] =
    useState(true);
  const [generating, setGenerating] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [copied, setCopied] = useState(false);

  // =========================================================
  // LOAD PROJECTS
  // =========================================================

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoadingProjects(true);

        const data = await getMyProjects();

        setProjects(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        console.error(
          "Failed to load projects:",
          err
        );
      } finally {
        setLoadingProjects(false);
      }
    }

    loadProjects();
  }, []);

  // =========================================================
  // LOAD CONTENT HISTORY
  // =========================================================

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoadingHistory(true);

        const response = await api.get(
          "/content/history"
        );

        setHistory(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load content history:",
          err
        );
      } finally {
        setLoadingHistory(false);
      }
    }

    loadHistory();
  }, []);

  // =========================================================
  // GENERATE CONTENT
  // =========================================================

  async function handleGenerate() {
    try {
      setGenerating(true);
      setError("");
      setMessage("");
      setCopied(false);

      const response = await api.post(
        "/content/generate",
        {
          project_id: projectId || null,
          platform,
          content_type: contentType,
          tone: tone.toLowerCase(),
          prompt: prompt.trim() || null,
        }
      );

      const newContent =
        response.data as GeneratedContent;

      setGenerated(newContent);

      setHistory((previous) => [
        newContent,
        ...previous,
      ]);

      setMessage(
        "Content generated successfully."
      );
    } catch (err: any) {
      console.error(
        "Content generation failed:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "Failed to generate content."
        );
      }
    } finally {
      setGenerating(false);
    }
  }

  // =========================================================
  // COPY CONTENT
  // =========================================================

  async function copyContent() {
    if (!generated?.generated_content) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        generated.generated_content
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(
        "Failed to copy content:",
        err
      );
    }
  }

  // =========================================================
  // LOAD HISTORY ITEM
  // =========================================================

  function openHistoryItem(
    item: GeneratedContent
  ) {
    setGenerated(item);

    setPlatform(item.platform);
    setContentType(item.content_type);
    setTone(
      item.tone
        ? item.tone.charAt(0).toUpperCase() +
            item.tone.slice(1)
        : "Professional"
    );

    setProjectId(
      item.project_id || ""
    );

    setPrompt(item.prompt || "");

    setError("");
    setMessage("");
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================

  function formatDate(
    date: string
  ) {
    try {
      return new Date(
        date
      ).toLocaleString();
    } catch {
      return date;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="border-b bg-white">

        <div className="mx-auto max-w-7xl px-6 py-8">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

            <div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                ✨ AI POWERED
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                AI Content Studio
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Create engaging social media content
                for your hackathons, projects,
                achievements and team updates.
              </p>

            </div>

            <div className="rounded-2xl border bg-slate-50 px-5 py-4">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Generations
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {history.length}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* =================================================
              LEFT - GENERATOR
          ================================================== */}

          <div className="lg:col-span-2">

            <div className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">

              <div className="mb-8">

                <h2 className="text-xl font-bold text-slate-900">
                  Create content
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configure your content and let
                  TEAMBUILDERS generate it.
                </p>

              </div>

              {/* =================================================
                  PLATFORM
              ================================================== */}

              <div>

                <label className="mb-3 block text-sm font-semibold text-slate-800">
                  Choose platform
                </label>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

                  {PLATFORMS.map(
                    (item) => {

                      const selected =
                        platform === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setPlatform(item.id)
                          }
                          className={`rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/20"
                              : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"
                          }`}
                        >

                          <div className="flex items-center gap-3">

                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold ${
                                selected
                                  ? "bg-violet-600 text-white"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {item.icon}
                            </div>

                            <div>

                              <p className="font-semibold text-slate-900">
                                {item.name}
                              </p>

                              <p className="text-xs text-slate-500">
                                {item.description}
                              </p>

                            </div>

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

              </div>

              {/* =================================================
                  CONTENT TYPE
              ================================================== */}

              <div className="mt-7">

                <label className="mb-3 block text-sm font-semibold text-slate-800">
                  Content type
                </label>

                <select
                  value={contentType}
                  onChange={(e) =>
                    setContentType(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                >
                  {CONTENT_TYPES.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    )
                  )}
                </select>

              </div>

              {/* =================================================
                  TONE
              ================================================== */}

              <div className="mt-7">

                <label className="mb-3 block text-sm font-semibold text-slate-800">
                  Tone
                </label>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

                  {TONES.map(
                    (item) => {

                      const selected =
                        tone === item;

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            setTone(item)
                          }
                          className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                            selected
                              ? "border-violet-500 bg-violet-600 text-white"
                              : "border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    }
                  )}

                </div>

              </div>

              {/* =================================================
                  PROJECT
              ================================================== */}

              <div className="mt-7">

                <label className="mb-3 block text-sm font-semibold text-slate-800">
                  Project
                  <span className="ml-2 font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <select
                  value={projectId}
                  onChange={(e) =>
                    setProjectId(
                      e.target.value
                    )
                  }
                  disabled={loadingProjects}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:bg-slate-50"
                >

                  <option value="">
                    {loadingProjects
                      ? "Loading projects..."
                      : "Select a project"}
                  </option>

                  {projects.map(
                    (project) => (
                      <option
                        key={project.id}
                        value={project.id}
                      >
                        {project.title}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* =================================================
                  CUSTOM PROMPT
              ================================================== */}

              <div className="mt-7">

                <div className="mb-3 flex items-center justify-between">

                  <label className="block text-sm font-semibold text-slate-800">
                    Additional instructions
                  </label>

                  <span className="text-xs text-slate-400">
                    Optional
                  </span>

                </div>

                <textarea
                  value={prompt}
                  onChange={(e) =>
                    setPrompt(
                      e.target.value
                    )
                  }
                  rows={5}
                  maxLength={5000}
                  placeholder="Tell the AI what you want to communicate. Example: Announce that our team won first place in the college hackathon..."
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />

                <p className="mt-2 text-right text-xs text-slate-400">
                  {prompt.length}/5000
                </p>

              </div>

              {/* =================================================
                  ERROR / SUCCESS
              ================================================== */}

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {message}
                </div>
              )}

              {/* =================================================
                  GENERATE BUTTON
              ================================================== */}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-violet-600 px-6 py-4 font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {generating ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Generating...
                  </>
                ) : (
                  <>
                    ✨ Generate Content
                  </>
                )}

              </button>

            </div>

            {/* =================================================
                GENERATED CONTENT
            ================================================== */}

            <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm md:p-8">

              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Generated Content
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your latest AI-generated content
                    appears here.
                  </p>

                </div>

                {generated && (
                  <div className="flex gap-2">

                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold capitalize text-violet-700">
                      {generated.platform}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                      {generated.tone}
                    </span>

                  </div>
                )}

              </div>

              {!generated ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-3xl">
                    ✨
                  </div>

                  <h3 className="mt-5 font-semibold text-slate-800">
                    Your content will appear here
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    Choose your platform, tone and
                    content type, then click Generate
                    Content.
                  </p>

                </div>
              ) : (
                <div className="mt-6">

                  <div className="rounded-2xl border bg-slate-50 p-6">

                    <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                      {
                        generated.generated_content
                      }
                    </p>

                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">

                    <button
                      type="button"
                      onClick={copyContent}
                      className="rounded-xl border bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {copied
                        ? "✓ Copied"
                        : "Copy Content"}
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating}
                      className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
                    >
                      ↻ Regenerate
                    </button>

                  </div>

                </div>
              )}

            </div>

          </div>

          {/* =================================================
              RIGHT - HISTORY
          ================================================== */}

          <div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">

              <div className="mb-6">

                <h2 className="text-xl font-bold text-slate-900">
                  Generation History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your previous content generations.
                </p>

              </div>

              {loadingHistory ? (
                <div className="space-y-3">

                  {[1, 2, 3].map(
                    (item) => (
                      <div
                        key={item}
                        className="h-24 animate-pulse rounded-2xl bg-slate-100"
                      />
                    )
                  )}

                </div>
              ) : history.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-7 text-center">

                  <div className="text-3xl">
                    📝
                  </div>

                  <p className="mt-3 font-semibold text-slate-700">
                    No generations yet
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Your generated content will
                    appear here.
                  </p>

                </div>
              ) : (
                <div className="space-y-3">

                  {history.map(
                    (item) => {

                      const active =
                        generated?.id ===
                        item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            openHistoryItem(
                              item
                            )
                          }
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            active
                              ? "border-violet-400 bg-violet-50"
                              : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"
                          }`}
                        >

                          <div className="flex items-center justify-between gap-3">

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">
                              {item.platform}
                            </span>

                            <span className="text-[10px] text-slate-400">
                              {formatDate(
                                item.created_at
                              )}
                            </span>

                          </div>

                          <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-800">
                            {item.content_type}
                          </p>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {item.generated_content}
                          </p>

                        </button>
                      );
                    }
                  )}

                </div>
              )}

            </div>

            {/* =================================================
                AI TIP
            ================================================== */}

            <div className="mt-6 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white shadow-lg">

              <div className="text-3xl">
                💡
              </div>

              <h3 className="mt-4 text-lg font-bold">
                Content tip
              </h3>

              <p className="mt-2 text-sm leading-6 text-violet-100">
                Give the AI specific details about
                your project, achievements or
                audience to get more useful content.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}