"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Trophy,
  MapPin,
  Users,
  Globe,
} from "lucide-react";

import { createOrganizerHackathon } from "@/services/organizer";

export default function CreateHackathonPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    mode: "Online",
    location: "",
    team_size: "4",
    difficulty: "Intermediate",
    prize_pool: "",
    registration_deadline: "",
    start_date: "",
    end_date: "",
    banner_image: "",
    website: "",
  });

  const updateField = (
    field: string,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const created =
        await createOrganizerHackathon({
          title: form.title,
          description: form.description,
          mode: form.mode,
          location: form.location,
          team_size: Number(form.team_size),
          difficulty: form.difficulty,
          prize_pool: form.prize_pool,
          registration_deadline:
            form.registration_deadline,
          start_date: form.start_date,
          end_date: form.end_date,
          banner_image: form.banner_image,
          website: form.website,
        });

      router.push(
        `/organizer/hackathons/${created.id}`
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ??
          "Unable to create hackathon."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <button
            onClick={() =>
              router.push("/organizer")
            }
            className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-violet-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Organizer Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Create Hackathon
          </h1>

          <p className="mt-1 text-gray-500">
            Configure your event and publish it for
            participants.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Basic */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-violet-100 p-3">
                <Trophy className="h-5 w-5 text-violet-600" />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Basic Information
                </h2>

                <p className="text-sm text-gray-500">
                  Tell participants what your hackathon is
                  about.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Hackathon Title *
                </label>

                <input
                  required
                  value={form.title}
                  onChange={(e) =>
                    updateField(
                      "title",
                      e.target.value
                    )
                  }
                  placeholder="AI Innovation Challenge 2026"
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Description *
                </label>

                <textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={(e) =>
                    updateField(
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="Describe the problem, theme and goals..."
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </section>

          {/* Event */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Event Details
                </h2>

                <p className="text-sm text-gray-500">
                  Configure how the event will be conducted.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Mode
                </label>

                <select
                  value={form.mode}
                  onChange={(e) =>
                    updateField(
                      "mode",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3"
                >
                  <option>Online</option>
                  <option>Offline</option>
                  <option>Hybrid</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Location
                </label>

                <input
                  value={form.location}
                  onChange={(e) =>
                    updateField(
                      "location",
                      e.target.value
                    )
                  }
                  placeholder="Bengaluru / Virtual"
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Team Size
                </label>

                <div className="relative">
                  <Users className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />

                  <input
                    required
                    type="number"
                    min="2"
                    max="20"
                    value={form.team_size}
                    onChange={(e) =>
                      updateField(
                        "team_size",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border py-3 pl-11 pr-4"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Difficulty
                </label>

                <select
                  value={form.difficulty}
                  onChange={(e) =>
                    updateField(
                      "difficulty",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Prize Pool
                </label>

                <input
                  value={form.prize_pool}
                  onChange={(e) =>
                    updateField(
                      "prize_pool",
                      e.target.value
                    )
                  }
                  placeholder="₹1,00,000"
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Website
                </label>

                <div className="relative">
                  <Globe className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />

                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) =>
                      updateField(
                        "website",
                        e.target.value
                      )
                    }
                    placeholder="https://example.com"
                    className="w-full rounded-xl border py-3 pl-11 pr-4"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Dates */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-green-100 p-3">
                <CalendarDays className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Schedule
                </h2>

                <p className="text-sm text-gray-500">
                  Set registration and event dates.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Registration Deadline *
                </label>

                <input
                  required
                  type="date"
                  value={
                    form.registration_deadline
                  }
                  onChange={(e) =>
                    updateField(
                      "registration_deadline",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Start Date *
                </label>

                <input
                  required
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    updateField(
                      "start_date",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  End Date *
                </label>

                <input
                  required
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    updateField(
                      "end_date",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                router.push("/organizer")
              }
              className="rounded-xl border bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              type="submit"
              className="rounded-xl bg-violet-600 px-7 py-3 font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : "Create Hackathon"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}