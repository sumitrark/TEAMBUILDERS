"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useHackathons } from "@/hooks/useHackathons";
import { joinHackathon } from "@/services/participant";

interface ConflictHackathon {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
}

interface ConflictDetails {
  message: string;
  existing_hackathon: ConflictHackathon;
  requested_hackathon: ConflictHackathon;
}

export default function RecommendedHackathons() {
  const router = useRouter();

  const {
    hackathons,
    loading,
  } = useHackathons();

  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [conflict, setConflict] =
    useState<ConflictDetails | null>(null);

  const handleJoin = async (id: string) => {
    try {
      setJoiningId(id);
      setSuccessMessage("");
      setConflict(null);

      await joinHackathon(id);

      setSuccessMessage(
        "Successfully joined the hackathon!"
      );

      router.refresh();

    } catch (err: any) {
      console.error(
        "Failed to join hackathon:",
        err
      );

      /*
       * Backend returns HTTP 409 when the student's
       * schedule conflicts with another hackathon.
       */

      if (err?.response?.status === 409) {
        const detail =
          err?.response?.data?.detail;

        if (
          detail &&
          typeof detail === "object"
        ) {
          setConflict(detail);
        } else {
          setConflict({
            message:
              "You already have another hackathon scheduled during this period.",
            existing_hackathon: {
              id: "",
              title: "Existing Hackathon",
              start_date: "",
              end_date: "",
            },
            requested_hackathon: {
              id,
              title: "Selected Hackathon",
              start_date: "",
              end_date: "",
            },
          });
        }

        return;
      }

      /*
       * Already registered
       */

      if (err?.response?.status === 400) {
        alert(
          err?.response?.data?.detail ??
            "You are already registered for this hackathon."
        );

        return;
      }

      alert(
        err?.response?.data?.detail ??
          "Unable to join hackathon."
      );

    } finally {
      setJoiningId(null);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="animate-pulse">

          <div className="h-7 w-64 rounded bg-gray-200" />

          <div className="mt-6 space-y-4">
            <div className="h-28 rounded-xl bg-gray-100" />
            <div className="h-28 rounded-xl bg-gray-100" />
          </div>

        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">

        {/* Header */}

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h2 className="text-2xl font-bold">
              Recommended Hackathons
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Discover hackathons you can participate in.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard/hackathons"
              )
            }
            className="font-semibold text-violet-600 transition hover:text-violet-700 hover:underline"
          >
            View All →
          </button>

        </div>

        {/* Success message */}

        {successMessage && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700">
                ✓
              </div>

              <div>
                <p className="font-semibold text-green-800">
                  Registration successful
                </p>

                <p className="text-sm text-green-700">
                  {successMessage}
                </p>
              </div>

            </div>

          </div>
        )}

        {/* Hackathons */}

        <div className="space-y-5">

          {hackathons.length === 0 ? (

            <div className="rounded-xl border border-dashed py-10 text-center">

              <div className="text-4xl">
                🏆
              </div>

              <h3 className="mt-3 font-semibold">
                No hackathons available
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Check back later for new hackathons.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard/hackathons"
                  )
                }
                className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Explore Hackathons
              </button>

            </div>

          ) : (

            hackathons
              .slice(0, 5)
              .map((hackathon: any) => (

                <div
                  key={hackathon.id}
                  className="rounded-xl border p-5 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
                >

                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                    {/* Hackathon information */}

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/hackathons/${hackathon.id}`
                        )
                      }
                      className="flex-1 text-left"
                    >

                      <h3 className="text-xl font-bold transition hover:text-violet-600">
                        {hackathon.title}
                      </h3>

                      <div className="mt-3 space-y-1.5">

                        {hackathon.location && (
                          <p className="text-sm text-gray-500">
                            📍 {hackathon.location}
                          </p>
                        )}

                        {hackathon.team_size && (
                          <p className="text-sm text-gray-500">
                            👥 Team Size:{" "}
                            {hackathon.team_size}
                          </p>
                        )}

                        {hackathon.organizer && (
                          <p className="text-sm text-gray-500">
                            🏢{" "}
                            {hackathon.organizer}
                          </p>
                        )}

                        {hackathon.prize_pool && (
                          <p className="text-sm text-gray-500">
                            💰{" "}
                            {hackathon.prize_pool}
                          </p>
                        )}

                        {hackathon.start_date && (
                          <p className="text-sm text-gray-500">
                            📅{" "}
                            {formatDate(
                              hackathon.start_date
                            )}
                            {hackathon.end_date &&
                              ` – ${formatDate(
                                hackathon.end_date
                              )}`}
                          </p>
                        )}

                      </div>

                    </button>

                    {/* Actions */}

                    <div className="flex gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/dashboard/hackathons/${hackathon.id}`
                          )
                        }
                        className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Details
                      </button>

                      <button
                        type="button"
                        disabled={
                          joiningId ===
                          hackathon.id
                        }
                        onClick={() =>
                          handleJoin(
                            hackathon.id
                          )
                        }
                        className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {joiningId ===
                        hackathon.id
                          ? "Checking..."
                          : "Join"}
                      </button>

                    </div>

                  </div>

                </div>

              ))

          )}

        </div>

      </div>

      {/* Schedule Conflict Modal */}

      {conflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">

            {/* Header */}

            <div className="flex items-start justify-between gap-4">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">
                  ⚠️
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Schedule Conflict
                  </h2>

                  <p className="text-sm text-gray-500">
                    Registration cannot continue.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setConflict(null)
                }
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>

            </div>

            {/* Explanation */}

            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">

              <p className="text-sm leading-6 text-red-800">
                You are already participating
                in a hackathon whose schedule
                overlaps with the hackathon you
                selected.
              </p>

            </div>

            {/* Existing hackathon */}

            <div className="mt-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Existing Registration
              </p>

              <div className="mt-2 rounded-2xl border p-4">

                <h3 className="font-bold">
                  {
                    conflict
                      .existing_hackathon
                      .title
                  }
                </h3>

                {conflict
                  .existing_hackathon
                  .start_date && (
                  <p className="mt-2 text-sm text-gray-500">
                    📅{" "}
                    {formatDate(
                      conflict
                        .existing_hackathon
                        .start_date
                    )}
                    {" – "}
                    {formatDate(
                      conflict
                        .existing_hackathon
                        .end_date
                    )}
                  </p>
                )}

              </div>

            </div>

            {/* Requested hackathon */}

            <div className="mt-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Selected Hackathon
              </p>

              <div className="mt-2 rounded-2xl border border-violet-200 bg-violet-50 p-4">

                <h3 className="font-bold text-violet-900">
                  {
                    conflict
                      .requested_hackathon
                      .title
                  }
                </h3>

                {conflict
                  .requested_hackathon
                  .start_date && (
                  <p className="mt-2 text-sm text-violet-700">
                    📅{" "}
                    {formatDate(
                      conflict
                        .requested_hackathon
                        .start_date
                    )}
                    {" – "}
                    {formatDate(
                      conflict
                        .requested_hackathon
                        .end_date
                    )}
                  </p>
                )}

              </div>

            </div>

            {/* Footer */}

            <div className="mt-7 flex justify-end">

              <button
                type="button"
                onClick={() =>
                  setConflict(null)
                }
                className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Understand
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}