
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

const SKILL_GROUPS: { title: string; skills: string[] }[] = [
  {
    title: "Frontend",
    skills: [
      "HTML", "CSS", "JavaScript", "TypeScript",
      "React", "Next.js", "Angular", "Vue.js",
    ],
  },
  {
    title: "Backend",
    skills: [
      "Python", "FastAPI", "Django", "Node.js",
      "Express.js", "Java", "Spring Boot", "C#",
      ".NET", "PHP",
    ],
  },
  {
    title: "Database",
    skills: [
      "PostgreSQL", "MySQL", "MongoDB", "Redis", "Firebase",
    ],
  },
  {
    title: "AI and Data",
    skills: [
      "Machine Learning", "Deep Learning",
      "Natural Language Processing", "Computer Vision",
      "Data Science", "Data Analysis",
    ],
  },
  {
    title: "Mobile",
    skills: ["Flutter", "React Native", "Kotlin", "Swift"],
  },
  {
    title: "Cloud and DevOps",
    skills: [
      "Docker", "Kubernetes", "AWS", "Azure", "CI/CD", "Linux",
    ],
  },
  {
    title: "Design and Security",
    skills: ["UI/UX Design", "Figma", "Cybersecurity"],
  },
  {
    title: "General Development",
    skills: [
      "Git", "GitHub", "REST API Development", "Software Testing",
    ],
  },
];

interface Team {
  id: string;
  name: string;
  description: string | null;
  max_members: number;
  owner_id: string;
  hackathon_id: string | null;
  required_skills: string[];
  created_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

interface HackathonOption {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
}

interface ScheduleMember {
  user_id: string;
  full_name: string;
  username: string;
  role: string;
}

interface ScheduleConflictDetail {
  existing_hackathon_id?: string;
  existing_hackathon_title?: string;
  existing_start_date?: string | null;
  existing_end_date?: string | null;
  participation_type?: string;
  existing_team_name?: string | null;
  reason?: string;
}

interface ScheduleMemberConflict {
  user_id: string;
  full_name: string;
  username: string;
  role: string;
  conflict: {
    reason?: string;
    existing_hackathon_title?: string;
    all_conflicts?: ScheduleConflictDetail[];
  };
}

interface ScheduleReport {
  team_id: string;
  team_name: string;
  hackathon_id: string;
  hackathon_title: string;
  start_date: string;
  end_date: string;
  can_participate: boolean;
  total_members: number;
  available_count: number;
  conflict_count: number;
  available_members: ScheduleMember[];
  conflicts: ScheduleMemberConflict[];
}

function formatDate(value?: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const teamId = String(params.id);

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Required skills editor
  const [editingSkills, setEditingSkills] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);
  const [skillError, setSkillError] = useState("");
  const [skillSuccess, setSkillSuccess] = useState("");

