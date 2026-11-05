"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { Hackathon } from "@/services/hackathon";
import type { Team } from "@/services/team";
import type { TeamMember } from "@/services/teamMember";

interface CurrentUser {
  id: string;
}

interface TeamWithMembers {
  team: Team;
  members: TeamMember[];
}

function apiErrorMessage(error: unknown): string {
  const responseData = (error as {
    response?: { data?: { detail?: unknown } };
  })?.response?.data;
  const detail = responseData?.detail;

  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "message" in detail) {
    return String((detail as { message: unknown }).message);
  }
  return "We couldn't register this team. Please try again.";
}

function formatDate(value?: string | null): string {
  if (!value) return "Not specified";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not specified"
    : date.toLocaleDateString();
}

export default function TeamRegistrationPage() {
  const params = useParams();
  const hackathonId = params.id as string;

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registeredTeamIds, setRegisteredTeamIds] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      try {
        setLoading(true);
        setError("");
        const [hackathonResponse, userResponse, teamsResponse] =
          await Promise.all([
            api.get<Hackathon>(`/hackathons/${hackathonId}`),
            api.get<CurrentUser>("/auth/me"),
            api.get<Team[]>("/teams/my"),
          ]);

        if (!mounted) return;

        const user = userResponse.data;
        setHackathon(hackathonResponse.data);
        setCurrentUser(user);

        // The API intentionally returns owned and joined teams. Registration
        // is restricted in both the UI and backend to the owner.
        const ownedTeams = teamsResponse.data.filter(
          (team) => team.owner_id === user.id,
        );
        const teamData = await Promise.all(
          ownedTeams.map(async (team) => {
            const response = await api.get<TeamMember[]>(
              `/team-members/${team.id}`,
            );
            return { team, members: response.data };
          }),
        );

        if (mounted) setTeams(teamData);
      } catch (loadError) {
        if (mounted) setError(apiErrorMessage(loadError));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (hackathonId) void loadPage();
    return () => { mounted = false; };
  }, [hackathonId]);

  const selected = useMemo(
    () => teams.find(({ team }) => team.id === selectedTeamId) ?? null,
    [teams, selectedTeamId],
  );

  const registrationOpen = Boolean(
    hackathon?.is_active !== false
      && ["open", "registration open"].includes(hackathon?.status?.toLowerCase() ?? ""),
  );
  const deadlinePassed = Boolean(
    hackathon?.registration_deadline
      && new Date(hackathon.registration_deadline).getTime() < Date.now(),
  );
  const selectedMemberCount = selected ? selected.members.length + 1 : 0;
  const teamSizeValid = Boolean(
    selected && selectedMemberCount <= (hackathon?.team_size ?? 0),
  );
  const alreadyRegistered = Boolean(
    selected && registeredTeamIds.includes(selected.team.id),
  );
  const canRegister = Boolean(
    selected && currentUser && selected.team.owner_id === currentUser.id
      && registrationOpen && !deadlinePassed && teamSizeValid
      && !alreadyRegistered && !submitting,
  );

  async function registerSelectedTeam() {
    if (!selected || !canRegister) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await api.post(
        `/teams/${selected.team.id}/register/${hackathonId}`,
      );
      setRegisteredTeamIds((ids) => [...ids, selected.team.id]);
      setSuccess(`${selected.team.name} is registered for ${hackathon?.title}.`);
    } catch (registrationError) {
      setError(apiErrorMessage(registrationError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading hackathon and teams...
      </div>
    );
  }

  if (!hackathon) {
    return (
      <main className="mx-auto max-w-3xl space-y-5 p-6">
        <Link href="/dashboard/hackathons" className="inline-flex items-center gap-2 text-sm text-violet-700">
          <ArrowLeft className="h-4 w-4" /> Back to hackathons
        </Link>
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
          {error || "Hackathon could not be loaded."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href={`/dashboard/hackathons/${hackathonId}`} className="inline-flex items-center gap-2 text-sm text-violet-700 hover:text-violet-900">
        <ArrowLeft className="h-4 w-4" /> Back to hackathon
      </Link>

      <header className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">Team registration</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{hackathon.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Registration deadline: {formatDate(hackathon.registration_deadline)} · Maximum team size: {hackathon.team_size}
        </p>
      </header>

      {!registrationOpen && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          Registration is not open for this hackathon. Check its status and registration dates.
        </p>
      )}
      {deadlinePassed && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          The registration deadline has passed.
        </p>
      )}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
      {success && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">{success}</p>}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Choose a team you own</h2>
        {teams.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-6 text-slate-600">
            You don’t own any teams yet. Create a team or accept an invitation to join one; only team owners can register a team.
            <Link href="/dashboard/teams" className="ml-1 font-semibold text-violet-700">Manage teams</Link>
          </div>
        ) : teams.map(({ team, members }) => {
          const count = members.length + 1;
          const eligibleSize = count <= hackathon.team_size;
          const isSelected = selectedTeamId === team.id;
          const registered = registeredTeamIds.includes(team.id);
          return (
            <label key={team.id} className={`block cursor-pointer rounded-xl border bg-white p-5 shadow-sm ${isSelected ? "border-violet-500 ring-2 ring-violet-100" : "border-slate-200"}`}>
              <span className="flex items-start gap-3">
                <input type="radio" name="team" value={team.id} checked={isSelected} onChange={() => { setSelectedTeamId(team.id); setError(""); setSuccess(""); }} className="mt-1 accent-violet-600" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-semibold text-slate-900"><Users className="h-4 w-4 text-violet-600" />{team.name}</span>
                  <span className="mt-2 block text-sm text-slate-600">{count} / {hackathon.team_size} participants including you (team limit: {team.max_members})</span>
                  <span className="mt-3 block text-sm text-slate-700">Members:</span>
                  <span className="mt-1 block text-sm text-slate-600">Owner (you){members.length ? ` · ${members.length} accepted member${members.length === 1 ? "" : "s"}` : " · no accepted members yet"}</span>
                  {members.length > 0 && <span className="mt-1 block break-all text-xs text-slate-500">Accepted member IDs: {members.map((member) => member.user_id).join(", ")}</span>}
                  {!eligibleSize && <span className="mt-2 block text-sm font-medium text-red-700">This team exceeds the hackathon’s maximum size.</span>}
                  {registered && <span className="mt-2 block text-sm font-medium text-green-700">Registration completed.</span>}
                </span>
              </span>
            </label>
          );
        })}
      </section>

      {selected && !teamSizeValid && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">This team has too many members for {hackathon.title}.</p>
      )}
      <button type="button" onClick={registerSelectedTeam} disabled={!canRegister} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Registering…</> : <><CheckCircle2 className="h-4 w-4" /> Register selected team</>}
      </button>
      <p className="text-sm text-slate-500">This submits a team registration. It will not register you individually.</p>
    </main>
  );
}
