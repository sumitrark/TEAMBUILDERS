"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Camera, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

import {
  getFaceReferencePhoto,
} from "@/services/profile";
import {
  getIdentityVerification,
  startIdentityVerification,
} from "@/services/identityVerification";
import {
  getMyProctoringStatus,
  submitProctoringEvent,
  startProctoringSession,
  heartbeatProctoringSession,
  stopProctoringSession,
  type ProctoringSession,
} from "@/services/proctoring";
import {
  compareVideoFace,
  getReferenceEmbedding,
  type FaceMatchStatus,
} from "@/services/faceMatching";

const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const FACE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

interface Props {
  hackathonId: string;
}

export default function ProctoringCheckIn({
  hackathonId,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<ProctoringSession | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const faceCheckTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const stoppingRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [active, setActive] = useState(false);

  const [identityVerified, setIdentityVerified] = useState(false);
  const [referenceReady, setReferenceReady] = useState(false);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [message, setMessage] = useState(
    "Preparing proctoring..."
  );

  const [faceMatchStatus, setFaceMatchStatus] =
    useState<FaceMatchStatus | null>(null);

  const referenceEmbeddingRef = useRef<number[] | null>(null);

  const clearTimers = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }

    if (faceCheckTimerRef.current) {
      clearInterval(faceCheckTimerRef.current);
      faceCheckTimerRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const stopSession = useCallback(
    async (
      reason:
        | "CAMERA_STOPPED"
        | "PAGE_CLOSED"
        | "NAVIGATED_AWAY"
        | "ERROR"
        | "MANUAL"
    ) => {
      clearTimers();
      stopCamera();

      const session = sessionRef.current;

      if (!session || stoppingRef.current) {
        return;
      }

      stoppingRef.current = true;

      try {
        await stopProctoringSession(session.id, reason);
      } catch {
        // The session may already have been closed by the backend.
      } finally {
        sessionRef.current = null;
        setActive(false);
        stoppingRef.current = false;
      }
    },
    [clearTimers, stopCamera]
  );

  const captureFaceCheck = useCallback(async () => {
    const video = videoRef.current;
    const referenceEmbedding = referenceEmbeddingRef.current;

    if (!video || !referenceEmbedding || video.readyState < 2) {
      return;
    }

    try {
      const result = await compareVideoFace(
        video,
        referenceEmbedding
      );

      setFaceMatchStatus(result.status);

      let snapshotDataUrl: string | null = null;

      if (result.faceDetected) {
        const canvas = document.createElement("canvas");

        const maxDimension = 240;
        const scale =
          Math.min(
            maxDimension / video.videoWidth,
            maxDimension / video.videoHeight
          ) || 1;

        canvas.width = Math.max(
          1,
          Math.round(video.videoWidth * scale)
        );

        canvas.height = Math.max(
          1,
          Math.round(video.videoHeight * scale)
        );

        const context = canvas.getContext("2d");

        if (context) {
          context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
          );

          snapshotDataUrl = canvas.toDataURL(
            "image/jpeg",
            0.65
          );
        }
      }

      await submitProctoringEvent(
        hackathonId,
        "periodic_snapshot",
        result.faceDetected,
        snapshotDataUrl,
        result.status,
        result.similarity
      );
    } catch {
      // Face checks are monitoring signals.
      // A temporary browser/model failure should not break the workspace.
    }
  }, [hackathonId]);

  const startMonitoring = useCallback(async () => {
    if (starting || active) {
      return;
    }

    setStarting(true);
    setCameraError(null);

    try {
      const reference = await getFaceReferencePhoto();

      if (!reference?.photo_data_url) {
        setReferenceReady(false);
        setMessage(
          "A face reference photo is required before entering the monitored workspace."
        );
        return;
      }

      const identity = await getIdentityVerification(
        hackathonId
      );

      let verified = identity.status === "VERIFIED";

      if (!verified) {
        const started =
          await startIdentityVerification(hackathonId);

        verified = started.status === "VERIFIED";
      }

      if (!verified) {
        setIdentityVerified(false);
        setMessage(
          "Identity verification must be completed before proctoring can start."
        );
        return;
      }

      setIdentityVerified(true);

      const embedding = await getReferenceEmbedding(
        reference.photo_data_url
      );

      if (!embedding) {
        setReferenceReady(false);
        setMessage(
          "The face reference photo could not be prepared for monitoring."
        );
        return;
      }

      referenceEmbeddingRef.current = embedding;
      setReferenceReady(true);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera access is not supported by this browser."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        throw new Error("Camera preview is unavailable.");
      }

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      await video.play();

      const session =
        await startProctoringSession(hackathonId);

      sessionRef.current = session;
      stoppingRef.current = false;

      setActive(true);
      setMessage(
        "Proctoring active — camera monitoring is enabled."
      );

      // Initial face check.
      await captureFaceCheck();

      heartbeatTimerRef.current = setInterval(
        async () => {
          const currentSession = sessionRef.current;

          if (!currentSession) {
            return;
          }

          try {
            const updated =
              await heartbeatProctoringSession(
                currentSession.id
              );

            sessionRef.current = updated;
          } catch {
            // Keep the local monitoring session alive.
            // The next heartbeat can recover.
          }
        },
        HEARTBEAT_INTERVAL_MS
      );

      faceCheckTimerRef.current = setInterval(
        async () => {
          await captureFaceCheck();
        },
        FACE_CHECK_INTERVAL_MS
      );
    } catch (error) {
      stopCamera();

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to start camera monitoring.";

      setCameraError(errorMessage);
      setActive(false);
      setMessage(
        "Camera monitoring could not be started."
      );
    } finally {
      setStarting(false);
      setLoading(false);
    }
  }, [
    active,
    captureFaceCheck,
    hackathonId,
    startIdentityVerification,
    starting,
    stopCamera,
  ]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        setLoading(true);

        const [reference, identity] =
          await Promise.all([
            getFaceReferencePhoto(),
            getIdentityVerification(hackathonId),
          ]);

        if (cancelled) {
          return;
        }

        setReferenceReady(
          Boolean(reference?.photo_data_url)
        );

        setIdentityVerified(
          identity.status === "VERIFIED"
        );

        await startMonitoring();
      } catch {
        if (!cancelled) {
          setLoading(false);
          setMessage(
            "Unable to prepare proctoring. Please check your identity verification and face reference photo."
          );
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, [hackathonId, startMonitoring]);

  useEffect(() => {
    const handlePageHide = () => {
      const session = sessionRef.current;

      if (!session) {
        return;
      }

      // Best-effort cleanup. Browser lifecycle events do not
      // guarantee that an awaited request will finish.
      void stopProctoringSession(
        session.id,
        "PAGE_CLOSED"
      );

      sessionRef.current = null;
      clearTimers();
      stopCamera();
      setActive(false);
    };

    window.addEventListener(
      "pagehide",
      handlePageHide
    );

    return () => {
      window.removeEventListener(
        "pagehide",
        handlePageHide
      );

      clearTimers();
      stopCamera();
    };
  }, [clearTimers, stopCamera]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          <div>
            <p className="font-semibold text-slate-900">
              Preparing proctoring
            </p>
            <p className="text-sm text-slate-500">
              Checking identity and camera requirements...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              active
                ? "bg-emerald-100"
                : "bg-slate-100"
            }`}
          >
            {active ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <Camera className="h-5 w-5 text-slate-600" />
            )}
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Proctoring
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {message}
            </p>
          </div>
        </div>

        {active && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Active
          </span>
        )}
      </div>

      {cameraError && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />

          <div>
            <p className="font-medium">
              Camera monitoring unavailable
            </p>
            <p className="mt-1">
              {cameraError}
            </p>
          </div>
        </div>
      )}

      {!active && !starting && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          {identityVerified &&
          referenceReady
            ? "Camera monitoring will start automatically when the workspace is ready."
            : "Identity verification and a face reference photo are required before monitored participation."}
        </div>
      )}

      {starting && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Starting secure camera monitoring...
        </div>
      )}

      {/* Camera element remains hidden from the participant UI. */}
      <video
        ref={videoRef}
        className="hidden"
        autoPlay
        muted
        playsInline
      />
    </section>
  );
}
