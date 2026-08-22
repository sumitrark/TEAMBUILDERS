"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  UsersRound,
  FolderKanban,
  Gavel,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

import { api } from "@/lib/api";

interface Analytics {
  participants: number;
  teams: number;
  projects: number;
  judges: number;
}

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/organizer/hackathons/${id}/analytics`
      );

      setData(response.data);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);

      setError(
        err?.response?.data?.detail ||
          "Failed to load analytics"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadAnalytics();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="mb-4 h-8 w-48 rounded bg-gray-200" />
            <div className="h-4 w-72 rounded bg-gray-200" />

            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl bg-gray-200"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-700">
              Unable to load analytics
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={loadAnalytics}
              className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const stats = [
    {
      label: "Participants",
      value: data.participants,
      icon: Users,
      description: "Registered participants",
    },
    {
      label: "Teams",
      value: data.teams,
      icon: UsersRound,
      description: "Created teams",
    },
    {
      label: "Projects",
      value: data.projects,
      icon: FolderKanban,
      description: "Submitted projects",
    },
    {
      label: "Judges",
      value: data.judges,
      icon: Gavel,
      description: "Assigned judges",
    },
  ];

  const teamRate =
    data.participants > 0
      ? Math.round(
          (data.teams / data.participants) * 100
        )
      : 0;

  const submissionRate =
    data.teams > 0
      ? Math.round(
          (data.projects / data.teams) * 100
        )
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-3 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Hackathon
            </button>

            <h1 className="text-3xl font-bold text-gray-900">
              Analytics
            </h1>

            <p className="mt-1 text-gray-500">
              Overview of your hackathon activity
            </p>
          </div>

          <button
            onClick={loadAnalytics}
            className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-violet-100 p-3">
                    <Icon className="h-6 w-6 text-violet-600" />
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-medium text-gray-500">
                    {stat.label}
                  </p>

                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {stat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          {/* Team Formation */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Team Formation
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Participants forming teams
            </p>

            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-500">
                  Formation rate
                </span>

                <span className="font-semibold text-gray-900">
                  {teamRate}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-violet-600 transition-all"
                  style={{
                    width: `${Math.min(teamRate, 100)}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex justify-between text-xs text-gray-400">
                <span>
                  {data.teams} teams
                </span>

                <span>
                  {data.participants} participants
                </span>
              </div>
            </div>
          </div>

          {/* Project Submission */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Project Submissions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Teams submitting projects
            </p>

            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-500">
                  Submission rate
                </span>

                <span className="font-semibold text-gray-900">
                  {submissionRate}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{
                    width: `${Math.min(
                      submissionRate,
                      100
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex justify-between text-xs text-gray-400">
                <span>
                  {data.projects} projects
                </span>

                <span>
                  {data.teams} teams
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Hackathon Summary
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Participants
              </p>
              <p className="mt-1 text-xl font-bold">
                {data.participants}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Teams
              </p>
              <p className="mt-1 text-xl font-bold">
                {data.teams}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Projects
              </p>
              <p className="mt-1 text-xl font-bold">
                {data.projects}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Judges
              </p>
              <p className="mt-1 text-xl font-bold">
                {data.judges}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}