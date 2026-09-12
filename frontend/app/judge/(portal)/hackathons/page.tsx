"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ArrowRight, Loader2, Gavel } from "lucide-react";

import { getMyJudgeHackathons, MyJudgeHackathon } from "@/services/judge";

export default function JudgeHackathonsPage() {
  const router = useRouter();

  const [hackathons, setHackathons] = useState<MyJudgeHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        setHackathons(await getMyJudgeHackathons());
      } catch (err) {
        console.error("Failed to load hackathons:", err);
        setError("Unable to load your hackathons. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Your Hackathons
        </h1>
        <p className="text-sm text-slate-500">
          Hackathons where you're an active judge.
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
      ) : hackathons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Gavel className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-800">
            No hackathons yet
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Accepted judge invitations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {hackathons.map((h) => (
            <div
              key={h.hackathon_id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                  <Trophy className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{h.title}</p>
                  <p className="text-sm text-slate-500">
                    {h.total_projects} project
                    {h.total_projects !== 1 ? "s" : ""} ·{" "}
                    {h.evaluated_count} evaluated
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  router.push(
                    `/judge/accept/projects?hackathon=${h.hackathon_id}`
                  )
                }
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Open
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
