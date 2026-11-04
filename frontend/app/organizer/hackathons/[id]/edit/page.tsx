
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  getOrganizerHackathon,
  updateOrganizerHackathon,
  Hackathon,
} from "@/services/organizerHackathon";

interface EditForm extends Partial<Hackathon> {
  start_time: string;
  end_time: string;
}

function getISTParts(value?: string | null) {
  if (!value) {
    return { date: "", time: "" };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { date: "", time: "" };
  }

  // Convert timestamp to IST for the date/time inputs.
  const ist = new Date(date.getTime() + 330 * 60 * 1000);

  return {
    date: ist.toISOString().slice(0, 10),
    time: ist.toISOString().slice(11, 16),
  };
}

function toISTTimestamp(date: string, time: string) {
  return `${date}T${time}:00+05:30`;
}

export default function EditHackathonPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState<EditForm>({
    start_time: "",
    end_time: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getOrganizerHackathon(id as string);

        const start = getISTParts(data.hackathon_start);
        const end = getISTParts(data.hackathon_end);

        setForm({
          ...data,
          start_date: start.date || data.start_date,
          end_date: end.date || data.end_date,
          start_time: start.time,
          end_time: end.time,
        });
      } catch (error) {
        console.error("Failed to load hackathon:", error);
        alert("Failed to load hackathon details.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  function change(field: string, value: string | number) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (
      !form.start_date ||
      !form.end_date ||
      !form.start_time ||
      !form.end_time
    ) {
      alert("Please enter both hackathon dates and times.");
      return;
    }

    const hackathonStart = toISTTimestamp(
      form.start_date,
      form.start_time
    );

    const hackathonEnd = toISTTimestamp(
      form.end_date,
      form.end_time
    );

    if (new Date(hackathonStart) >= new Date(hackathonEnd)) {
      alert("Hackathon end must be after hackathon start.");
      return;
    }

    try {
      setSaving(true);

      const {
        start_time,
        end_time,
        hackathon_start,
        hackathon_end,
        organizer,
        ...otherFields
      } = form;

      await updateOrganizerHackathon(id as string, {
        ...otherFields,
        hackathon_start: hackathonStart,
        hackathon_end: hackathonEnd,
      });

      alert("Hackathon updated successfully.");

      router.push(`/organizer/hackathons/${id}`);
    } catch (error: any) {
      console.error("Update failed:", error);

      alert(
        error?.response?.data?.detail ??
          "Failed to update hackathon."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-8">
        <h1 className="text-2xl font-bold">
          Edit Hackathon
        </h1>

        <form
          onSubmit={save}
          className="mt-8 grid gap-5 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label>Title</label>
            <input
              required
              value={form.title ?? ""}
              onChange={(e) => change("title", e.target.value)}
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label>Description</label>
            <textarea
              required
              value={form.description ?? ""}
              onChange={(e) => change("description", e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Mode</label>
            <input
              value={form.mode ?? ""}
              onChange={(e) => change("mode", e.target.value)}
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Location</label>
            <input
              value={form.location ?? ""}
              onChange={(e) => change("location", e.target.value)}
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Team Size</label>
            <input
              type="number"
              min={2}
              max={20}
              value={form.team_size ?? ""}
              onChange={(e) =>
                change("team_size", Number(e.target.value))
              }
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Difficulty</label>
            <input
              value={form.difficulty ?? ""}
              onChange={(e) => change("difficulty", e.target.value)}
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Prize Pool</label>
            <input
              value={form.prize_pool ?? ""}
              onChange={(e) => change("prize_pool", e.target.value)}
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Registration Deadline</label>
            <input
              type="date"
              required
              value={form.registration_deadline ?? ""}
              onChange={(e) =>
                change("registration_deadline", e.target.value)
              }
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Hackathon Start Date</label>
            <input
              type="date"
              required
              value={form.start_date ?? ""}
              onChange={(e) => change("start_date", e.target.value)}
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Hackathon Start Time (IST)</label>
            <input
              type="time"
              required
              value={form.start_time}
              onChange={(e) => change("start_time", e.target.value)}
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Hackathon End Date</label>
            <input
              type="date"
              required
              value={form.end_date ?? ""}
              onChange={(e) => change("end_date", e.target.value)}
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Hackathon End Time (IST)</label>
            <input
              type="time"
              required
              value={form.end_time}
              onChange={(e) => change("end_time", e.target.value)}
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Website</label>
            <input
              type="url"
              value={form.website ?? ""}
              onChange={(e) => change("website", e.target.value)}
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label>Banner Image URL</label>
            <input
              value={form.banner_image ?? ""}
              onChange={(e) => change("banner_image", e.target.value)}
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <p className="md:col-span-2 text-xs text-gray-500">
            All hackathon times are interpreted as Indian Standard Time (IST).
          </p>

          <div className="md:col-span-2 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border px-6 py-3"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
