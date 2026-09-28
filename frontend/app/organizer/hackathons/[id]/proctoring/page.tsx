"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  Camera,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  UserX,
  Trash2,
} from "lucide-react";

import {
  getProctoringMonitor,
  dismissParticipantFlag,
  disqualifyParticipant,
  deleteProctoringSnapshot,
  ProctoringMonitorParticipant,
} from "@/services/proctoring";

export default function ProctoringMonitorPage() {
  const params = useParams();
  const hackathonId = params.id as string;

  const [participants, setParticipants] = useState<
    ProctoringMonitorParticipant[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedId, setExpandedId] =
    useState<string | null>(null);

  const [actioningId, setActioningId] =
    useState<string | null>(null);

  const [deletingSnapshotId, setDeletingSnapshotId] =
    useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError("");

      setParticipants(
        await getProctoringMonitor(hackathonId)
      );
    } catch (err) {
      console.error(
        "Failed to load proctoring monitor:",
        err
      );

      setError(
        "Unable to load the proctoring monitor."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hackathonId) {
      load();
    }
  }, [hackathonId]);

  async function dismiss(userId: string) {
    try {
      setActioningId(userId);
      setError("");

      await dismissParticipantFlag(
        hackathonId,
        userId
      );

      await load();
    } catch (err) {
      console.error(
        "Failed to dismiss review flag:",
        err
      );

      setError(
        "Unable to dismiss this review flag."
      );
    } finally {
      setActioningId(null);
    }
  }

  async function disqualify(
    userId: string,
    name: string
  ) {
    if (
      !confirm(
        `Disqualify ${name}? They will be notified.`
      )
    ) {
      return;
    }

    try {
      setActioningId(userId);
      setError("");

      await disqualifyParticipant(
        hackathonId,
        userId
      );

      await load();
    } catch (err) {
      console.error(
        "Failed to disqualify participant:",
        err
      );

      setError(
        "Unable to disqualify this participant."
      );
    } finally {
      setActioningId(null);
    }
  }

  async function deleteSnapshot(
    eventId: string
  ) {
    if (
      !confirm(
        "Delete this snapshot? The proctoring event will remain, but the stored image will be permanently removed."
      )
    ) {
      return;
    }

    try {
      setDeletingSnapshotId(eventId);
      setError("");

      await deleteProctoringSnapshot(
        hackathonId,
        eventId
      );

      /*
       * Update the local UI immediately rather than
       * forcing another full monitor request.
       */
      setParticipants((current) =>
        current.map((participant) => ({
          ...participant,
          recent_events:
            participant.recent_events.map(
              (event) =>
                event.id === eventId
                  ? {
                      ...event,
                      snapshot_data_url: null,
                    }
                  : event
            ),
        }))
      );
    } catch (err: any) {
      console.error(
        "Failed to delete snapshot:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to delete this snapshot."
      );
    } finally {
      setDeletingSnapshotId(null);
    }
  }

  const flagged = participants.filter(
    (p) => p.flagged_for_review
  ).length;

  const verified = participants.filter(
    (p) => p.identity_status === "VERIFIED"
  ).length;

  const cameraPresent = participants.filter(
    (p) => p.last_face_detected === true
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
              <ShieldCheck className="h-6 w-6 text-violet-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Proctoring Monitor
              </h1>

              <p className="text-sm text-slate-500">
                Identity, camera presence and review
                signals for registered participants.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Metrics */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric
          label="Registered"
          value={participants.length}
        />

        <Metric
          label="Identity verified"
          value={verified}
        />

        <Metric
          label="Camera present"
          value={cameraPresent}
        />

        <Metric
          label="Review flags"
          value={flagged}
        />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-400">
          Loading proctoring data...
        </div>
      ) : participants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <UsersIcon />
          </div>

          <p className="mt-4 font-medium">
            No registered participants yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">

          {participants.map((participant) => {
            const identityVerified =
              participant.identity_status ===
              "VERIFIED";

            const cameraDetected =
              participant.last_face_detected === true;

            const expanded =
              expandedId === participant.user_id;

            return (
              <div
                key={participant.user_id}
                className={`rounded-2xl border bg-white p-6 shadow-sm ${
                  participant.flagged_for_review
                    ? "border-red-200"
                    : "border-slate-200"
                }`}
              >

                {/* Participant header */}
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-900">
                        {participant.full_name}
                      </h2>

                      {participant.flagged_for_review && (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                          Review required
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-500">
                      {participant.email}
                    </p>

                    {/* Status badges */}
                    <div className="mt-4 flex flex-wrap gap-2">

                      <Status
                        ok={identityVerified}
                        icon={
                          <ShieldCheck className="h-3.5 w-3.5" />
                        }
                        text={
                          identityVerified
                            ? "Identity verified"
                            : `Identity ${participant.identity_status.toLowerCase()}`
                        }
                      />

                      <Status
                        ok={cameraDetected}
                        icon={
                          <Camera className="h-3.5 w-3.5" />
                        }
                        text={
                          cameraDetected
                            ? "Camera present"
                            : "No recent face detected"
                        }
                      />

                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        <ShieldAlert className="h-3.5 w-3.5" />

                        {participant.strike_count} review
                        signal
                        {participant.strike_count === 1
                          ? ""
                          : "s"}
                      </span>
                    </div>

                    {/* Last check */}
                    {participant.last_check_at && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5" />

                        Last check{" "}
                        {new Date(
                          participant.last_check_at
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Review actions */}
                  {participant.flagged_for_review && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          dismiss(
                            participant.user_id
                          )
                        }
                        disabled={
                          actioningId ===
                          participant.user_id
                        }
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                      >
                        Dismiss
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          disqualify(
                            participant.user_id,
                            participant.full_name
                          )
                        }
                        disabled={
                          actioningId ===
                          participant.user_id
                        }
                        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <UserX className="h-4 w-4" />
                        Disqualify
                      </button>
                    </div>
                  )}
                </div>

                {/* Snapshot toggle */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(
                      expanded
                        ? null
                        : participant.user_id
                    )
                  }
                  className="mt-5 flex items-center gap-2 text-sm font-semibold text-violet-600 transition hover:text-violet-700"
                >
                  <ImageIcon className="h-4 w-4" />

                  {expanded
                    ? "Hide snapshots"
                    : "View recent snapshots"}
                </button>

                {/* Snapshots */}
                {expanded && (
                  <div className="mt-4">
                    {participant.recent_events.length ===
                    0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-400">
                        No recent proctoring events.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">

                        {participant.recent_events.map(
                          (event) => (
                            <div
                              key={event.id}
                              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                            >

                              {/* Image */}
                              {event.snapshot_data_url ? (
                                <img
                                  src={
                                    event.snapshot_data_url
                                  }
                                  alt="Proctoring check snapshot"
                                  className="h-32 w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-32 items-center justify-center bg-slate-50 text-xs text-slate-400">
                                  Snapshot deleted
                                </div>
                              )}

                              <div className="p-3">

                                {/* Face status */}
                                <p
                                  className={`text-xs font-semibold ${
                                    event.face_detected
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {event.face_detected
                                    ? "Face detected"
                                    : "Face not detected"}
                                </p>

                                {/* Face matching signal */}
                                {event.face_match_status && (
                                  <p className="mt-1 text-[11px] font-medium text-slate-500">
                                    Face signal:{" "}
                                    {event.face_match_status}
                                  </p>
                                )}

                                {typeof event.face_similarity ===
                                  "number" && (
                                  <p className="mt-1 text-[11px] text-slate-400">
                                    Similarity:{" "}
                                    {Math.round(
                                      event.face_similarity *
                                        100
                                    )}
                                    %
                                  </p>
                                )}

                                {/* Timestamp */}
                                <p className="mt-1 text-[11px] text-slate-400">
                                  {new Date(
                                    event.created_at
                                  ).toLocaleString()}
                                </p>

                                {/* Delete */}
                                {event.snapshot_data_url && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteSnapshot(
                                        event.id
                                      )
                                    }
                                    disabled={
                                      deletingSnapshotId ===
                                      event.id
                                    }
                                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />

                                    {deletingSnapshotId ===
                                    event.id
                                      ? "Deleting..."
                                      : "Delete Snapshot"}
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Status({
  ok,
  icon,
  text,
}: {
  ok: boolean;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        ok
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        icon
      )}

      {text}
    </span>
  );
}

function UsersIcon() {
  return (
    <UsersGroupIcon />
  );
}

function UsersGroupIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7 text-slate-400"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      />
      <circle cx="9" cy="7" r="4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      />
    </svg>
  );
}