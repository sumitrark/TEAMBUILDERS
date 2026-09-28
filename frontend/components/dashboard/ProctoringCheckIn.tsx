"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

import {
  getMyProctoringStatus,
  submitProctoringEvent,
} from "@/services/proctoring";
import { getFaceReferencePhoto } from "@/services/profile";
import {
  getIdentityVerification,
  startIdentityVerification,
} from "@/services/identityVerification";
import {
  compareVideoFace,
  getReferenceEmbedding,
} from "@/services/faceMatching";

interface ProctoringCheckInProps {
  hackathonId: string;
}

type FaceMatchStatus =
  | "MATCH"
  | "MISMATCH"
  | "NO_FACE"
  | "MULTIPLE_FACES"
  | "UNAVAILABLE"
  | null;

type IdentityStatus =
  | "PENDING"
  | "VERIFIED"
  | "FAILED"
  | "EXPIRED";

const SNAPSHOT_MAX_DIMENSION = 240;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export default function ProctoringCheckIn({
  hackathonId,
}: ProctoringCheckInProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const referenceEmbeddingRef = useRef<number[] | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [referenceReady, setReferenceReady] = useState(false);
  const [identityStatus, setIdentityStatus] =
    useState<IdentityStatus>("PENDING");
  const [identityLoading, setIdentityLoading] = useState(true);

  const [status, setStatus] = useState({
    strike_count: 0,
    strike_threshold: 3,
    flagged_for_review: false,
  });

  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [faceMatchStatus, setFaceMatchStatus] =
    useState<FaceMatchStatus>(null);
  const [faceSimilarity, setFaceSimilarity] = useState<number | null>(null);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadInitialState() {
      try {
        const [proctoringStatus, reference, verification] =
          await Promise.all([
            getMyProctoringStatus(hackathonId),
            getFaceReferencePhoto(),
            getIdentityVerification(hackathonId),
          ]);

        if (!mounted) return;

        setStatus(proctoringStatus);
        setIdentityStatus(verification.status);

        if (verification.status !== "VERIFIED") {
          try {
            const verified = await startIdentityVerification(hackathonId);

            if (!mounted) return;

            setIdentityStatus(verified.status);

            if (verified.status !== "VERIFIED") {
              setCameraError(
                "Identity verification could not be completed. Please try again."
              );
              return;
            }
          } catch (error) {
            console.error("Identity verification failed", error);

            if (mounted) {
              setCameraError(
                "Identity verification could not be completed. Please try again."
              );
            }

            return;
          }
        }

        if (!reference?.photo_data_url) {
          setCameraError(
            "Upload a Face Reference Photo in About Me before starting proctoring."
          );
          return;
        }

        try {
          const embedding = await getReferenceEmbedding(
            reference.photo_data_url
          );

          if (!mounted) return;

          if (!embedding) {
            setCameraError(
              "The Face Reference Photo could not be processed. Please upload a clear photo with one visible face."
            );
            return;
          }

          referenceEmbeddingRef.current = embedding;
          setReferenceReady(true);
        } catch {
          if (mounted) {
            setCameraError(
              "Face matching could not be initialized in this browser."
            );
          }
        }
      } catch (error) {
        console.error("Failed to load proctoring state", error);

        if (mounted) {
          setCameraError(
            "Unable to load proctoring and identity status. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setIdentityLoading(false);
        }
      }
    }

    loadInitialState();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [hackathonId, stopCamera]);

  const captureAndSubmit = useCallback(
    async (eventType: "check_in" | "periodic_snapshot") => {
      const video = videoRef.current;

      if (
        !video ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !referenceEmbeddingRef.current
      ) {
        return;
      }

      setSubmitting(true);

      try {
        const result = await compareVideoFace(
          video,
          referenceEmbeddingRef.current
        );

        setFaceMatchStatus(result.status);
        setFaceSimilarity(result.similarity);

        const canvas = document.createElement("canvas");

        const sourceWidth = video.videoWidth || 640;
        const sourceHeight = video.videoHeight || 480;

        const scale = Math.min(
          SNAPSHOT_MAX_DIMENSION / sourceWidth,
          SNAPSHOT_MAX_DIMENSION / sourceHeight,
          1
        );

        canvas.width = Math.max(1, Math.round(sourceWidth * scale));
        canvas.height = Math.max(1, Math.round(sourceHeight * scale));

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Unable to capture camera snapshot.");
        }

        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const snapshotDataUrl = canvas.toDataURL("image/jpeg", 0.5);

        const response = await submitProctoringEvent(
          hackathonId,
          eventType,
          result.faceDetected,
          snapshotDataUrl,
          result.status,
          result.similarity
        );

        setStatus((current) => ({
          ...current,
          strike_count: response.strike_count,
          flagged_for_review:
            current.flagged_for_review ||
            response.newly_flagged_for_review,
        }));

        if (result.status === "MATCH") {
          setLastMessage(
            result.similarity !== null
              ? `Face match recorded (${Math.round(
                  result.similarity * 100
                )}%).`
              : "Face match recorded."
          );
        } else if (result.status === "MISMATCH") {
          setLastMessage(
            "Face did not match the reference photo. This has been logged for review."
          );
        } else if (result.status === "NO_FACE") {
          setLastMessage("No face detected. This has been logged.");
        } else if (result.status === "MULTIPLE_FACES") {
          setLastMessage(
            "Multiple faces detected. This has been logged for review."
          );
        } else {
          setLastMessage(
            "Face matching was unavailable. The camera check was logged."
          );
        }
      } catch (error) {
        console.error("Proctoring check failed", error);
        setLastMessage(
          "The proctoring check could not be completed. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [hackathonId]
  );

  const startCamera = useCallback(async () => {
    if (identityStatus !== "VERIFIED") {
      setCameraError(
        "Complete identity verification before starting the camera check."
      );
      return;
    }

    if (!referenceReady) {
      setCameraError(
        "Upload and save a Face Reference Photo before starting proctoring."
      );
      return;
    }

    setCameraError(null);
    setLastMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setCameraOn(true);

      await new Promise((resolve) => setTimeout(resolve, 800));

      await captureAndSubmit("check_in");

      intervalRef.current = setInterval(() => {
        void captureAndSubmit("periodic_snapshot");
      }, CHECK_INTERVAL_MS);
    } catch (error) {
      console.error("Camera access failed", error);

      stopCamera();

      setCameraError(
        "Camera access was unavailable. Please allow camera access and try again."
      );
    }
  }, [
    captureAndSubmit,
    identityStatus,
    referenceReady,
    stopCamera,
  ]);

  const getMatchMessage = () => {
    switch (faceMatchStatus) {
      case "MATCH":
        return "Reference match detected.";
      case "MISMATCH":
        return "Reference mismatch logged for review.";
      case "NO_FACE":
        return "No face detected.";
      case "MULTIPLE_FACES":
        return "Multiple faces detected.";
      case "UNAVAILABLE":
        return "Face matching unavailable.";
      default:
        return "No face match recorded yet.";
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Camera className="h-5 w-5" />
            Proctoring Check-In
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Camera checks use your saved reference photo as a project-level
            matching signal. They are not legal identity verification.
          </p>
        </div>

        {cameraOn ? (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Camera active
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Camera off
          </span>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 p-3">
        <div className="text-xs font-medium uppercase text-gray-500">
          Identity verification
        </div>

        <div className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-900">
          {identityStatus === "VERIFIED" ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-amber-600" />
          )}

          {identityLoading
            ? "Checking verification..."
            : identityStatus === "VERIFIED"
              ? "Verified"
              : identityStatus}
        </div>

        <p className="mt-1 text-xs text-gray-500">
          Development mode uses the project's mock verification provider.
        </p>
      </div>

      {cameraError && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-xl bg-gray-900">
        <video
          ref={videoRef}
          className="aspect-video w-full object-cover"
          muted
          playsInline
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-3">
          <div className="text-xs font-medium uppercase text-gray-500">
            Face signal
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-900">
            {faceMatchStatus === "MATCH" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : faceMatchStatus ? (
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            ) : null}

            {getMatchMessage()}
          </div>

          {faceSimilarity !== null && (
            <div className="mt-1 text-xs text-gray-500">
              Similarity signal: {Math.round(faceSimilarity * 100)}%
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 p-3">
          <div className="text-xs font-medium uppercase text-gray-500">
            Review status
          </div>

          <div className="mt-1 text-sm font-medium text-gray-900">
            {status.flagged_for_review
              ? "Flagged for human review"
              : "No review flag"}
          </div>

          <div className="mt-1 text-xs text-gray-500">
            Strikes: {status.strike_count} / {status.strike_threshold}
          </div>
        </div>
      </div>

      {lastMessage && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          {lastMessage}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {!cameraOn ? (
          <button
            type="button"
            onClick={() => void startCamera()}
            disabled={
              identityLoading ||
              identityStatus !== "VERIFIED" ||
              !referenceReady ||
              submitting
            }
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start camera check
          </button>
        ) : (
          <button
            type="button"
            onClick={stopCamera}
            disabled={submitting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            Stop camera
          </button>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-gray-500">
        The browser performs the face comparison locally. Periodic snapshots
        are submitted as review signals. A mismatch does not automatically
        disqualify a participant.
      </p>
    </section>
  );
}
