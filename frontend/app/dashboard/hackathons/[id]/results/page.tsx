
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getPublishedResults,
  PublishedResults,
  LeaderboardEntry,
} from "@/services/participant";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatScore(score: number) {
  return Number(score).toFixed(2);
}

function getRankLabel(rank: number) {
  if (rank === 1) return "Champion";
  if (rank === 2) return "Runner-up";
  if (rank === 3) return "Third Place";
  return `Rank ${rank}`;
}

function getRankStyle(rank: number) {
  if (rank === 1) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (rank === 2) {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  if (rank === 3) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-slate-200 bg-white text-slate-600";
}

function getRankIcon(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "🏅";
}

export default function HackathonResultsPage() {
  const params = useParams();
  const router = useRouter();

  const hackathonId = params.id as string;

  const [results, setResults] =
    useState<PublishedResults | null>(null);

  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState("");

  async function loadResults() {
    try {
      setLoading(true);
      setError("");
      setHidden(false);

      const data = await getPublishedResults(hackathonId);

      setResults(data);
    } catch (err: any) {
      console.error("Failed to load hackathon results:", err);

      if (err?.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err?.response?.status === 403) {
        setHidden(true);
      } else if (err?.response?.status === 404) {
        setError("The requested hackathon could not be found.");
      } else {
        setError(
          err?.response?.data?.detail ||
            "Unable to load results. Please try again."
        );
      }

      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hackathonId) {
      loadResults();
    }
  }, [hackathonId]);

  // LOADING STATE
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="mt-5 h-10 w-80 max-w-full rounded bg-slate-200" />
          <div className="mt-3 h-5 w-64 rounded bg-slate-200" />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 rounded-3xl bg-white shadow-sm"
              />
            ))}
          </div>

          <div className="mt-10 h-80 rounded-3xl bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  // UNPUBLISHED OR UNAUTHORIZED RESULTS
  if (hidden) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-2xl py-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
              🔒
            </div>

            <span className="mt-6 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              RESULTS STATUS
            </span>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Results are not available yet
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              The organiser may not have published the results yet,
              or your account may not be registered for this hackathon.
              Please check again later or contact the organiser.
            </p>

            <button
              onClick={() =>
                router.push("/dashboard/hackathons")
              }
              className="mt-7 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Back to Hackathons
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ERROR STATE
  if (error || !results) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-2xl py-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
              ⚙️
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Unable to load results
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              {error || "Results are currently unavailable."}
            </p>

            {error.includes("session has expired") ? (
              <button
                onClick={() => router.push("/login")}
                className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Login Again
              </button>
            ) : (
              <button
                onClick={loadResults}
                className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  const topThree = [...(results.top_three || [])]
    .sort((a, b) => a.rank - b.rank);

  const leaderboard = [...(results.leaderboard || [])]
    .sort((a, b) => a.rank - b.rank);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">

          <button
            onClick={() =>
              router.push("/dashboard/hackathons")
            }
            className="mb-7 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
          >
            ← Back to Hackathons
          </button>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                🏆 Official Results
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                {results.hackathon_title}
              </h1>

              <p className="mt-3 text-sm text-slate-500">
                Final rankings and evaluation results.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Published On
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {formatDate(results.announced_at)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">

        {/* SUMMARY */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Ranked Projects
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {leaderboard.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Results Status
            </p>

            <p className="mt-2 flex items-center gap-2 text-xl font-bold text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Published
            </p>
          </div>
        </section>

        {/* TOP THREE */}
        <section>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
              Outstanding Projects
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Top 3 Winners
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The highest-ranked projects in this hackathon.
            </p>
          </div>

          {topThree.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No evaluated projects are available yet.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {topThree.map((entry: LeaderboardEntry) => (
                <article
                  key={entry.project_id}
                  className={`relative overflow-hidden rounded-3xl border p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                    entry.rank === 1
                      ? "border-amber-200 bg-amber-50/60"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {entry.rank === 1 && (
                    <div className="absolute right-0 top-0 rounded-bl-2xl bg-amber-100 px-4 py-2 text-xs font-bold text-amber-800">
                      WINNER
                    </div>
                  )}

                  <div className="text-4xl">
                    {getRankIcon(entry.rank)}
                  </div>

                  <div className="mt-5">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRankStyle(
                        entry.rank
                      )}`}
                    >
                      {getRankLabel(entry.rank)}
                    </span>
                  </div>

                  <h3 className="mt-4 break-words text-xl font-bold text-slate-900">
                    {entry.project_title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Team ID: {entry.team_id.slice(0, 8)}
                  </p>

                  <div className="mt-7 border-t border-slate-200 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Final Score
                    </p>

                    <p className="mt-1 text-4xl font-black text-indigo-600">
                      {formatScore(entry.score)}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Out of 100
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* FULL LEADERBOARD */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-6 md:px-8">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Full Leaderboard
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Complete project rankings based on published evaluation scores.
                </p>
              </div>

              <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {leaderboard.length} Projects
              </span>
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">📋</div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No leaderboard entries
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                No evaluated projects are available for this hackathon.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Project</th>
                      <th className="px-6 py-4">Team ID</th>
                      <th className="px-6 py-4 text-center">
                        Evaluations
                      </th>
                      <th className="px-6 py-4 text-right">
                        Final Score
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((entry) => (
                      <tr
                        key={entry.project_id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex min-w-12 justify-center rounded-xl border px-3 py-2 text-sm font-bold ${getRankStyle(
                              entry.rank
                            )}`}
                          >
                            #{entry.rank}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-900">
                            {entry.project_title}
                          </p>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-500">
                          {entry.team_id.slice(0, 8)}
                        </td>

                        <td className="px-6 py-5 text-center text-sm text-slate-600">
                          {entry.evaluation_count}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <span className="text-lg font-bold text-indigo-600">
                            {formatScore(entry.score)}
                          </span>
                          <span className="ml-1 text-xs text-slate-400">
                            / 100
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE LIST */}
              <div className="divide-y divide-slate-100 md:hidden">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.project_id}
                    className="flex items-center gap-4 p-5"
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${getRankStyle(
                        entry.rank
                      )}`}
                    >
                      #{entry.rank}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold text-slate-900">
                        {entry.project_title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {entry.evaluation_count} evaluation(s)
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-indigo-600">
                        {formatScore(entry.score)}
                      </p>

                      <p className="text-xs text-slate-400">
                        / 100
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* FOOTER */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
          <p className="text-sm text-slate-500">
            Congratulations to all participants and teams.
            Thank you for being part of this hackathon!
          </p>
        </div>

      </div>
    </main>
  );
}
