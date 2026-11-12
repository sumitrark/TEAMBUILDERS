
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  getTeamMatchmakerRecommendations,
  TeamMatchmakerResponse,
  TeamMatchRecommendation,
} from "@/services/team";

export default function TeamMatchmakerPage() {
  const params = useParams();
  const router = useRouter();

  const teamId = String(params.id);

  const [data, setData] =
    useState<TeamMatchmakerResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      try {
        setLoading(true);
        setError("");

        const result =
          await getTeamMatchmakerRecommendations(teamId);

        if (!cancelled) {
          setData(result);
        }
      } catch (err: any) {
        if (cancelled) return;

        const status = err.response?.status;

        if (status === 401) {
          setError("Your session has expired. Please log in again.");
        } else if (status === 403 || status === 404) {
          setError(
            "This feature is available only to the team owner, or the team could not be found."
          );
        } else if (status === 400) {
          setError(
            "This team has no required skills yet. Add required skills before using AI Matchmaker."
          );
        } else {
          setError("Unable to load team recommendations.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (teamId) {
      loadRecommendations();
    }

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-violet-600" />
          <p className="text-gray-500">
            Finding complementary teammates...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <button
          onClick={() => router.back()}
          className="mb-6 text-sm text-gray-500 hover:text-black"
        >
          ← Back to Team
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-700">
            Unable to load AI Matchmaker
          </h2>
          <p className="mt-2 text-sm text-red-600">
            {error || "No recommendation data available."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <button
        onClick={() => router.push(`/dashboard/teams/${teamId}`)}
        className="text-sm text-gray-500 hover:text-black"
      >
        ← Back to Team
      </button>

      <section className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-3xl">
            🧠
          </div>

          <div>
            <p className="text-sm font-medium text-violet-600">
              TEAM AI MATCHMAKER
            </p>
            <h1 className="mt-1 text-3xl font-bold">
              {data.team_name}
            </h1>
            <p className="mt-2 text-gray-600">
              Discover students whose skills complement your team.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <SkillSection
          title="Required Skills"
          description="Skills selected by the team owner."
          skills={data.required_skills}
          emptyMessage="No required skills."
        />

        <SkillSection
          title="Already Covered"
          description="Skills available in the current team."
          skills={data.covered_skills}
          emptyMessage="No required skills covered yet."
        />

        <SkillSection
          title="Missing Skills"
          description="Skills the team should prioritise."
          skills={data.missing_skills}
          emptyMessage="All required skills are covered."
        />
      </section>

      <section className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Recommended Teammates
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Candidates are ranked by how well their skills fill
            your team's missing skill requirements.
          </p>
        </div>

        {data.recommendations.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <div className="text-4xl">🔎</div>
            <h3 className="mt-3 font-semibold">
              No matching candidates found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Try again later when more students have completed
              their skill profiles.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.recommendations.map((candidate) => (
              <CandidateCard
                key={candidate.user_id}
                candidate={candidate}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SkillSection({
  title,
  description,
  skills,
  emptyMessage,
}: {
  title: string;
  description: string;
  skills: string[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="font-bold">{title}</h2>
      <p className="mt-1 text-xs text-gray-500">
        {description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {skills.length === 0 ? (
          <p className="text-sm text-gray-400">
            {emptyMessage}
          </p>
        ) : (
          skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700"
            >
              {skill}
            </span>
          ))
        )}
      </div>
    </section>
  );
}

function CandidateCard({
  candidate,
}: {
  candidate: TeamMatchRecommendation;
}) {
  return (
    <article className="rounded-2xl border p-5 transition hover:border-violet-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-lg font-bold">
            {candidate.full_name ||
              candidate.username ||
              "Student"}
          </h3>

          {candidate.username && candidate.full_name && (
            <p className="text-sm text-gray-500">
              @{candidate.username}
            </p>
          )}

          <p className="mt-2 text-sm text-gray-600">
            {[candidate.college, candidate.course, candidate.year]
              .filter(Boolean)
              .join(" • ") || "Student profile"}
          </p>
        </div>

        <div className="rounded-xl bg-violet-50 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-violet-700">
            {candidate.match_score.toFixed(1)}%
          </p>
          <p className="text-xs text-violet-600">
            Skill match
          </p>
        </div>
      </div>

      {candidate.bio && (
        <p className="mt-4 text-sm text-gray-600">
          {candidate.bio}
        </p>
      )}

      <div className="mt-4">
        <p className="text-sm font-semibold">
          Skills
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {candidate.skills.length === 0 ? (
            <span className="text-sm text-gray-400">
              No skills listed
            </span>
          ) : (
            candidate.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
              >
                {skill}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-green-700">
          Skills that fill your team's gaps
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {candidate.matched_skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
            >
              ✓ {skill}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
