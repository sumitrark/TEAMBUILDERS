"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

import {
  submitProctoringEvent,
  getMyProctoringStatus,
} from "@/services/proctoring";

// The browser's built-in FaceDetector API has very limited, mostly
// experimental support (largely absent on desktop Safari/Firefox,
// and gated behind flags in some Chrome versions). We feature-detect
// it rather than assume it's there, and never claim to be doing
// "AI face verification" when we can't actually run it.
declare global {
  interface Window {
    FaceDetector?: new () => {
      detect: (source: CanvasImageSource) => Promise<unknown[]>;
    };
  }
}

const SNAPSHOT_MAX_DIMENSION = 240;
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function ProctoringCheckIn({
  hackathonId,
}: {
  hackathonId: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<InstanceType<
    NonNullable<typeof window.FaceDetector>
  > | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [detectionSupported, setDetectionSupported] = useState(false);
  const [status, setStatus] = useState<{
    strike_count: number;
    strike_threshold: number;
    flagged_for_review: boolean;
  } | null>(null);
  const [lastMessage, setLastMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.FaceDetector) {
      try {
        detectorRef.current = new window.FaceDetector();
        setDetectionSupported(true);
      } catch {
        setDetectionSupported(false);
      }
    }

    loadStatus();

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hackathonId]);

  useEffect(() => {
    if (!cameraOn) {
      return;
    }

    const interval = setInterval(() => {
      captureAndSubmit("periodic_snapshot");
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn]);

  async function loadStatus() {
    try {
      setStatus(await getMyProctoringStatus(hackathonId));
    } catch (err) {
      console.error("Failed to load proctoring status:", err);
    }
  }

  async function startCamera() {
    try {
      setCameraError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraOn(true);
    } catch (err) {
      console.error("Failed to access camera:", err);
      setCameraError(
        "Couldn't access your camera. Check your browser's camera " +
          "permission and try again."
      );
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function captureAndSubmit(
    eventType: "check_in" | "periodic_snapshot"
  ) {
    if (!videoRef.current) {
      return;
    }

    try {
      setSubmitting(true);

      const canvas = document.createElement("canvas");
      canvas.width = SNAPSHOT_MAX_DIMENSION;
      canvas.height = SNAPSHOT_MAX_DIMENSION;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(
        videoRef.current,
        0,
        0,
        SNAPSHOT_MAX_DIMENSION,
        SNAPSHOT_MAX_DIMENSION
      );

      const snapshotDataUrl = canvas.toDataURL("image/jpeg", 0.5);

      // Only claim a face-detection result when the browser actually
      // supports running it. Otherwise this is purely a "camera is
      // on and streaming" check-in, not a face-presence claim.
      let faceDetected = true;

      if (detectionSupported && detectorRef.current) {
        try {
          const faces = await detectorRef.current.detect(canvas);
          faceDetected = faces.length > 0;
        } catch {
          // Detection call failed at runtime despite being
          // "supported" - don't penalize the participant for a
          // browser API failure.
          faceDetected = true;
        }
      }

      const result = await submitProctoringEvent(
        hackathonId,
        eventType,
        faceDetected,
        snapshotDataUrl
      );

      setLastMessage(result.message);
      await loadStatus();
    } catch (err) {
      console.error("Failed to submit proctoring event:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
          <Camera className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">
            Presence Check-in
          </p>
          <p className="text-sm text-slate-500">
            Confirms you're present during this virtual hackathon.
          </p>
        </div>
      </div>

      {!detectionSupported && cameraOn && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Your browser doesn't support automatic face detection.
            Check-ins will confirm your camera is active, not your
            face specifically.
          </span>
        </div>
      )}

      {cameraError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {cameraError}
        </div>
      )}

      {status?.flagged_for_review && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            You've been flagged for organizer review after
            {" "}{status.strike_count} check-ins without a visible
            camera feed. This doesn't remove you - an organizer will
            review it.
          </span>
        </div>
      )}

      <div className="mb-4 overflow-hidden rounded-xl bg-slate-100">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-48 w-full object-cover ${
            cameraOn ? "block" : "hidden"
          }`}
        />

        {!cameraOn && (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            Camera is off
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        {status && (
          <p className="text-sm text-slate-500">
            {status.strike_count}/{status.strike_threshold} flags
          </p>
        )}

        {lastMessage && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {lastMessage}
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        {!cameraOn ? (
          <button
            type="button"
            onClick={startCamera}
            className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Turn On Camera
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => captureAndSubmit("check_in")}
              disabled={submitting}
              className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {submitting ? "Checking in..." : "Check In Now"}
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Turn Off
            </button>
          </>
        )}
      </div>
    </div>
  );
}
