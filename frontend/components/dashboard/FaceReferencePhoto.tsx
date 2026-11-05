"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";

import {
  deleteFaceReferencePhoto,
  getFaceReferencePhoto,
  saveFaceReferencePhoto,
} from "@/services/profile";

const MAX_DIMENSION = 900;
const JPEG_QUALITY = 0.82;

export default function FaceReferencePhoto() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    getFaceReferencePhoto()
      .then((result) => {
        if (active) {
          setPhoto(result?.photo_data_url ?? null);
        }
      })
      .catch(() => {
        if (active) {
          setMessage("Unable to load your reference photo.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function resizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => reject(new Error("Unable to read image."));
      reader.onload = () => {
        const image = new Image();

        image.onerror = () => reject(new Error("Invalid image."));
        image.onload = () => {
          const scale = Math.min(
            1,
            MAX_DIMENSION / Math.max(image.width, image.height)
          );

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));

          const context = canvas.getContext("2d");

          if (!context) {
            reject(new Error("Unable to process image."));
            return;
          }

          context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );

          resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
        };

        image.src = String(reader.result);
      };

      reader.readAsDataURL(file);
    });
  }

  async function handleFile(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setMessage("Please choose an image smaller than 8 MB.");
      return;
    }

    try {
      setMessage("");
      const resized = await resizeImage(file);
      setPendingPhoto(resized);
    } catch {
      setMessage("Could not process that image.");
    }
  }

  async function handleSave() {
    if (!pendingPhoto) return;

    try {
      setSaving(true);
      setMessage("");

      const result = await saveFaceReferencePhoto(pendingPhoto);

      setPhoto(result.photo_data_url);
      setPendingPhoto(null);
      setMessage("Reference photo saved.");
    } catch (error: any) {
      setMessage(
        error?.response?.data?.detail ||
          "Could not save the reference photo."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setSaving(true);
      setMessage("");

      await deleteFaceReferencePhoto();

      setPhoto(null);
      setPendingPhoto(null);
      setMessage("Reference photo removed.");
    } catch {
      setMessage("Could not remove the reference photo.");
    } finally {
      setSaving(false);
    }
  }

  const displayedPhoto = pendingPhoto ?? photo;

  if (loading) {
    return (
      <div className="rounded-xl border p-5">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading reference photo...
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-slate-100 p-2">
          <Camera className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold">Face Reference Photo</h3>

          <p className="mt-1 text-sm text-slate-600">
            Upload a clear photo of yourself. During proctoring,
            your camera image can be compared with this reference.
          </p>

          <p className="mt-2 text-xs text-slate-500">
            This is a project-level face-match signal, not legal identity
            verification.
          </p>
        </div>
      </div>

      {displayedPhoto && (
        <div className="mt-4 flex items-center gap-4">
          <img
            src={displayedPhoto}
            alt="Face reference"
            className="h-28 w-28 rounded-xl object-cover ring-1 ring-slate-200"
          />

          {pendingPhoto && (
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <ImagePlus className="h-4 w-4" />
              Unsaved replacement
            </div>
          )}

          {!pendingPhoto && photo && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Reference photo saved
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={saving}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2">
            <ImagePlus className="h-4 w-4" />
            {photo ? "Choose New Photo" : "Upload Photo"}
          </span>
        </button>

        {pendingPhoto && (
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Reference"}
          </button>
        )}

        {photo && !pendingPhoto && (
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={saving}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Remove
            </span>
          </button>
        )}
      </div>

      {message && (
        <p className="mt-3 text-sm text-slate-600">
          {message}
        </p>
      )}
    </section>
  );
}
