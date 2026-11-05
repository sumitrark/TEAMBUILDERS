"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Gavel, Building2, Clock, Loader2 } from "lucide-react";

import { api } from "@/lib/api";
import { getCurrentUser } from "@/services/auth";
import { User } from "@/types/auth";

interface PublicInvitation {
  hackathon_id: string;
  hackathon_title: string;
  organizer_name: string;
  invited_email: string;
  status: string;
  expires_at: string;
  is_expired: boolean;
}

type ViewState =
  | "loading"
  | "not_found"
  | "expired"
  | "already_accepted"
  | "already_declined"
  | "cancelled"
  | "not_logged_in"
  | "wrong_account"
  | "ready"
  | "responded_accept"
  | "responded_decline";

export default function JudgeInviteLandingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [view, setView] = useState<ViewState>("loading");
  const [invitation, setInvitation] = useState<PublicInvitation | null>(
    null
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get(
          `/judge/invitations/token/${token}`
        );

        const data: PublicInvitation = response.data;
        setInvitation(data);

        if (data.is_expired || data.status === "expired") {
          setView("expired");
          return;
        }

        if (data.status === "accepted") {
          setView("already_accepted");
          return;
        }

        if (data.status === "declined") {
          setView("already_declined");
          return;
        }

        if (data.status === "cancelled") {
          setView("cancelled");
          return;
        }

        // Invitation is pending - now check auth state
        const accessToken =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null;

        if (!accessToken) {
          setView("not_logged_in");
          return;
        }

        try {
          const user = await getCurrentUser();
          setCurrentUser(user);

          if (
            user.email.toLowerCase() !==
            data.invited_email.toLowerCase()
          ) {
            setView("wrong_account");
          } else {
            setView("ready");
          }
        } catch {
          // Access token present but invalid/expired session
          setView("not_logged_in");
        }
      } catch (err) {
        console.error("Failed to load invitation:", err);
        setView("not_found");
      }
    }

    if (token) {
      load();
    }
  }, [token]);

  async function respond(action: "accept" | "decline") {
    try {
      setResponding(true);
      setError("");

      await api.post(`/judge/invitations/token/${token}/${action}`);

      setView(
        action === "accept" ? "responded_accept" : "responded_decline"
      );
    } catch (err: any) {
      console.error(`Failed to ${action} invitation:`, err);
      setError(
        err?.response?.data?.detail ||
          `Unable to ${action} this invitation. Please try again.`
      );
    } finally {
      setResponding(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 px-6 py-12">
      <div className="mx-auto flex min-h-[80vh] max-w-lg items-center justify-center">
        <div className="w-full rounded-3xl border border-gray-200 bg-white p-8 shadow-xl">

          {/* Header - shown for every state once we have invitation data */}
          {invitation && view !== "not_found" && (
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
                <Gavel size={28} className="text-amber-600" />
              </div>

              <p className="text-sm font-semibold tracking-widest text-violet-600">
                YOU'VE BEEN INVITED TO BE A JUDGE
              </p>

              <h1 className="mt-2 text-2xl font-bold text-gray-900">
                {invitation.hackathon_title}
              </h1>

              <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-gray-500">
                <Building2 size={15} />
                Invited by {invitation.organizer_name}
              </p>
            </div>
          )}

          {/* LOADING */}
          {view === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading invitation...
            </div>
          )}

          {/* NOT FOUND */}
          {view === "not_found" && (
            <div className="py-4 text-center">
              <p className="text-4xl">🔍</p>
              <h2 className="mt-4 text-xl font-bold text-gray-900">
                Invitation Not Found
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                This invitation link is invalid. Please check the link
                or ask the organizer to resend it.
              </p>
            </div>
          )}

          {/* EXPIRED */}
          {view === "expired" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
              <Clock className="mx-auto mb-2 h-6 w-6 text-amber-500" />
              <p className="font-semibold text-amber-800">
                This invitation has expired
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Please ask {invitation?.organizer_name} to resend the
                invitation.
              </p>
            </div>
          )}

          {/* ALREADY ACCEPTED */}
          {view === "already_accepted" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <p className="font-semibold text-emerald-800">
                This invitation has already been accepted
              </p>
              <button
                type="button"
                onClick={() => router.push("/judge")}
                className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Go to Judge Dashboard
              </button>
            </div>
          )}

          {/* ALREADY DECLINED */}
          {view === "already_declined" && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center text-gray-600">
              This invitation was already declined.
            </div>
          )}

          {/* CANCELLED */}
          {view === "cancelled" && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center text-gray-600">
              This invitation has been cancelled by the organizer.
            </div>
          )}

          {/* NOT LOGGED IN */}
          {view === "not_logged_in" && invitation && (
            <div className="space-y-3">
              <p className="text-center text-sm text-gray-500">
                Sign in or create an account with{" "}
                <strong>{invitation.invited_email}</strong> to respond
                to this invitation.
              </p>

              <a
                href={`/register?invitation_token=${token}`}
                className="block w-full rounded-xl bg-violet-600 py-3 text-center font-semibold text-white transition hover:bg-violet-700"
              >
                Create Judge Account
              </a>

              <a
                href={`/login?redirect=${encodeURIComponent(
                  `/judge/invite/${token}`
                )}`}
                className="block w-full rounded-xl border border-gray-200 py-3 text-center font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Already have an account? Log in
              </a>
            </div>
          )}

          {/* WRONG ACCOUNT */}
          {view === "wrong_account" && invitation && currentUser && (
            <div className="space-y-4">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                This invitation was sent to{" "}
                <strong>{invitation.invited_email}</strong>, but you're
                logged in as <strong>{currentUser.email}</strong>. Please
                log in with the invited account to respond.
              </div>

              <a
                href={`/login?redirect=${encodeURIComponent(
                  `/judge/invite/${token}`
                )}`}
                className="block w-full rounded-xl bg-violet-600 py-3 text-center font-semibold text-white transition hover:bg-violet-700"
              >
                Log In With a Different Account
              </a>
            </div>
          )}

          {/* READY TO ACCEPT/DECLINE */}
          {view === "ready" && (
            <div className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => respond("accept")}
                  disabled={responding}
                  className="flex-1 rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {responding ? "Please wait..." : "Accept"}
                </button>

                <button
                  type="button"
                  onClick={() => respond("decline")}
                  disabled={responding}
                  className="flex-1 rounded-xl border border-red-200 bg-red-50 py-3 font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* RESPONDED */}
          {view === "responded_accept" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <p className="font-semibold text-emerald-800">
                You've accepted this invitation!
              </p>
              <button
                type="button"
                onClick={() => router.push("/judge")}
                className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Go to Judge Dashboard
              </button>
            </div>
          )}

          {view === "responded_decline" && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center text-gray-600">
              You've declined this invitation.
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
