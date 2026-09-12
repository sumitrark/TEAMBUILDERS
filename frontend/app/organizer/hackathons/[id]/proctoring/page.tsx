"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ShieldAlert,
  Loader2,
  CheckCircle2,
  UserX,
  Image as ImageIcon,
} from "lucide-react";

import {
  getFlaggedParticipants,
  dismissParticipantFlag,
  disqualifyParticipant,
  FlaggedParticipant,
} from "@/services/proctoring";

export default function ProctoringReviewPage() {
  const params = useParams();
  const hackathonId = params.id as string;

  const [participants, setParticipants] = useState<FlaggedParticipant[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (hackathonId) {
      load();
    }
  }, [hackathonId]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      setParticipants(await getFlaggedParticipants(hackathonId));
    } catch (err) {
      console.error("Failed to load flagged participants:", err);
      setError("Unable to load flagged participants. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDismiss(userId: string) {
    try {
      setActioningId(userId);
      await dismissParticipantFlag(hackathonId, userId);
      await load();
    } catch (err) {
      console.error("Failed to dismiss flag:", err);
      setError("Unable to dismiss this flag. Please try again.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleDisqualify(userId: string, fullName: string) {
    if (
      !confirm(
        `Disqualify ${fullName}? This cannot be undone automatically ` +
          `and they will be notified.`
      )
    ) {
      return;
    }

    try {
      setActioningId(userId);
      await disqualifyParticipant(hackathonId, userId);
      await load();
    } catch (err) {
      console.error("Failed to disqualify participant:", err);
      setError("Unable to disqualify this participant. Please try again.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
          <ShieldAlert className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Proctoring Review
          </h1>
          <p className="text-sm text-slate-500">
            Participants flagged after repeated presence check-ins with
            no visible camera feed. Nothing here has been removed
            automatically - review the events and decide.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 py-12 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading...
        </div>
      ) : participants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-300" />
          <h3 className="text-lg font-semibold text-slate-800">
            No flagged participants
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Everyone currently has a normal presence check-in record.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {participants.map((p) => (
            <div
              key={p.user_id}
              className="rounded-2xl border border-red-200 bg-white p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-bold text-slate-900">
                    {p.full_name}
                  </p>
                  <p className="text-sm text-slate-500">{p.email}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                    {p.strike_count} flagged check-ins
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDismiss(p.user_id)}
                    disabled={actioningId === p.user_id}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDisqualify(p.user_id, p.full_name)
                    }
                    disabled={actioningId === p.user_id}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    <UserX className="h-4 w-4" />
                    Disqualify
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setExpandedId(
                    expandedId === p.user_id ? null : p.user_id
                  )
                }
                className="mt-4 flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-800"
              >
                <ImageIcon className="h-4 w-4" />
                {expandedId === p.user_id ? "Hide" : "View"} recent
                flagged events
              </button>

              {expandedId === p.user_id && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {p.recent_flagged_events.map((event) => (
                    <div
                      key={event.id}
                      className="overflow-hidden rounded-lg border border-slate-200"
                    >
                      {event.snapshot_data_url ? (
                        <img
                          src={event.snapshot_data_url}
                          alt="Check-in snapshot"
                          className="h-24 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-24 items-center justify-center bg-slate-50 text-xs text-slate-400">
                          No snapshot
                        </div>
                      )}
                      <p className="p-1.5 text-center text-[11px] text-slate-400">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
