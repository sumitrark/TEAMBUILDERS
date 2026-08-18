"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Users,
  Trophy,
  Search,
  Clock,
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

import { getHackathons, Hackathon } from "@/services/hackathon";

type FilterType = "all" | "upcoming" | "ongoing" | "completed";

function getHackathonStatus(hackathon: Hackathon): FilterType {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(hackathon.start_date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(hackathon.end_date);
  end.setHours(0, 0, 0, 0);

  if (today < start) {
    return "upcoming";
  }

  if (today >= start && today <= end) {
    return "ongoing";
  }

  return "completed";
}

function formatDate(value: string) {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(value);
  target.setHours(0, 0, 0, 0);

  const difference =
    target.getTime() - today.getTime();

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );
}

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<FilterType>("all");

  useEffect(() => {
    async function loadHackathons() {
      try {
        setLoading(true);
        setError("");

        const data = await getHackathons();

        setHackathons(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        console.error(
          "Failed to load hackathons:",
          err
        );

        setError(
          "Unable to load hackathons. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadHackathons();
  }, []);

  const filteredHackathons = useMemo(() => {
    const query = search.trim().toLowerCase();

    return hackathons.filter((hackathon) => {
      const status =
        getHackathonStatus(hackathon);

      const matchesFilter =
        filter === "all" ||
        status === filter;

      const matchesSearch =
        !query ||
        hackathon.title
          ?.toLowerCase()
          .includes(query) ||
        hackathon.organizer
          ?.toLowerCase()
          .includes(query) ||
        hackathon.description
          ?.toLowerCase()
          .includes(query) ||
        hackathon.location
          ?.toLowerCase()
          .includes(query) ||
        hackathon.mode
          ?.toLowerCase()
          .includes(query) ||
        hackathon.difficulty
          ?.toLowerCase()
          .includes(query);

      return (
        matchesFilter &&
        matchesSearch
      );
    });
  }, [hackathons, search, filter]);

  const counts = useMemo(() => {
    return {
      all: hackathons.length,

      upcoming: hackathons.filter(
        (h) =>
          getHackathonStatus(h) ===
          "upcoming"
      ).length,

      ongoing: hackathons.filter(
        (h) =>
          getHackathonStatus(h) ===
          "ongoing"
      ).length,

      completed: hackathons.filter(
        (h) =>
          getHackathonStatus(h) ===
          "completed"
      ).length,
    };
  }, [hackathons]);

  return (
    <div className="space-y-8">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <section>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-violet-600">
              <Sparkles size={16} />
              Discover opportunities
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Explore Hackathons
            </h1>

            <p className="mt-2 max-w-2xl text-slate-500">
              Discover upcoming competitions,
              find your next challenge, and
              build something amazing with
              the right team.
            </p>
          </div>

          <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Available
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {hackathons.length}
            </p>

            <p className="text-xs text-slate-500">
              hackathons
            </p>
          </div>

        </div>
      </section>

      {/* ================================================= */}
      {/* SEARCH + FILTER */}
      {/* ================================================= */}

      <section className="rounded-2xl border bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* Search */}
          <div className="relative w-full lg:max-w-xl">

            <Search
              size={19}
              className="absolute left-4 top-3.5 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by name, organizer, skill, location..."
              className="w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
            />

          </div>

          {/* Filter */}
          <div className="flex flex-wrap items-center gap-2">

            <div className="mr-1 flex items-center gap-2 text-sm text-slate-500">
              <SlidersHorizontal size={16} />
              Filter
            </div>

            {(
              [
                ["all", "All"],
                ["upcoming", "Upcoming"],
                ["ongoing", "Ongoing"],
                ["completed", "Completed"],
              ] as const
            ).map(([value, label]) => (

              <button
                key={value}
                type="button"
                onClick={() =>
                  setFilter(value)
                }
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  filter === value
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}

                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                    filter === value
                      ? "bg-white/20"
                      : "bg-white"
                  }`}
                >
                  {counts[value]}
                </span>
              </button>

            ))}

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ================================================= */}
      {/* LOADING */}
      {/* ================================================= */}

      {loading && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse overflow-hidden rounded-2xl border bg-white"
            >
              <div className="h-44 bg-slate-200" />

              <div className="space-y-4 p-6">
                <div className="h-5 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-200" />
                <div className="h-4 w-2/3 rounded bg-slate-200" />
                <div className="h-10 w-full rounded bg-slate-200" />
              </div>
            </div>
          ))}

        </div>
      )}

      {/* ================================================= */}
      {/* EMPTY */}
      {/* ================================================= */}

      {!loading &&
        filteredHackathons.length === 0 && (
          <div className="rounded-2xl border bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
              <Trophy
                size={28}
                className="text-violet-600"
              />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No hackathons found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Try changing your search or
              selecting another filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
              className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Clear filters
            </button>

          </div>
        )}

      {/* ================================================= */}
      {/* HACKATHON GRID */}
      {/* ================================================= */}

      {!loading &&
        filteredHackathons.length > 0 && (

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

            {filteredHackathons.map(
              (hackathon) => {

                const status =
                  getHackathonStatus(
                    hackathon
                  );

                const deadlineDays =
                  daysUntil(
                    hackathon.registration_deadline
                  );

                const isRegistrationOpen =
                  deadlineDays >= 0 &&
                  status !== "completed";

                return (
                  <article
                    key={hackathon.id}
                    className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >

                    {/* Banner */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-slate-900">

                      {hackathon.banner_image ? (
                        <img
                          src={
                            hackathon.banner_image
                          }
                          alt={
                            hackathon.title
                          }
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Trophy
                            size={52}
                            className="text-white/80"
                          />
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

                      {/* Status */}
                      <div className="absolute left-4 top-4">

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur ${
                            status === "upcoming"
                              ? "bg-emerald-500/90 text-white"
                              : status === "ongoing"
                              ? "bg-blue-500/90 text-white"
                              : "bg-slate-700/90 text-white"
                          }`}
                        >
                          {status ===
                          "upcoming"
                            ? "Upcoming"
                            : status ===
                              "ongoing"
                            ? "Ongoing"
                            : "Completed"}
                        </span>

                      </div>

                      {/* Difficulty */}
                      <div className="absolute right-4 top-4">
                        <span className="rounded-full bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                          {hackathon.difficulty}
                        </span>
                      </div>

                      {/* Organizer */}
                      <div className="absolute bottom-4 left-4 text-sm font-medium text-white">
                        {hackathon.organizer}
                      </div>

                    </div>

                    {/* Content */}
                    <div className="p-6">

                      <h2 className="line-clamp-2 text-xl font-bold text-slate-900">
                        {hackathon.title}
                      </h2>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {hackathon.description}
                      </p>

                      {/* Info */}
                      <div className="mt-5 grid grid-cols-2 gap-3">

                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <CalendarDays size={14} />
                            Dates
                          </div>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {formatDate(
                              hackathon.start_date
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Users size={14} />
                            Team
                          </div>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            Up to{" "}
                            {
                              hackathon.team_size
                            }
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <MapPin size={14} />
                            Location
                          </div>

                          <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                            {hackathon.location ||
                              hackathon.mode}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Trophy size={14} />
                            Prize
                          </div>

                          <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                            {
                              hackathon.prize_pool
                            }
                          </p>
                        </div>

                      </div>

                      {/* Deadline */}
                      {isRegistrationOpen && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">

                          <Clock size={15} />

                          <span>
                            Registration deadline:
                            {" "}
                            <strong>
                              {formatDate(
                                hackathon.registration_deadline
                              )}
                            </strong>
                          </span>

                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-5 flex gap-3">

                        <Link
                          href={`/dashboard/hackathons/${hackathon.id}`}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                        >
                          View Details
                        </Link>

                        {hackathon.website && (
                          <a
                            href={
                              hackathon.website
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center rounded-xl border px-4 py-3 text-slate-600 transition hover:bg-slate-50"
                            title="Official website"
                          >
                            <ExternalLink
                              size={17}
                            />
                          </a>
                        )}

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

    </div>
  );
}