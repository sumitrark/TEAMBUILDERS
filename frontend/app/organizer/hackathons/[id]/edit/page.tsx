"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getOrganizerHackathon,
  updateOrganizerHackathon,
  Hackathon,
} from "@/services/organizerHackathon";

export default function EditHackathonPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState<Partial<Hackathon>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getOrganizerHackathon(
          id as string
        );

        setForm(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  function change(
    field: string,
    value: string | number
  ) {
    setForm((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);

      await updateOrganizerHackathon(
        id as string,
        form
      );

      alert("Hackathon updated successfully.");

      router.push(
        `/organizer/hackathons/${id}`
      );
    } catch (error: any) {
      alert(
        error?.response?.data?.detail ??
          "Failed to update hackathon"
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
              value={form.title ?? ""}
              onChange={(e) =>
                change("title", e.target.value)
              }
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label>Description</label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) =>
                change("description", e.target.value)
              }
              rows={5}
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Organizer</label>
            <input
              value={form.organizer ?? ""}
              onChange={(e) =>
                change("organizer", e.target.value)
              }
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Mode</label>
            <input
              value={form.mode ?? ""}
              onChange={(e) =>
                change("mode", e.target.value)
              }
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Location</label>
            <input
              value={form.location ?? ""}
              onChange={(e) =>
                change("location", e.target.value)
              }
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Team Size</label>
            <input
              type="number"
              value={form.team_size ?? ""}
              onChange={(e) =>
                change(
                  "team_size",
                  Number(e.target.value)
                )
              }
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Difficulty</label>
            <input
              value={form.difficulty ?? ""}
              onChange={(e) =>
                change("difficulty", e.target.value)
              }
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Prize Pool</label>
            <input
              value={form.prize_pool ?? ""}
              onChange={(e) =>
                change("prize_pool", e.target.value)
              }
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Registration Deadline</label>
            <input
              type="date"
              value={
                form.registration_deadline ?? ""
              }
              onChange={(e) =>
                change(
                  "registration_deadline",
                  e.target.value
                )
              }
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Start Date</label>
            <input
              type="date"
              value={form.start_date ?? ""}
              onChange={(e) =>
                change("start_date", e.target.value)
              }
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>End Date</label>
            <input
              type="date"
              value={form.end_date ?? ""}
              onChange={(e) =>
                change("end_date", e.target.value)
              }
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label>Website</label>
            <input
              value={form.website ?? ""}
              onChange={(e) =>
                change("website", e.target.value)
              }
              className="mt-1 w-full rounded-xl border p-3"
            />
          </div>

          <div className="md:col-span-2 flex gap-3">

            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border px-6 py-3"
            >
              Cancel
            </button>

            <button
              disabled={saving}
              className="rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}