"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Smartphone, Loader2 } from "lucide-react";

import { getCurrentUser } from "@/services/auth";
import { sendOtp, verifyOtp } from "@/services/otp";

type Step = "loading" | "verified" | "enter_phone" | "enter_otp";

export default function PhoneVerification() {
  const [step, setStep] = useState<Step>("loading");

  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [resendCooldown, setResendCooldown] = useState(0);

  // =========================================================
  // LOAD CURRENT VERIFICATION STATUS
  // =========================================================

  useEffect(() => {
    async function load() {
      try {
        const user = await getCurrentUser();

        if (user.phone_verified) {
          setStep("verified");
        } else {
          if (user.mobile_number) {
            setMobileNumber(user.mobile_number);
          }
          setStep("enter_phone");
        }
      } catch (err) {
        console.error("Failed to load phone verification status:", err);
        setStep("enter_phone");
      }
    }

    load();
  }, []);

  // =========================================================
  // RESEND COUNTDOWN TIMER
  // =========================================================

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendCooldown((previous) => previous - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // =========================================================
  // SEND OTP
  // =========================================================

  async function handleSendOtp() {
    if (!mobileNumber.trim()) {
      setError("Enter a mobile number first.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setMessage("");

      const result = await sendOtp(mobileNumber.trim());

      setMessage(result.message || "OTP sent.");
      setResendCooldown(result.resend_available_in_seconds || 60);
      setOtp("");
      setStep("enter_otp");
    } catch (err: any) {
      console.error("Failed to send OTP:", err);

      setError(
        err?.response?.data?.detail ||
          "Failed to send OTP. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  // =========================================================
  // VERIFY OTP
  // =========================================================

  async function handleVerifyOtp() {
    if (!otp.trim()) {
      setError("Enter the OTP you received.");
      return;
    }

    try {
      setVerifying(true);
      setError("");
      setMessage("");

      await verifyOtp(otp.trim());

      setMessage("Mobile number verified successfully.");
      setStep("verified");
    } catch (err: any) {
      console.error("Failed to verify OTP:", err);

      setError(
        err?.response?.data?.detail ||
          "Incorrect or expired OTP. Please try again."
      );
    } finally {
      setVerifying(false);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (step === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking phone verification status...
      </div>
    );
  }

  // =========================================================
  // VERIFIED
  // =========================================================

  if (step === "verified") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <ShieldCheck className="h-5 w-5 text-emerald-600" />
        <div>
          <p className="font-semibold text-emerald-800">
            Mobile number verified
          </p>
          {mobileNumber && (
            <p className="text-sm text-emerald-600">{mobileNumber}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Smartphone className="h-5 w-5 text-violet-600" />
        <p className="font-semibold text-slate-800">
          Phone verification
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {step === "enter_phone" && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="+919876543210"
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sending}
            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send OTP"}
          </button>
        </div>
      )}

      {step === "enter_otp" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Enter the code sent to{" "}
            <span className="font-semibold text-slate-700">
              {mobileNumber}
            </span>
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              maxLength={8}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm tracking-widest outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={verifying}
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifying ? "Verifying..." : "Verify"}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("enter_phone");
                setError("");
                setMessage("");
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              Change number
            </button>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={resendCooldown > 0 || sending}
              className="font-semibold text-violet-600 hover:text-violet-800 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              {resendCooldown > 0
                ? `Resend OTP in ${resendCooldown}s`
                : "Resend OTP"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
