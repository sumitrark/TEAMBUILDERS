"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";

import { getMyEvaluations, Evaluation } from "@/services/judge";

export default function JudgeEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        setEvaluations(await getMyEvaluations());
      } catch (err) {
        console.error("Failed to load evaluations:", err);
        setError("Unable to load your evaluations. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          My Evaluations
        </h1>
        <p className="text-sm text-slate-500">
          Every evaluation you've submitted.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 py-12 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading...
        </div>
      ) : evaluations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <ClipboardCheck className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-800">
            No evaluations yet
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Evaluations you submit will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {evaluations.map((ev) => (
            <div
              key={ev.id}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Overall Score: {ev.overall_score}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(ev.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-4">
                <div>Innovation: {ev.innovation_score}</div>
                <div>Technical: {ev.technical_score}</div>
                <div>Impact: {ev.impact_score}</div>
                <div>Presentation: {ev.presentation_score}</div>
              </div>

              {ev.feedback && (
                <p className="mt-3 text-sm text-slate-500">
                  {ev.feedback}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
