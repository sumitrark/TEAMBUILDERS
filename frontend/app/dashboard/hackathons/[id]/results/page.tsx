"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getPublishedResults,
  PublishedResults,
} from "@/services/participant";

export default function HackathonResultsPage() {
  const params = useParams();
  const hackathonId = params.id as string;

  const [results, setResults] =
    useState<PublishedResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true);
        setError("");

        const data = await getPublishedResults(hackathonId);
        setResults(data);
      } catch (err: any) {
        if (err?.response?.status === 403) {
          setHidden(true);
        } else {
          setError(
            err?.response?.data?.detail ||
              "Unable to load results."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    if (hackathonId) {
      loadResults();
    }
  }, [hackathonId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-10 text-center shadow-sm">
          Loading results...
        </div>
      </main>
    );
  }

  if (hidden) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">🔒</div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Results are not published yet
          </h1>

          <p className="mt-3 text-gray-500">
            The organizer has not announced the results.
            Please check again after the official announcement.
          </p>
        </div>
      </main>
    );
  }

  if (error || !results) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center">
          <p className="text-red-600">
            {error || "Results unavailable."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">

        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">
            Official Results
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            {results.title}
          </h1>

          <p className="mt-2 text-gray-500">
            Announced{" "}
            {new Date(
              results.announced_at
            ).toLocaleString()}
          </p>
        </header>

        {/* TOP THREE */}

        <section className="mb-10">
          <h2 className="mb-5 text-2xl font-bold text-gray-900">
            🏆 Top 3
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {results.top_three.map((entry) => (
              <div
                key={entry.project_id}
                className="rounded-3xl border bg-white p-7 text-center shadow-md"
              >
                <div className="text-5xl font-black">
                  #{entry.rank}
                </div>

                <h3 className="mt-4 text-xl font-bold text-gray-900">
                  {entry.project_title}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Team {entry.team_id}
                </p>

                <div className="mt-6 text-4xl font-black text-violet-600">
                  {entry.score.toFixed(2)}
                </div>

                <p className="text-sm text-gray-500">
                  Final Score / 100
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FULL LEADERBOARD */}

        <section className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Full Leaderboard
            </h2>
          </div>

          <div className="divide-y">
            {results.leaderboard.map((entry) => (
              <div
                key={entry.project_id}
                className="flex items-center gap-5 p-5"
              >
                <div className="w-12 text-center text-xl font-black text-gray-400">
                  #{entry.rank}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {entry.project_title}
                  </h3>

                  <p className="text-sm text-gray-500">
                    Team {entry.team_id}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-violet-600">
                    {entry.score.toFixed(2)}
                  </div>

                  <div className="text-xs text-gray-400">
                    {entry.evaluation_count} evaluation
                    {entry.evaluation_count === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}