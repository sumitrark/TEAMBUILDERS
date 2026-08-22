"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Trophy,
  Globe,
  Pencil,
  Trash2,
  Power,
} from "lucide-react";

import {
  getOrganizerHackathons,
  deleteOrganizerHackathon,
  updateOrganizerHackathonStatus,
  Hackathon,
} from "@/services/organizerHackathon";

export default function ManageHackathonPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [hackathon, setHackathon] =
    useState<Hackathon | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadHackathon() {
    try {
      setLoading(true);

      const data = await getOrganizerHackathons();

      const found = data.find(
        (item: Hackathon) => item.id === id
      );

      setHackathon(found ?? null);
    } catch (error) {
      console.error(
        "Failed to load hackathon:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadHackathon();
    }
  }, [id]);

  async function changeStatus(status: string) {
    if (!hackathon) return;

    try {
      setActionLoading(true);

      const updated =
        await updateOrganizerHackathonStatus(
          hackathon.id,
          status
        );

      setHackathon(updated);

    } catch (error: any) {
      alert(
        error?.response?.data?.detail ??
          "Failed to update status"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!hackathon) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this hackathon?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      await deleteOrganizerHackathon(
        hackathon.id
      );

      alert("Hackathon deleted successfully.");

      router.push("/organizer/hackathons");

    } catch (error: any) {
      alert(
        error?.response?.data?.detail ??
          "Failed to delete hackathon"
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border bg-white p-12 text-center">
          Loading hackathon...
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border bg-white p-12 text-center">

          <Trophy className="mx-auto h-12 w-12 text-gray-300" />

          <h1 className="mt-4 text-xl font-bold">
            Hackathon not found
          </h1>

          <button
            onClick={() =>
              router.push("/organizer/hackathons")
            }
            className="mt-5 rounded-xl bg-violet-600 px-5 py-3 text-white"
          >
            Back to Hackathons
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="border-b bg-white px-8 py-6">

        <button
          onClick={() =>
            router.push("/organizer/hackathons")
          }
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Hackathons
        </button>

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

          <div>
            <div className="flex items-center gap-3">

              <h1 className="text-3xl font-bold text-gray-900">
                {hackathon.title}
              </h1>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                {hackathon.status}
              </span>

            </div>

            <p className="mt-2 text-gray-500">
              Manage your hackathon
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathon.id}/edit`
                )
              }
              className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>

            {hackathon.status === "Open" ? (
              <button
                disabled={actionLoading}
                onClick={() =>
                  changeStatus("Closed")
                }
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                <Power className="h-4 w-4" />
                Close
              </button>
            ) : (
              <button
                disabled={actionLoading}
                onClick={() =>
                  changeStatus("Open")
                }
                className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                <Power className="h-4 w-4" />
                Open
              </button>
            )}

            <button
              disabled={actionLoading}
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>

          </div>

        </div>
      </div>

      <div className="p-8">

        {/* Banner */}
        <div className="mb-6 h-64 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600">

          {hackathon.banner_image ? (
            <img
              src={hackathon.banner_image}
              alt={hackathon.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Trophy className="h-20 w-20 text-white/40" />
            </div>
          )}

        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Main */}
          <div className="lg:col-span-2">

            <div className="rounded-2xl border bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold">
                About the Hackathon
              </h2>

              <p className="mt-4 whitespace-pre-wrap leading-7 text-gray-600">
                {hackathon.description}
              </p>

            </div>

          </div>

          {/* Details */}
          <div className="space-y-4">

            <div className="rounded-2xl border bg-white p-5 shadow-sm">

              <h3 className="mb-4 font-semibold">
                Event Details
              </h3>

              <div className="space-y-4 text-sm">

                <div className="flex gap-3">
                  <CalendarDays className="h-5 w-5 text-violet-600" />

                  <div>
                    <p className="font-medium">
                      Registration Deadline
                    </p>
                    <p className="text-gray-500">
                      {hackathon.registration_deadline}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CalendarDays className="h-5 w-5 text-violet-600" />

                  <div>
                    <p className="font-medium">
                      Event Dates
                    </p>
                    <p className="text-gray-500">
                      {hackathon.start_date} →{" "}
                      {hackathon.end_date}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-violet-600" />

                  <div>
                    <p className="font-medium">
                      Location
                    </p>
                    <p className="text-gray-500">
                      {hackathon.location}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Users className="h-5 w-5 text-violet-600" />

                  <div>
                    <p className="font-medium">
                      Team Size
                    </p>
                    <p className="text-gray-500">
                      Up to {hackathon.team_size} members
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Trophy className="h-5 w-5 text-violet-600" />

                  <div>
                    <p className="font-medium">
                      Prize Pool
                    </p>
                    <p className="text-gray-500">
                      {hackathon.prize_pool}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Globe className="h-5 w-5 text-violet-600" />

                  <div>
                    <p className="font-medium">
                      Mode
                    </p>
                    <p className="text-gray-500">
                      {hackathon.mode}
                    </p>
                  </div>
                </div>

              </div>

            </div>

            {/* Organizer Actions */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm">

              <h3 className="mb-4 font-semibold">
                Manage
              </h3>

              <div className="space-y-2">

                <button
                  onClick={() =>
                    router.push(
                      `/organizer/hackathons/${hackathon.id}/participants`
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3 text-left text-sm font-medium hover:bg-gray-50"
                >
                  👥 View Participants
                </button>

                <button
                  onClick={() =>
                    router.push(
                      `/organizer/hackathons/${hackathon.id}/teams`
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3 text-left text-sm font-medium hover:bg-gray-50"
                >
                  👨‍👩‍👧 View Teams
                </button>

                <button
                  onClick={() =>
                    router.push(
                      `/organizer/hackathons/${hackathon.id}/judges`
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3 text-left text-sm font-medium hover:bg-gray-50"
                >
                  ⚖️ Manage Judges
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}