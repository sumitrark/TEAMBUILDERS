
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trophy,
  UserRound,
} from "lucide-react";

import { api } from "@/lib/api";

interface Team {
  id: string;
  name: string;
  description: string | null;
  max_members: number;
  owner_id: string;
  hackathon_id: string | null;
}

interface Hackathon {
  id: string;
  title: string;
  participation_mode?: "individual" | "team" | "both";
  team_size: number;
}

export default function RegisterTeamPage() {
  const params = useParams();
  const router = useRouter();

  const hackathonId = params.id as string;

  const [teams, setTeams] = useState<Team[]>([]);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        const redirect = `/dashboard/hackathons/${hackathonId}/register`;
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      const [teamsResponse, hackathonResponse] = await Promise.all([
        api.get("/teams/my"),
        api.get(`/hackathons/${hackathonId}`),
      ]);

      setTeams(teamsResponse.data);
      setHackathon(hackathonResponse.data);
    } catch (err: any) {
      console.error("Failed to load team registration data:", err);

      if (err?.response?.status === 401) {
        const redirect = `/dashboard/hackathons/${hackathonId}/register`;
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      setError(
        err?.response?.data?.detail ||
          "Unable to load your teams. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [hackathonId, router]);

  useEffect(() => {
    if (hackathonId) {
      loadData();
    }
  }, [hackathonId, loadData]);

  const handleRegister = async () => {
    if (!selectedTeam) {
      setError("Please select a team first.");
      return;
    }

    try {
      setRegistering(true);
      setError("");
      setSuccess("");

      await api.post(
        `/teams/${selectedTeam}/register/${hackathonId}`
      );

      setSuccess("Your team has been successfully registered!");

      // Refresh the team list so the newly assigned team is reflected.
      const response = await api.get("/teams/my");
      setTeams(response.data);
    } catch (err: any) {
      console.error("Team registration failed:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to register your team. Please try again."
      );
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center gap-3 text-slate-500">
        <Loader2 className="animate-spin" size={24} />
        Loading your teams...
      </div>
    );
  }

  if (error && !hackathon && teams.length === 0) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <Link
          href={`/dashboard/hackathons/${hackathonId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-violet-600"
        >
          <ArrowLeft size={18} />
          Back to Hackathon
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  const teamParticipationAllowed =
    hackathon?.participation_mode === "team" ||
    hackathon?.participation_mode === "both" ||
    !hackathon?.participation_mode;

  const availableTeams = teams.filter(
    (team) =>
      !team.hackathon_id || team.hackathon_id === hackathonId
  );

  return (
    <main className="mx-auto max-w-4xl space-y-7 p-6">
      <Link
        href={`/dashboard/hackathons/${hackathonId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-violet-600"
      >
        <ArrowLeft size={18} />
        Back to Hackathon
      </Link>

      <section className="rounded-3xl bg-gradient-to-br from-violet-700 via-indigo-700 to-slate-950 p-8 text-white">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
          <Users size={28} />
        </div>

        <p className="text-sm font-semibold text-violet-200">
          TEAM REGISTRATION
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Register Your Team
        </h1>

        <p className="mt-3 text-sm leading-6 text-white/80">
          Select one of your existing teams to participate in{" "}
          <strong>{hackathon?.title || "this hackathon"}</strong>.
        </p>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          {success}
        </div>
      )}

      {!teamParticipationAllowed ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          This hackathon does not allow team participation.
        </section>
      ) : availableTeams.length === 0 ? (
        <section className="rounded-2xl border bg-white p-10 text-center shadow-sm">
          <Users size={45} className="mx-auto text-slate-300" />

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            No available teams
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            You haven't created a team yet, or all your teams are
            assigned to other hackathons.
          </p>

          <Link
            href="/dashboard/teams"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700"
          >
            Create a Team
          </Link>
        </section>
      ) : (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Choose Your Team
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select the team you want to register.
              </p>
            </div>

            {availableTeams.map((team) => {
              const selected = selectedTeam === team.id;
              const assignedHere = team.hackathon_id === hackathonId;

              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    setSelectedTeam(team.id);
                    setError("");
                  }}
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    selected
                      ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                      : "border-slate-200 bg-white hover:border-violet-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                        <Users size={23} />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900">
                          {team.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Maximum {team.max_members} members
                        </p>

                        {team.description && (
                          <p className="mt-1 text-sm text-slate-500">
                            {team.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {selected && (
                      <CheckCircle2
                        size={24}
                        className="shrink-0 text-violet-600"
                      />
                    )}
                  </div>

                  {assignedHere && (
                    <p className="mt-3 text-xs font-semibold text-emerald-700">
                      Already assigned to this hackathon
                    </p>
                  )}
                </button>
              );
            })}
          </section>

          <button
            type="button"
            onClick={handleRegister}
            disabled={!selectedTeam || registering}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-4 font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {registering ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Registering Team...
              </>
            ) : (
              <>
                <Trophy size={19} />
                Register Selected Team
              </>
            )}
          </button>
        </>
      )}

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <UserRound size={17} />
        Only the team owner can register a team for a hackathon.
      </div>
    </main>
  );
}

