"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  ClipboardCheck,
  Clock,
  Gavel,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { getCurrentUser } from "@/services/auth";
import { getMyJudgeHackathons, MyJudgeHackathon } from "@/services/judge";
import { User } from "@/types/auth";

export default function JudgeDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [hackathons, setHackathons] = useState<MyJudgeHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const [userData, hackathonsData] = await Promise.all([
          getCurrentUser(),
          getMyJudgeHackathons(),
        ]);

        setUser(userData);
        setHackathons(hackathonsData);
      } catch (err) {
        console.error("Failed to load judge dashboard:", err);
        setError("Unable to load your judge dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const totalProjects = hackathons.reduce(
    (sum, h) => sum + h.total_projects,
    0
  );
  const totalEvaluated = hackathons.reduce(
    (sum, h) => sum + h.evaluated_count,
    0
  );
  const totalPending = hackathons.reduce(
    (sum, h) => sum + h.pending_count,
    0
  );

  const pendingHackathons = hackathons.filter((h) => h.pending_count > 0);

  function openWorkspace(hackathonId: string) {
    router.push(`/judge/accept/projects?hackathon=${hackathonId}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your judge dashboard...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">

      {/* WELCOME */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
          <Gavel className="h-7 w-7 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome{user ? `, ${user.full_name}` : ""}
          </h1>
          <p className="text-sm text-slate-500">
            Review and evaluate hackathon projects you've been assigned to.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Active Hackathons",
            value: hackathons.length,
            icon: Trophy,
            color: "text-violet-600 bg-violet-100",
          },
          {
            label: "Total Projects",
            value: totalProjects,
            icon: ClipboardCheck,
            color: "text-blue-600 bg-blue-100",
          },
          {
            label: "Evaluated",
            value: totalEvaluated,
            icon: ClipboardCheck,
            color: "text-emerald-600 bg-emerald-100",
          },
          {
            label: "Pending",
            value: totalPending,
            icon: Clock,
            color: "text-amber-600 bg-amber-100",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {stat.value}
              </p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* ACTIVE HACKATHONS */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          Active Hackathons
        </h2>

        {hackathons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Gavel className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-800">
              No active hackathons yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              When an organizer invites you to judge and you accept, it
              will appear here.
            </p>
            <button
              onClick={() => router.push("/dashboard/invitations")}
              className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              View Invitations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {hackathons.map((h) => {
              const progress =
                h.total_projects > 0
                  ? Math.round(
                      (h.evaluated_count / h.total_projects) * 100
                    )
                  : 0;

              return (
                <div
                  key={h.hackathon_id}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">
                      {h.title}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                      {h.status}
                    </span>
                  </div>

                  {h.description && (
                    <p className="mb-4 line-clamp-2 text-sm text-slate-500">
                      {h.description}
                    </p>
                  )}

                  <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        {h.evaluated_count} / {h.total_projects} evaluated
                      </span>
                      <span className="font-semibold text-slate-700">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-violet-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => openWorkspace(h.hackathon_id)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Open Workspace
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PENDING EVALUATIONS SUMMARY */}
      {pendingHackathons.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            Pending Evaluations
          </h2>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {pendingHackathons.map((h) => (
              <div
                key={h.hackathon_id}
                className="flex items-center justify-between border-b border-slate-100 p-5 last:border-b-0"
              >
                <div>
                  <p className="font-semibold text-slate-900">{h.title}</p>
                  <p className="text-sm text-slate-500">
                    {h.pending_count} project
                    {h.pending_count !== 1 ? "s" : ""} awaiting your review
                  </p>
                </div>
                <button
                  onClick={() => openWorkspace(h.hackathon_id)}
                  className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                >
                  Continue Evaluating
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
