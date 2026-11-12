
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Mail,
  Users,
  Calendar,
  Check,
  X,
  Loader2,
  Gavel,
  Building2,
} from "lucide-react";

import{ api } from "@/lib/api";

// =========================================================
// TYPES
// =========================================================

interface TeamInvitation {
  id: string;
  team_id: string;
  inviter_id: string;
  invitee_id: string;
  status: string;
  created_at: string;
  responded_at: string | null;

  inviter_name?: string | null;
  team_name?: string | null;
  team_description?: string | null;
  team_max_members?: number | null;
}

interface JudgeInvitation {
  invitation_id: string;
  hackathon_id: string;
  hackathon_title: string;
  organizer_name: string;
  status: string;
  created_at: string;
  expires_at: string;
}

// =========================================================
// PAGE
// =========================================================

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [judgeInvitations, setJudgeInvitations] = useState<JudgeInvitation[]>([]);
  const [judgeLoading, setJudgeLoading] = useState(true);
  const [judgeProcessingId, setJudgeProcessingId] = useState<string | null>(null);
  const [judgeError, setJudgeError] = useState("");

  // =========================================================
  // LOAD TEAM INVITATIONS
  // =========================================================

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/team-invitations/my");

      const data: TeamInvitation[] = Array.isArray(response.data)
        ? response.data
        : [];

      setInvitations(
        data.filter(
          (invitation) => invitation.status === "pending"
        )
      );
    } catch (err: any) {
      console.error("Failed to load team invitations:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load team invitations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // LOAD JUDGE INVITATIONS
  // =========================================================

  const loadJudgeInvitations = useCallback(async () => {
    try {
      setJudgeLoading(true);
      setJudgeError("");

      const response = await api.get("/judge/invitations/pending");

      setJudgeInvitations(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err: any) {
      console.error("Failed to load judge invitations:", err);

      setJudgeError(
        err?.response?.data?.detail ||
          "Unable to load judge invitations."
      );
    } finally {
      setJudgeLoading(false);
    }
  }, []);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadInvitations();
    loadJudgeInvitations();
  }, [loadInvitations, loadJudgeInvitations]);

  // =========================================================
  // ACCEPT TEAM INVITATION
  // =========================================================

  async function handleAccept(invitationId: string) {
    try {
      setProcessingId(invitationId);
      setError("");

      await api.post(
        `/team-invitations/${invitationId}/accept`
      );

      await loadInvitations();

      // Refresh the current invitation list after acceptance.
      // The accepted team should now appear under My Teams.
    } catch (err: any) {
      console.error("Failed to accept team invitation:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to accept the team invitation."
      );
    } finally {
      setProcessingId(null);
    }
  }

  // =========================================================
  // DECLINE TEAM INVITATION
  // =========================================================

  async function handleDecline(invitationId: string) {
    try {
      setProcessingId(invitationId);
      setError("");

      await api.post(
        `/team-invitations/${invitationId}/decline`
      );

      await loadInvitations();
    } catch (err: any) {
      console.error("Failed to decline team invitation:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to decline the team invitation."
      );
    } finally {
      setProcessingId(null);
    }
  }

  // =========================================================
  // ACCEPT / DECLINE JUDGE INVITATION
  // =========================================================

  async function handleJudgeInvitationResponse(
    invitationId: string,
    action: "accept" | "decline"
  ) {
    try {
      setJudgeProcessingId(invitationId);
      setJudgeError("");

      await api.post(
        `/judge/invitations/${invitationId}/${action}`
      );

      await loadJudgeInvitations();
    } catch (err: any) {
      console.error(
        `Failed to ${action} judge invitation:`,
        err
      );

      setJudgeError(
        err?.response?.data?.detail ||
          `Unable to ${action} judge invitation.`
      );
    } finally {
      setJudgeProcessingId(null);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-violet-600"
          />

          <p className="mt-4 text-sm text-slate-500">
            Loading invitations...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE CONTENT
  // =========================================================

  return (
    <div className="min-h-screen space-y-8">

      {/* HEADER */}

      <div>
        <p className="text-sm font-semibold text-violet-600">
          TEAM INVITATIONS
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Invitations
        </h1>

        <p className="mt-2 text-slate-500">
          Review invitations to join hackathon teams.
        </p>
      </div>

      {/* TEAM INVITATION ERROR */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {typeof error === "string" ? error : "Unable to process invitation."}
        </div>
      )}

      {/* TEAM INVITATIONS */}

      {invitations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Mail
            size={46}
            className="mx-auto mb-4 text-slate-400"
          />

          <h2 className="text-lg font-semibold text-slate-800">
            No pending invitations
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            You do not have any pending team invitations.
          </p>
        </div>
      ) : (
        <div className="space-y-5">

          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

                {/* TEAM DETAILS */}

                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100">
                    <Users
                      size={25}
                      className="text-violet-600"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900">
                        {invitation.team_name || "Hackathon Team"}
                      </h2>

                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                        Pending
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {invitation.team_description ||
                        "You have been invited to join this team."}
                    </p>

                    {/* INVITER NAME */}

                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Building2 size={16} className="text-violet-500" />

                        Invited by{" "}
                        <strong>
                          {invitation.inviter_name || "Team owner"}
                        </strong>
                      </span>
                    </div>

                    {/* TEAM INFORMATION */}

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Users size={16} />

                        Up to{" "}
                        {invitation.team_max_members ?? "—"}{" "}
                        members
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Calendar size={16} />

                        Invited{" "}
                        {new Date(
                          invitation.created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACCEPT / DECLINE */}

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccept(invitation.id)}
                    disabled={processingId === invitation.id}
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    {processingId === invitation.id ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Check size={16} />
                    )}

                    Accept
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecline(invitation.id)}
                    disabled={processingId === invitation.id}
                    className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <X size={16} />
                    Decline
                  </button>
                </div>

              </div>
            </div>
          ))}

        </div>
      )}

      {/* =====================================================
          JUDGE INVITATIONS
      ===================================================== */}

      <div>
        <p className="text-sm font-semibold text-violet-600">
          JUDGE INVITATIONS
        </p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Judge Invitations
        </h2>

        <p className="mt-2 text-slate-500">
          Invitations to judge a hackathon.
        </p>
      </div>

      {/* JUDGE ERROR */}

      {judgeError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {judgeError}
        </div>
      )}

      {/* JUDGE LOADING */}

      {judgeLoading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">
          <Loader2
            size={18}
            className="animate-spin"
          />

          Loading judge invitations...
        </div>
      ) : judgeInvitations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Gavel
            size={46}
            className="mx-auto mb-4 text-slate-400"
          />

          <h2 className="text-lg font-semibold text-slate-800">
            No pending judge invitations
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            You do not have any pending invitations to judge a hackathon.
          </p>
        </div>
      ) : (
        <div className="space-y-5">

          {judgeInvitations.map((invitation) => (
            <div
              key={invitation.invitation_id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

                {/* JUDGE DETAILS */}

                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                    <Gavel
                      size={25}
                      className="text-amber-600"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900">
                        {invitation.hackathon_title}
                      </h2>

                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                        Pending
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      You have been invited to judge this hackathon.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Building2 size={16} />

                        Invited by {invitation.organizer_name}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Calendar size={16} />

                        Invited{" "}
                        {new Date(
                          invitation.created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* JUDGE ACTIONS */}

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleJudgeInvitationResponse(
                        invitation.invitation_id,
                        "accept"
                      )
                    }
                    disabled={
                      judgeProcessingId === invitation.invitation_id
                    }
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    {judgeProcessingId === invitation.invitation_id ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Check size={16} />
                    )}

                    Accept
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleJudgeInvitationResponse(
                        invitation.invitation_id,
                        "decline"
                      )
                    }
                    disabled={
                      judgeProcessingId === invitation.invitation_id
                    }
                    className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <X size={16} />
                    Decline
                  </button>
                </div>

              </div>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}
