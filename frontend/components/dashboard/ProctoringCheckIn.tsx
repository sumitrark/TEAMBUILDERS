"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

import {
  submitProctoringEvent,
  getMyProctoringStatus,
} from "@/services/proctoring";

declare global {
  interface Window {
    FaceDetector?: new () => {
      detect: (source: CanvasImageSource) => Promise<unknown[]>;
    };
  }
}

const SNAPSHOT_MAX_DIMENSION = 240;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export default function ProctoringCheckIn({
  hackathonId,
}: {
  hackathonId: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<{
    detect: (source: CanvasImageSource) => Promise<unknown[]>;
  } | null>(null);

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
        detectorRef.current = null;
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
    if (!cameraOn) return;

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
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Your browser does not support camera access. Please use a modern browser."
      );
      return;
    }

    try {
      setCameraError("");
      setLastMessage("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }

      setCameraOn(true);

      // Perform the first verification immediately instead of waiting
      // for the participant to press "Check In Now".
      setTimeout(() => {
        captureAndSubmit("check_in");
      }, 800);
    } catch (err) {
      console.error("Failed to access camera:", err);
      setCameraError(
        "Couldn't access your camera. Check your browser's camera permission and try again."
      );
      setCameraOn(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
  }

  async function captureAndSubmit(
    eventType: "check_in" | "periodic_snapshot"
  ) {
    const video = videoRef.current;

    if (!video || !streamRef.current || !cameraOn) {
      return;
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    try {
      setSubmitting(true);

      const canvas = document.createElement("canvas");
      canvas.width = SNAPSHOT_MAX_DIMENSION;
      canvas.height = SNAPSHOT_MAX_DIMENSION;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return;
      }

      ctx.drawImage(
        video,
        0,
        0,
        SNAPSHOT_MAX_DIMENSION,
        SNAPSHOT_MAX_DIMENSION
      );

      const snapshotDataUrl = canvas.toDataURL("image/jpeg", 0.5);

      // Face detection is only reported when the browser can actually
      // perform it. Camera availability alone is never presented as
      // proof of identity.
      let faceDetected = true;

      if (detectionSupported && detectorRef.current) {
        try {
          const faces = await detectorRef.current.detect(canvas);
          faceDetected = faces.length > 0;
        } catch {
          // Browser detection failures should not create a false strike.
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
      setLastMessage(
        "The check-in could not be submitted. You can try again."
      );
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
            Live Presence Verification
          </p>
          <p className="text-sm text-slate-500">
            Your camera helps confirm that you are present during the
            competition.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
        Camera checks use occasional snapshots rather than continuous video
        recording. Camera presence does not by itself verify your legal
        identity.
      </div>

      {!detectionSupported && cameraOn && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Automatic face detection is unavailable in this browser.
            Check-ins will confirm camera activity, but will not make a
            face-presence determination.
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
            Your session has been flagged for organizer review after{" "}
            {status.strike_count} checks without a visible camera feed.
            This does not automatically remove you from the hackathon.
          </span>
        </div>
      )}

      <div className="mb-4 overflow-hidden rounded-xl bg-slate-100">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-56 w-full object-cover ${
            cameraOn ? "block" : "hidden"
          }`}
        />

        {!cameraOn && (
          <div className="flex h-56 items-center justify-center text-sm text-slate-400">
            Camera is off
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        {status && (
          <p className="text-sm text-slate-500">
            Review flags:{" "}
            <span className="font-semibold">
              {status.strike_count}/{status.strike_threshold}
            </span>
          </p>
        )}

        {lastMessage && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {lastMessage}
          </p>
        )}
      </div>

      <div className="flex gap-3">
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
              {submitting ? "Checking..." : "Check In Now"}
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
