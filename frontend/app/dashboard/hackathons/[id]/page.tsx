"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Trophy,
  Users,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { api } from "@/lib/api";
import ProctoringCheckIn from "@/components/dashboard/ProctoringCheckIn";

interface Hackathon {
  id: string;
  title: string;
  description: string;
  organizer: string;
  mode: string;
  location: string;
  team_size: number;
  difficulty: string;
  prize_pool: string;
  registration_deadline: string;
  start_date: string;
  end_date: string;
  banner_image: string;
  website: string;
  status: string;
}

function formatDate(value: string) {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HackathonDetailsPage() {
  const params = useParams();

  const hackathonId = params.id as string;

  const [hackathon, setHackathon] =
    useState<Hackathon | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHackathon() {
      try {
        setLoading(true);
        setError("");

        console.log(
          "Loading hackathon:",
          hackathonId
        );

        const response = await api.get(
          `/hackathons/${hackathonId}`
        );

        console.log(
          "Hackathon response:",
          response.data
        );

        setHackathon(response.data);
      } catch (err: any) {
        console.error(
          "Failed to load hackathon:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Unable to load hackathon details."
        );
      } finally {
        setLoading(false);
      }
    }

    if (hackathonId) {
      loadHackathon();
    }
  }, [hackathonId]);

  /* ----------------------------- */
  /* Loading */
  /* ----------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2
            size={24}
            className="animate-spin"
          />

          <span>
            Loading hackathon details...
          </span>
        </div>
      </div>
    );
  }

  /* ----------------------------- */
  /* Error */
  /* ----------------------------- */

  if (error || !hackathon) {
    return (
      <div className="space-y-6">

        <Link
          href="/dashboard/hackathons"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-violet-600"
        >
          <ArrowLeft size={18} />
          Back to Hackathons
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

          <Trophy
            size={40}
            className="mx-auto text-red-400"
          />

          <h1 className="mt-4 text-2xl font-bold text-red-800">
            Unable to load hackathon
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error ||
              "Hackathon could not be found."}
          </p>

        </div>

      </div>
    );
  }

  /* ----------------------------- */
  /* Details */
  /* ----------------------------- */

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      {/* Back */}
      <Link
        href="/dashboard/hackathons"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-violet-600"
      >
        <ArrowLeft size={18} />
        Back to Hackathons
      </Link>

      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">

        <div className="relative h-72 overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-700 to-slate-950">

          {hackathon.banner_image ? (
            <img
              src={hackathon.banner_image}
              alt={hackathon.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Trophy
                size={80}
                className="text-white/80"
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Status */}
          <div className="absolute left-6 top-6">

            <span className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow">
              {hackathon.status}
            </span>

          </div>

          {/* Hero text */}
          <div className="absolute bottom-6 left-6 right-6 text-white">

            <p className="mb-2 text-sm font-medium text-white/80">
              Organized by {hackathon.organizer}
            </p>

            <h1 className="text-4xl font-bold md:text-5xl">
              {hackathon.title}
            </h1>

          </div>

        </div>

        {/* Quick information */}
        <div className="grid border-t sm:grid-cols-2 lg:grid-cols-4">

          <div className="flex items-center gap-3 border-b p-5 sm:border-r lg:border-b-0">
            <CalendarDays
              size={21}
              className="text-violet-600"
            />

            <div>
              <p className="text-xs text-slate-400">
                Event Dates
              </p>

              <p className="text-sm font-semibold text-slate-700">
                {formatDate(
                  hackathon.start_date
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-b p-5 lg:border-r lg:border-b-0">
            <Users
              size={21}
              className="text-violet-600"
            />

            <div>
              <p className="text-xs text-slate-400">
                Team Size
              </p>

              <p className="text-sm font-semibold text-slate-700">
                Up to {hackathon.team_size} members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-b p-5 sm:border-r lg:border-b-0">
            <Trophy
              size={21}
              className="text-violet-600"
            />

            <div>
              <p className="text-xs text-slate-400">
                Prize Pool
              </p>

              <p className="text-sm font-semibold text-slate-700">
                {hackathon.prize_pool}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-5">
            <MapPin
              size={21}
              className="text-violet-600"
            />

            <div>
              <p className="text-xs text-slate-400">
                Location
              </p>

              <p className="text-sm font-semibold text-slate-700">
                {hackathon.location ||
                  hackathon.mode}
              </p>
            </div>
          </div>

        </div>

      </section>

      {/* Main content */}
      <div className="grid gap-8 lg:grid-cols-3">

        {/* Left */}
        <div className="space-y-8 lg:col-span-2">

          {/* Description */}
          <section className="rounded-2xl border bg-white p-7 shadow-sm">

            <h2 className="text-2xl font-bold text-slate-900">
              About This Hackathon
            </h2>

            <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">
              {hackathon.description}
            </p>

          </section>

          {/* Event information */}
          <section className="rounded-2xl border bg-white p-7 shadow-sm">

            <h2 className="text-2xl font-bold text-slate-900">
              Event Information
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-400">
                  Mode
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {hackathon.mode}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-400">
                  Difficulty
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {hackathon.difficulty}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-400">
                  Start Date
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {formatDate(
                    hackathon.start_date
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-400">
                  End Date
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {formatDate(
                    hackathon.end_date
                  )}
                </p>
              </div>

            </div>

          </section>

          {/* Presence check-in - only meaningful while the
              hackathon is actually running. The backend is the
              real authorization boundary (only an actual registered
              participant can submit a check-in); this date check is
              just to avoid showing an irrelevant widget. */}
          {new Date() >= new Date(hackathon.start_date) &&
            new Date() <= new Date(hackathon.end_date) && (
              <ProctoringCheckIn hackathonId={hackathon.id} />
            )}

        </div>

        {/* Right */}
        <aside className="space-y-6">

          {/* Registration */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-violet-100 p-3">
                <Clock
                  size={22}
                  className="text-violet-600"
                />
              </div>

              <div>
                <p className="text-sm text-slate-400">
                  Registration Deadline
                </p>

                <p className="font-bold text-slate-900">
                  {formatDate(
                    hackathon.registration_deadline
                  )}
                </p>
              </div>

            </div>

            <div className="mt-6">

              <Link
                href={`/dashboard/hackathons/${hackathon.id}/register`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 font-semibold text-white transition hover:bg-violet-700"
              >
                <CheckCircle2 size={19} />
                Register My Team
              </Link>

            </div>

            {hackathon.website && (
              <a
                href={hackathon.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ExternalLink size={18} />
                Official Website
              </a>
            )}

          </section>

          {/* Organizer */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm text-slate-400">
              Organizer
            </p>

            <h3 className="mt-2 text-xl font-bold text-slate-900">
              {hackathon.organizer}
            </h3>

          </section>

        </aside>

      </div>

    </div>
  );
}