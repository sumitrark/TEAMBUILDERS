"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Trophy,
  Users,
  Handshake,
  Folder,
  Sparkles,
  Pen,
  HelpCircle,
  Lock,
} from "lucide-react";

import { api } from "@/lib/api";

interface Achievement {
  id: string;
  user_id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
}

const ACHIEVEMENTS = [
  {
    code: "FIRST_HACKATHON",
    title: "First Hackathon",
    description: "Join your first hackathon.",
    icon: Trophy,
  },
  {
    code: "TEAM_BUILDER",
    title: "Team Builder",
    description: "Create your first team.",
    icon: Users,
  },
  {
    code: "COLLABORATOR",
    title: "Collaborator",
    description: "Join a team and start collaborating.",
    icon: Handshake,
  },
  {
    code: "PROJECT_CREATOR",
    title: "Project Creator",
    description: "Create your first project.",
    icon: Folder,
  },
  {
    code: "AI_EXPLORER",
    title: "AI Explorer",
    description: "Use AI Matchmaker.",
    icon: Sparkles,
  },
  {
    code: "CONTENT_CREATOR",
    title: "Content Creator",
    description: "Generate content using AI Content Studio.",
    icon: Pen,
  },
  {
    code: "HELP_SEEKER",
    title: "Help Seeker",
    description: "Use the TEAMBUILDERS Help Center.",
    icon: HelpCircle,
  },
];

export default function AchievementsPage() {
  const [earned, setEarned] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAchievements() {
      try {
        const response = await api.get("/achievements");
        setEarned(response.data);
      } catch (error) {
        console.error(
          "Failed to load achievements:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadAchievements();
  }, []);

  const earnedCodes = new Set(
    earned.map((item) => item.code)
  );

  return (
    <div className="space-y-8">

      {/* Header */}
      <section className="rounded-3xl bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 p-8 text-white shadow-lg">

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
            <Award className="h-9 w-9" />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-200">
              TEAMBUILDERS
            </p>

            <h1 className="mt-1 text-4xl font-bold">
              Achievements
            </h1>

            <p className="mt-2 text-violet-100">
              Track your progress and celebrate your milestones.
            </p>
          </div>
        </div>

      </section>

      {/* Progress */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm font-medium text-gray-500">
              Your Progress
            </p>

            <h2 className="mt-1 text-3xl font-bold">
              {earned.length} / {ACHIEVEMENTS.length}
            </h2>
          </div>

          <Award className="h-10 w-10 text-violet-600" />

        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-violet-600 transition-all"
            style={{
              width: `${
                (earned.length / ACHIEVEMENTS.length) * 100
              }%`,
            }}
          />
        </div>

      </section>

      {/* Achievement Grid */}
      <section>

        <h2 className="mb-5 text-2xl font-bold">
          Your Achievements
        </h2>

        {loading ? (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <p className="text-gray-500">
              Loading achievements...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = earnedCodes.has(
                achievement.code
              );

              const Icon = achievement.icon;

              return (
                <div
                  key={achievement.code}
                  className={`relative rounded-2xl border p-6 shadow-sm transition ${
                    unlocked
                      ? "border-violet-200 bg-white hover:-translate-y-1 hover:shadow-lg"
                      : "bg-gray-50 opacity-75"
                  }`}
                >

                  {/* Status */}
                  <div className="absolute right-5 top-5">
                    {unlocked ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Earned
                      </span>
                    ) : (
                      <Lock className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                      unlocked
                        ? "bg-violet-100 text-violet-600"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>

                  {/* Content */}
                  <h3 className="mt-5 text-xl font-bold">
                    {achievement.title}
                  </h3>

                  <p className="mt-2 text-gray-500">
                    {achievement.description}
                  </p>

                  {unlocked && (
                    <p className="mt-4 text-xs font-medium text-green-600">
                      Earned{" "}
                      {new Date(
                        earned.find(
                          (item) =>
                            item.code ===
                            achievement.code
                        )!.earned_at
                      ).toLocaleDateString()}
                    </p>
                  )}

                </div>
              );
            })}

          </div>
        )}

      </section>

    </div>
  );
}