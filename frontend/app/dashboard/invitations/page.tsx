"use client";

import { useEffect, useState } from "react";
import {
  Check,
  X,
  Mail,
  Loader2,
  Users,
  Calendar,
} from "lucide-react";

import { api } from "@/lib/api";

interface TeamInvitation {
  id: string;
  team_id: string;
  inviter_id: string;
  invitee_id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
}

interface TeamDetails {
  id: string;
  name: string;
  description: string | null;
  max_members: number;
  owner_id: string;
  hackathon_id: string | null;
  created_at: string;
}

interface InvitationCard {
  invitation: TeamInvitation;
  team: TeamDetails | null;
}

export default function InvitationsPage() {
  const [items, setItems] =
    useState<InvitationCard[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  // ==================================================
  // LOAD INVITATIONS + TEAM DETAILS
  // ==================================================

  async function loadInvitations() {
    try {
      setLoading(true);
      setError("");

      const invitationResponse =
        await api.get(
          "/team-invitations/my"
        );

      const invitations: TeamInvitation[] =
        invitationResponse.data;

      const pending =
        invitations.filter(
          (invitation) =>
            invitation.status ===
            "pending"
        );

      const cards =
        await Promise.all(
          pending.map(
            async (invitation) => {
              try {
                const teamResponse =
                  await api.get(
                    `/teams/${invitation.team_id}`
                  );

                return {
                  invitation,
                  team: teamResponse.data,
                };
              } catch (teamError) {
                console.error(
                  "Failed to load team:",
                  teamError
                );

                return {
                  invitation,
                  team: null,
                };
              }
            }
          )
        );

      setItems(cards);
    } catch (err: any) {
      console.error(
        "Failed to load invitations:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load invitations."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvitations();
  }, []);

  // ==================================================
  // ACCEPT
  // ==================================================

  async function handleAccept(
    invitationId: string
  ) {
    try {
      setProcessingId(invitationId);
      setError("");

      await api.post(
        `/team-invitations/${invitationId}/accept`
      );

      await loadInvitations();
    } catch (err: any) {
      console.error(
        "Failed to accept invitation:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to accept invitation."
      );
    } finally {
      setProcessingId(null);
    }
  }

  // ==================================================
  // DECLINE
  // ==================================================

  async function handleDecline(
    invitationId: string
  ) {
    try {
      setProcessingId(invitationId);
      setError("");

      await api.post(
        `/team-invitations/${invitationId}/decline`
      );

      await loadInvitations();
    } catch (err: any) {
      console.error(
        "Failed to decline invitation:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to decline invitation."
      );
    } finally {
      setProcessingId(null);
    }
  }

  // ==================================================
  // LOADING
  // ==================================================

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

  // ==================================================
  // PAGE
  // ==================================================

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

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* EMPTY */}

      {items.length === 0 ? (

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

          <Mail
            size={46}
            className="mx-auto mb-4 text-slate-400"
          />

          <h2 className="text-lg font-semibold text-slate-800">
            No pending invitations
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            You don't have any pending team invitations.
          </p>

        </div>

      ) : (

        /* INVITATION CARDS */

        <div className="space-y-5">

          {items.map(
            ({
              invitation,
              team,
            }) => (

              <div
                key={invitation.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >

                {/* TEAM INFORMATION */}

                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

                  <div className="flex gap-4">

                    {/* ICON */}

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100">

                      <Users
                        size={25}
                        className="text-violet-600"
                      />

                    </div>

                    {/* DETAILS */}

                    <div>

                      <div className="flex items-center gap-3">

                        <h2 className="text-xl font-bold text-slate-900">

                          {team?.name ||
                            "Hackathon Team"}

                        </h2>

                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                          Pending
                        </span>

                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">

                        {team?.description ||
                          "You have been invited to join this team."}

                      </p>

                      {/* TEAM STATS */}

                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">

                        <span className="flex items-center gap-1.5">

                          <Users size={16} />

                          Up to{" "}
                          {team?.max_members ||
                            "—"}{" "}
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

                  {/* ACTIONS */}

                  <div className="flex shrink-0 gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        handleAccept(
                          invitation.id
                        )
                      }
                      disabled={
                        processingId ===
                        invitation.id
                      }
                      className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                    >

                      {processingId ===
                      invitation.id ? (

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
                        handleDecline(
                          invitation.id
                        )
                      }
                      disabled={
                        processingId ===
                        invitation.id
                      }
                      className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >

                      <X size={16} />

                      Decline

                    </button>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>
  );
}