  // Schedule check
  const [hackathons, setHackathons] = useState<HackathonOption[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState("");
  const [scheduleReport, setScheduleReport] =
    useState<ScheduleReport | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [hackathonsLoading, setHackathonsLoading] = useState(false);
  const [showScheduleCheck, setShowScheduleCheck] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTeam() {
      try {
        setLoading(true);
        setError("");

        const teamResponse = await api.get(`/teams/${teamId}`);

        if (cancelled) return;

        const foundTeam: Team = teamResponse.data;

        setTeam(foundTeam);
        setSelectedSkills(foundTeam.required_skills || []);

        const membersResponse = await api.get(
          `/team-members/${teamId}`
        );

        if (cancelled) return;

        setMembers(membersResponse.data);
      } catch (err: any) {
        console.error("Failed to load team:", err);

        if (cancelled) return;

        if (err.response?.status === 401) {
          setError("Your session has expired. Please log in again.");
        } else if (err.response?.status === 403) {
          setError(
            "You must be the team owner or an accepted member to view this team."
          );
        } else if (err.response?.status === 404) {
          setError("Team not found.");
        } else {
          setError("Failed to load team details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (teamId) {
      loadTeam();
    }

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  // ---------------------------------------------------------
  // Required Skills
  // ---------------------------------------------------------

  const openSkillEditor = () => {
    if (!team) return;

    setSelectedSkills(team.required_skills || []);
    setSkillError("");
    setSkillSuccess("");
    setEditingSkills(true);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((previous) =>
      previous.includes(skill)
        ? previous.filter((item) => item !== skill)
        : [...previous, skill]
    );
  };

  const saveRequiredSkills = async () => {
    if (!team) return;

    try {
      setSavingSkills(true);
      setSkillError("");
      setSkillSuccess("");

      await api.put(`/teams/${team.id}`, {
        name: team.name,
        description: team.description,
        max_members: team.max_members,
        hackathon_id: team.hackathon_id,
        required_skills: selectedSkills,
      });

      setTeam((previous) =>
        previous
          ? { ...previous, required_skills: selectedSkills }
          : previous
      );

      setEditingSkills(false);
      setSkillSuccess("Required team skills saved successfully.");
    } catch (err: any) {
      console.error("Failed to save required skills:", err);

      if (err.response?.status === 401) {
        setSkillError("Your session has expired. Please log in again.");
      } else if (
        err.response?.status === 403 ||
        err.response?.status === 404
      ) {
        setSkillError(
          "Only the team owner can update required skills."
        );
      } else if (err.response?.status === 422) {
        setSkillError(
          err.response?.data?.detail?.[0]?.msg ||
          "Some selected skills are invalid. Please select skills from the approved catalogue."
        );
      } else {
        setSkillError(
          err.response?.data?.detail ||
          "Unable to save required skills. Please try again."
        );
      }
    } finally {
      setSavingSkills(false);
    }
  };

  // ---------------------------------------------------------
  // Schedule Check
  // ---------------------------------------------------------

  const openScheduleCheck = async () => {
    setShowScheduleCheck(true);
    setScheduleError("");
    setScheduleReport(null);
    setSelectedHackathon("");
    setHackathons([]);
    setHackathonsLoading(true);

    try {
      const response = await api.get("/hackathons/");

      setHackathons(response.data);
    } catch (err: any) {
      console.error("Failed to load hackathons:", err);

      setScheduleError(
        err.response?.data?.detail ||
        "Unable to load hackathons. Please try again."
      );
    } finally {
      setHackathonsLoading(false);
    }
  };

  const runScheduleCheck = async () => {
    if (!team || !selectedHackathon) {
      setScheduleError("Please select a hackathon.");
      return;
    }

    try {
      setScheduleLoading(true);
      setScheduleError("");
      setScheduleReport(null);

      const response = await api.get(
        `/teams/${team.id}/schedule-check/${selectedHackathon}`
      );

      setScheduleReport(response.data);
    } catch (err: any) {
      console.error("Schedule check failed:", err);

      setScheduleError(
        err.response?.data?.detail ||
        "Unable to check the team schedule. Please try again."
      );
    } finally {
      setScheduleLoading(false);
    }
  };

  const closeScheduleCheck = () => {
    setShowScheduleCheck(false);
    setScheduleReport(null);
    setScheduleError("");
    setSelectedHackathon("");
  };

  // ---------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------

  const openInvitePage = () => {
    if (!team) return;
    router.push(`/dashboard/teams/${team.id}/invite`);
  };

  const openChatPage = () => {
    if (!team) return;
    router.push(`/dashboard/teams/${team.id}/chat`);
  };

  const openMatchmakerPage = () => {
    if (!team) return;
    router.push(`/dashboard/teams/${team.id}/matchmaker`);
  };

  // ---------------------------------------------------------
  // Loading and Error States
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-violet-600" />
          <p className="text-gray-500">Loading team...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="mb-6 text-sm text-gray-500 hover:text-black"
        >
          ← Back
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-700">
            Unable to load team
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error || "Team not found"}
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Team Information
  // ---------------------------------------------------------

  const memberCount = members.length + 1;
  const maxMembers = team.max_members;

  const availableSlots = Math.max(
    maxMembers - memberCount,
    0
  );

  const canInvite = availableSlots > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 transition hover:text-black"
      >
        ← Back to My Teams
      </button>

      {/* Team Header */}
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white">
              Team
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              {team.name}
            </h1>

            <p className="mt-3 max-w-2xl text-gray-600">
              {team.description || "No team description provided."}
            </p>
          </div>

          {canInvite && (
            <button
              type="button"
              onClick={openInvitePage}
              className="shrink-0 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              + Invite Member
            </button>
          )}
        </div>

        {/* Team Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">Members</p>
            <p className="mt-1 text-2xl font-bold">
              {memberCount}
              <span className="text-base font-normal text-gray-400">
                {" "}/ {maxMembers}
              </span>
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">Available Slots</p>
            <p className="mt-1 text-2xl font-bold">
              {availableSlots}
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Hackathon Registration
            </p>
            <p className="mt-1 text-lg font-bold">
              {team.hackathon_id ? "Assigned" : "Not registered"}
            </p>
          </div>
        </div>
      </div>

      {/* Required Skills */}
      <section className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">
              Required Team Skills
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Skills your team is looking for.
            </p>
          </div>

          <button
            type="button"
            onClick={openSkillEditor}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            ✏️ Edit Required Skills
          </button>
        </div>

        {skillSuccess && (
          <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
            {skillSuccess}
          </p>
        )}

        {skillError && !editingSkills && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {skillError}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {team.required_skills?.length ? (
            team.required_skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700"
              >
                {skill}
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-400">
              No required skills have been selected yet.
            </p>
          )}
        </div>
      </section>

      {/* Required Skills Editor */}
      {editingSkills && (
        <div className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold">
                Select Required Team Skills
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Select the skills your team needs from the approved catalogue.
              </p>
            </div>

            <span className="w-fit rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">
              {selectedSkills.length} selected
            </span>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            You can select multiple skills. These skills will be used by AI Matchmaker to find students with complementary abilities.
          </p>

          <div className="mt-6 space-y-6">
            {SKILL_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="mb-3 font-semibold text-gray-800">
                  {group.title}
                </h3>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.skills.map((skill) => {
                    const checked = selectedSkills.includes(skill);

                    return (
                      <label
                        key={skill}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                          checked
                            ? "border-violet-400 bg-violet-50"
                            : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSkill(skill)}
                          className="h-4 w-4 accent-violet-600"
                        />

                        <span className="text-sm font-medium text-gray-700">
                          {skill}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {skillError && (
            <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {skillError}
            </p>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={savingSkills}
              onClick={() => {
                setEditingSkills(false);
                setSkillError("");
                setSelectedSkills(team.required_skills || []);
              }}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={savingSkills}
              onClick={saveRequiredSkills}
              className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingSkills ? "Saving..." : "Save Required Skills"}
            </button>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">Team Members</h2>
            <p className="mt-1 text-sm text-gray-500">
              Owner and accepted members of this team.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
              {memberCount}/{maxMembers}
            </span>

            {canInvite && (
              <button
                type="button"
                onClick={openInvitePage}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Invite
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {/* Owner */}
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 font-bold">
                👑
              </div>

              <div>
                <p className="font-semibold">Team Owner</p>
                <p className="text-sm text-gray-500">
                  User ID: {team.owner_id}
                </p>
              </div>
            </div>

            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium">
              Owner
            </span>
          </div>

          {/* Accepted Members */}
          {members.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <div className="text-3xl">👥</div>

              <h3 className="mt-3 font-semibold">
                No accepted members yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Invite teammates to start building your team.
              </p>

              {canInvite && (
                <button
                  type="button"
                  onClick={openInvitePage}
                  className="mt-4 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  + Invite Teammate
                </button>
              )}
            </div>
          ) : (
            members.map((member, index) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-2xl border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 font-bold">
                    👤
                  </div>

                  <div>
                    <p className="font-semibold">
                      Member {index + 1}
                    </p>

                    <p className="text-sm text-gray-500">
                      User ID: {member.user_id}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize">
                  {member.role || "member"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Team Workspace */}
      <section className="overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-sm">
        <div className="border-b border-violet-100 bg-violet-50/50 p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Team Workspace
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Your team's collaboration and communication space.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          {/* Team Chat */}
          <button
            type="button"
            onClick={openChatPage}
            className="group flex items-center gap-5 rounded-2xl border-2 border-violet-200 bg-violet-50 p-6 text-left transition hover:border-violet-500 hover:bg-violet-100"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-3xl text-white shadow-sm">
              💬
            </div>

            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900">
                Team Chat
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                Communicate and share updates with your teammates.
              </p>

              <span className="mt-3 inline-block font-semibold text-violet-700 group-hover:underline">
                Open Team Chat →
              </span>
            </div>
          </button>

          {/* Team Members Summary */}
          <div className="flex items-center gap-5 rounded-2xl border p-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
              👥
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Team Members
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                {memberCount} people in this team.
              </p>

              <span className="mt-3 inline-block text-sm font-semibold text-blue-700">
                {memberCount} Active Members
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Other Team Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Invite */}
        <button
          type="button"
          disabled={!canInvite}
          onClick={openInvitePage}
          className="rounded-2xl border bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="text-2xl">🤝</div>

          <h3 className="mt-3 font-semibold">
            Invite Teammates
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Find students and invite them to your team.
          </p>

          <span className="mt-4 inline-block text-sm font-semibold text-violet-600">
            {canInvite ? "Invite →" : "Team Full"}
          </span>
        </button>

        {/* AI Matchmaker */}
        <button
          type="button"
          onClick={openMatchmakerPage}
          className="rounded-2xl border bg-white p-6 text-left transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-md"
        >
          <div className="text-2xl">🧠</div>

          <h3 className="mt-3 font-semibold">
            AI Matchmaker
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Find students whose skills complement your team's missing skills.
          </p>

          <span className="mt-4 inline-block text-sm font-semibold text-violet-600">
            Find Teammates →
          </span>
        </button>

        {/* Schedule Check */}
        <button
          type="button"
          onClick={openScheduleCheck}
          className="rounded-2xl border bg-white p-6 text-left transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-md"
        >
          <div className="text-2xl">📅</div>

          <h3 className="mt-3 font-semibold">
            Schedule Check
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Check member availability and detect overlapping hackathons.
          </p>

          <span className="mt-4 inline-block text-sm font-semibold text-violet-600">
            Check Schedule →
          </span>
        </button>
      </div>

      {/* Schedule Check Panel */}
      {showScheduleCheck && (
        <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold">
                Team Schedule Check
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Check the availability of the team owner and accepted members.
              </p>
            </div>

            <button
              type="button"
              onClick={closeScheduleCheck}
              className="w-fit rounded-lg border px-4 py-2 text-sm transition hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          {/* Hackathon Selection */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedHackathon}
              onChange={(event) => {
                setSelectedHackathon(event.target.value);
                setScheduleReport(null);
                setScheduleError("");
              }}
              disabled={hackathonsLoading || scheduleLoading}
              className="min-w-0 flex-1 rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-gray-100"
            >
              <option value="">
                {hackathonsLoading
                  ? "Loading hackathons..."
                  : "Select a hackathon"}
              </option>

              {hackathons.map((hackathon) => (
                <option
                  key={hackathon.id}
                  value={hackathon.id}
                >
                  {hackathon.title} (
                  {formatDate(hackathon.start_date)}
                  {" - "}
                  {formatDate(hackathon.end_date)}
                  )
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={runScheduleCheck}
              disabled={
                !selectedHackathon ||
                scheduleLoading ||
                hackathonsLoading
              }
              className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {scheduleLoading ? "Checking..." : "Check Schedule"}
            </button>
          </div>

          {!hackathonsLoading && hackathons.length === 0 && !scheduleError && (
            <p className="mt-4 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
              No hackathons are currently available.
            </p>
          )}

          {scheduleError && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {scheduleError}
            </p>
          )}

          {/* Schedule Report */}
          {scheduleReport && (
            <div className="mt-6 space-y-6">
              {/* Summary */}
              <div
                className={`rounded-2xl border p-5 ${
                  scheduleReport.can_participate
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="text-lg font-bold">
                      {scheduleReport.can_participate
                        ? "Team is available"
                        : "Schedule conflicts detected"}
                    </h3>

                    <p className="mt-1 text-sm text-gray-600">
                      {scheduleReport.can_participate
                        ? "All checked members are available for this hackathon."
                        : "Some team members have conflicting participation."}
                    </p>

                    <p className="mt-3 text-sm font-medium text-gray-700">
                      {scheduleReport.hackathon_title}
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      {formatDate(scheduleReport.start_date)}
                      {" - "}
                      {formatDate(scheduleReport.end_date)}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      scheduleReport.can_participate
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {scheduleReport.can_participate
                      ? "Available"
                      : "Conflicts found"}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="text-2xl font-bold">
                      {scheduleReport.total_members}
                    </p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>

                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="text-2xl font-bold text-green-700">
                      {scheduleReport.available_count}
                    </p>
                    <p className="text-xs text-gray-600">Available</p>
                  </div>

                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="text-2xl font-bold text-red-700">
                      {scheduleReport.conflict_count}
                    </p>
                    <p className="text-xs text-gray-600">Conflicts</p>
                  </div>
                </div>
              </div>

              {/* Available Members */}
              {scheduleReport.available_members?.length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold text-green-700">
                    Available Members
                  </h3>

                  <div className="space-y-2">
                    {scheduleReport.available_members.map((member) => (
                      <div
                        key={member.user_id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                      >
                        <div>
                          <p className="font-medium">
                            {member.full_name}
                          </p>

                          <p className="text-xs text-gray-500">
                            @{member.username} · {member.role}
                          </p>
                        </div>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Available
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conflicting Members */}
              {scheduleReport.conflicts?.length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold text-red-700">
                    Members with Schedule Conflicts
                  </h3>

                  <div className="space-y-3">
                    {scheduleReport.conflicts.map((item) => {
                      const details =
                        item.conflict.all_conflicts || [];

                      return (
                        <div
                          key={item.user_id}
                          className="rounded-xl border border-red-200 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold">
                                {item.full_name}
                              </p>

                              <p className="text-xs text-gray-500">
                                @{item.username} · {item.role}
                              </p>
                            </div>

                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                              Conflict
                            </span>
                          </div>

                          {details.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              {details.map((conflict, index) => (
                                <div
                                  key={
                                    conflict.existing_hackathon_id ||
                                    `${item.user_id}-${index}`
                                  }
                                  className="rounded-lg bg-red-50 p-3"
                                >
                                  <p className="text-sm font-medium text-red-800">
                                    {conflict.existing_hackathon_title ||
                                      conflict.reason ||
                                      "Existing participation"}
                                  </p>

                                  {(conflict.existing_start_date ||
                                    conflict.existing_end_date) && (
                                    <p className="mt-1 text-xs text-red-700">
                                      {formatDate(
                                        conflict.existing_start_date
                                      )}
                                      {" - "}
                                      {formatDate(
                                        conflict.existing_end_date
                                      )}
                                    </p>
                                  )}

                                  {conflict.participation_type && (
                                    <p className="mt-1 text-xs text-red-700">
                                      Participation:{" "}
                                      {conflict.participation_type}
                                    </p>
                                  )}

                                  {conflict.existing_team_name && (
                                    <p className="mt-1 text-xs text-red-700">
                                      Team: {conflict.existing_team_name}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                              {item.conflict.reason ||
                                item.conflict.existing_hackathon_title ||
                                "This member has a schedule conflict."}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {scheduleReport.conflict_count === 0 && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  No schedule conflicts were found for this team.
                </div>
              )}

              <p className="text-xs text-gray-500">
                This report is a schedule preview. The backend performs its
                own validation when the team is registered.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
