"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Trophy,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
} from "lucide-react";

import { api } from "@/lib/api";
import { getMyTeams } from "@/services/team";

interface Hackathon {
  id: string;
  title: string;
  organizer: string;
  team_size: number;
  registration_deadline: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  max_members: number;
  owner_id: string;
  hackathon_id?: string | null;
  created_at: string;
}

function formatDate(date: string) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TeamRegistrationPage() {
  const params = useParams();
  const router = useRouter();

  const hackathonId = params.id as string;

  const [hackathon, setHackathon] =
    useState<Hackathon | null>(null);

  const [teams, setTeams] = useState<Team[]>([]);

  const [selectedTeam, setSelectedTeam] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* -------------------------------- */
  /* Load hackathon + teams           */
  /* -------------------------------- */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [hackathonResponse, teamsResponse] =
          await Promise.all([
            api.get(`/hackathons/${hackathonId}`),
            getMyTeams(),
          ]);

        setHackathon(hackathonResponse.data);

        setTeams(
          Array.isArray(teamsResponse)
            ? teamsResponse
            : []
        );

      } catch (err: any) {
        console.error(
          "Failed to load registration data:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Unable to load registration information."
        );
      } finally {
        setLoading(false);
      }
    }

    if (hackathonId) {
      loadData();
    }
  }, [hackathonId]);

  /* -------------------------------- */
  /* Register selected team           */
  /* -------------------------------- */

  async function handleRegister() {
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

      setSuccess(
        "Your team has been successfully registered!"
      );

      setTeams((current) =>
        current.map((team) =>
          team.id === selectedTeam
            ? {
                ...team,
                hackathon_id: hackathonId,
              }
            : team
        )
      );

    } catch (err: any) {
      console.error(
        "Team registration failed:",
        err
      );

      const detail =
        err?.response?.data?.detail;

      setError(
        detail ||
          "Unable to register your team."
      );
    } finally {
      setRegistering(false);
    }
  }

  /* -------------------------------- */
  /* Loading state                    */
  /* -------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2
            size={24}
            className="animate-spin"
          />

          Loading registration...
        </div>
      </div>
    );
  }

  /* -------------------------------- */
  /* Error / not found                */
  /* -------------------------------- */

  if (!hackathon) {
    return (
      <div className="space-y-6">

        <Link
          href="/dashboard/hackathons"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-violet-600"
        >
          <ArrowLeft size={18} />
          Back to Hackathons
        </Link>

        <div className="rounded-2xl border bg-white p-10 text-center">

          <Trophy
            size={45}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-4 text-xl font-bold">
            Hackathon not found
          </h2>

        </div>

      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">

      {/* Back */}
      <Link
        href={`/dashboard/hackathons/${hackathonId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-violet-600"
      >
        <ArrowLeft size={18} />
        Back to Hackathon
      </Link>

      {/* Header */}
      <div>

        <p className="font-semibold text-violet-600">
          Team Registration
        </p>

        <h1 className="mt-1 text-4xl font-bold text-slate-900">
          Register Your Team
        </h1>

        <p className="mt-2 text-slate-500">
          Select the team you want to register for this
          hackathon.
        </p>

      </div>

      {/* Hackathon summary */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-700 to-indigo-700 p-7 text-white shadow-lg">

        <div className="flex items-start gap-4">

          <div className="rounded-xl bg-white/15 p-3">
            <Trophy size={28} />
          </div>

          <div>

            <h2 className="text-2xl font-bold">
              {hackathon.title}
            </h2>

            <p className="mt-1 text-white/80">
              Organized by {hackathon.organizer}
            </p>

            <div className="mt-4 flex flex-wrap gap-5 text-sm text-white/90">

              <span className="flex items-center gap-2">
                <Users size={16} />
                Up to {hackathon.team_size} members
              </span>

              <span className="flex items-center gap-2">
                <CalendarDays size={16} />
                {formatDate(hackathon.start_date)}
                {" - "}
                {formatDate(hackathon.end_date)}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">

          <AlertCircle size={20} />

          <p>{error}</p>

        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">

          <CheckCircle2 size={22} />

          <div>

            <p className="font-semibold">
              Registration successful!
            </p>

            <p className="mt-1 text-sm">
              Your team is now registered for this
              hackathon.
            </p>

          </div>

        </div>
      )}

      {/* Team Selection */}
      <section>

        <div className="mb-5">

          <h2 className="text-2xl font-bold text-slate-900">
            Select Your Team
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Choose one of your teams to participate.
          </p>

        </div>

        {teams.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center">

            <Users
              size={45}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-4 text-lg font-bold">
              You don't have any teams yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create a team before registering for
              this hackathon.
            </p>

            <Link
              href="/dashboard/teams"
              className="mt-5 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700"
            >
              Create a Team
            </Link>

          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">

            {teams.map((team) => {

              const selected =
                selectedTeam === team.id;

              const alreadyRegistered =
                team.hackathon_id === hackathonId;

              return (
                <button
                  key={team.id}
                  type="button"
                  disabled={alreadyRegistered}
                  onClick={() =>
                    setSelectedTeam(team.id)
                  }
                  className={`rounded-2xl border-2 bg-white p-6 text-left transition ${
                    selected
                      ? "border-violet-600 bg-violet-50 shadow-lg"
                      : "border-slate-200 hover:border-violet-300 hover:shadow-md"
                  } ${
                    alreadyRegistered
                      ? "cursor-not-allowed opacity-60"
                      : ""
                  }`}
                >

                  <div className="flex items-start justify-between">

                    <div className="flex items-center gap-4">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-lg font-bold text-violet-700">
                        {team.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>

                        <h3 className="text-lg font-bold text-slate-900">
                          {team.name}
                        </h3>

                        <p className="text-sm text-slate-500">
                          Maximum {team.max_members} members
                        </p>

                      </div>

                    </div>

                    {selected && (
                      <CheckCircle2
                        size={24}
                        className="text-violet-600"
                      />
                    )}

                  </div>

                  {team.description && (
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      {team.description}
                    </p>
                  )}

                  {alreadyRegistered && (
                    <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                      Already registered for this hackathon
                    </div>
                  )}

                </button>
              );
            })}

          </div>
        )}

      </section>

      {/* Register action */}
      {teams.length > 0 && (
        <div className="sticky bottom-4 rounded-2xl border bg-white/95 p-5 shadow-xl backdrop-blur">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="font-semibold text-slate-900">
                {selectedTeam
                  ? "Team selected"
                  : "Select a team to continue"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Your team will be registered for{" "}
                {hackathon.title}.
              </p>

            </div>

            <button
              type="button"
              disabled={
                !selectedTeam ||
                registering ||
                Boolean(success)
              }
              onClick={handleRegister}
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-7 py-3.5 font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {registering && (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )}

              {registering
                ? "Registering..."
                : success
                  ? "Registered"
                  : "Register My Team"}

            </button>

          </div>

        </div>
      )}

    </div>
  );
}