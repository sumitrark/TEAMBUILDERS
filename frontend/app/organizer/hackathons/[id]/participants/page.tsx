"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Users,
  Mail,
  GraduationCap,
  UsersRound,
  RefreshCw,
} from "lucide-react";

import {
  getHackathonParticipants,
  Participant,
} from "@/services/organizerHackathon";

export default function ParticipantsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "assigned" | "unassigned"
  >("all");

  async function loadParticipants() {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const data = await getHackathonParticipants(id);

      setParticipants(data);
    } catch (err: any) {
      console.error(
        "Failed to load participants:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to load participants."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadParticipants();
  }, [id]);

  const filteredParticipants = useMemo(() => {
    const query = search.trim().toLowerCase();

    return participants.filter((participant) => {
      const matchesSearch =
        !query ||
        participant.name
          ?.toLowerCase()
          .includes(query) ||
        participant.username
          ?.toLowerCase()
          .includes(query) ||
        participant.email
          ?.toLowerCase()
          .includes(query) ||
        participant.college
          ?.toLowerCase()
          .includes(query) ||
        participant.course
          ?.toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "assigned" &&
          Boolean(participant.team_id)) ||
        (filter === "unassigned" &&
          !participant.team_id);

      return matchesSearch && matchesFilter;
    });
  }, [participants, search, filter]);

  const assignedCount = participants.filter(
    (participant) => participant.team_id
  ).length;

  const unassignedCount =
    participants.length - assignedCount;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div className="flex items-start gap-4">
            <button
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${id}`
                )
              }
              className="mt-1 rounded-xl border bg-white p-2.5 text-gray-600 transition hover:bg-gray-50"
              title="Back to hackathon"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Participants
              </h1>

              <p className="mt-1 text-gray-500">
                Manage participants registered for
                this hackathon.
              </p>
            </div>
          </div>

          <button
            onClick={loadParticipants}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Participants
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {participants.length}
                </p>
              </div>

              <div className="rounded-xl bg-violet-100 p-3 text-violet-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Assigned to Teams
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {assignedCount}
                </p>
              </div>

              <div className="rounded-xl bg-green-100 p-3 text-green-600">
                <UsersRound className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Not Assigned
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {unassignedCount}
                </p>
              </div>

              <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

        </div>

        {/* Main card */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Registered Participants
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredParticipants.length} of{" "}
                {participants.length} participants shown
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search participants..."
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 sm:w-64"
                />
              </div>

              {/* Filter */}
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(
                    e.target.value as
                      | "all"
                      | "assigned"
                      | "unassigned"
                  )
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-500"
              >
                <option value="all">
                  All Participants
                </option>

                <option value="assigned">
                  Team Assigned
                </option>

                <option value="unassigned">
                  Not Assigned
                </option>
              </select>

            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <RefreshCw className="mx-auto h-7 w-7 animate-spin text-violet-600" />

                <p className="mt-3 text-sm text-gray-500">
                  Loading participants...
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-10 text-center">
              <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6">
                <p className="font-semibold text-red-700">
                  Unable to load participants
                </p>

                <p className="mt-2 text-sm text-red-600">
                  {error}
                </p>

                <button
                  onClick={loadParticipants}
                  className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading &&
            !error &&
            filteredParticipants.length === 0 && (
              <div className="p-12 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                  <Users className="h-7 w-7 text-gray-400" />
                </div>

                <h3 className="mt-4 font-semibold text-gray-900">
                  {participants.length === 0
                    ? "No participants yet"
                    : "No matching participants"}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {participants.length === 0
                    ? "Participants will appear here when they register."
                    : "Try changing your search or filter."}
                </p>

              </div>
            )}

          {/* Table */}
          {!loading &&
            !error &&
            filteredParticipants.length > 0 && (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[1000px]">

                  <thead className="bg-slate-50">
                    <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-gray-500">

                      <th className="px-5 py-4">
                        Participant
                      </th>

                      <th className="px-5 py-4">
                        Contact
                      </th>

                      <th className="px-5 py-4">
                        Education
                      </th>

                      <th className="px-5 py-4">
                        Year
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Team
                      </th>

                    </tr>
                  </thead>

                  <tbody>
                    {filteredParticipants.map(
                      (participant) => (
                        <tr
                          key={participant.id}
                          className="border-b last:border-b-0 hover:bg-slate-50"
                        >

                          {/* Participant */}
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700">
                                {(
                                  participant.name ||
                                  "U"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="font-semibold text-gray-900">
                                  {participant.name ||
                                    "Unknown User"}
                                </p>

                                {participant.username && (
                                  <p className="text-sm text-gray-500">
                                    @
                                    {
                                      participant.username
                                    }
                                  </p>
                                )}
                              </div>

                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4 text-gray-400" />

                              {participant.email}
                            </div>
                          </td>

                          {/* Education */}
                          <td className="px-5 py-5">
                            <div className="flex items-start gap-2">

                              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {participant.course ||
                                    "Course not provided"}
                                </p>

                                <p className="mt-1 max-w-xs text-xs text-gray-500">
                                  {participant.college ||
                                    "College not provided"}
                                </p>
                              </div>

                            </div>
                          </td>

                          {/* Year */}
                          <td className="px-5 py-5 text-sm text-gray-700">
                            {participant.year || "-"}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-5">
                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold capitalize text-green-700">
                              {participant.status ||
                                "registered"}
                            </span>
                          </td>

                          {/* Team */}
                          <td className="px-5 py-5">

                            {participant.team_id ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                <UsersRound className="h-3.5 w-3.5" />
                                Assigned
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                Not Assigned
                              </span>
                            )}

                          </td>

                        </tr>
                      )
                    )}
                  </tbody>

                </table>
              </div>
            )}

        </div>
      </div>
    </main>
  );
}