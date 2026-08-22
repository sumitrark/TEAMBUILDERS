"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  createOrganizerHackathon,
} from "@/services/organizerHackathon";

export default function CreateHackathonPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    mode: "Online",
    location: "",
    team_size: 4,
    difficulty: "Intermediate",
    prize_pool: "",
    registration_deadline: "",
    start_date: "",
    end_date: "",
    banner_image: "",
    website: "",
  });

  function updateField(
    field: string,
    value: string | number
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      await createOrganizerHackathon({
        ...form,
        team_size: Number(form.team_size),
      });

      alert("Hackathon created successfully!");

      router.push("/organizer/hackathons");

    } catch (error: any) {
      console.error(
        "Failed to create hackathon:",
        error
      );

      alert(
        error?.response?.data?.detail ??
          "Failed to create hackathon"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="border-b bg-white px-8 py-5">
        <button
          onClick={() =>
            router.push("/organizer/hackathons")
          }
          className="mb-3 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Hackathons
        </button>

        <h1 className="text-2xl font-bold text-gray-900">
          Create Hackathon
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Configure your hackathon and publish it for participants.
        </p>
      </div>

      <div className="p-8">

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-4xl space-y-6"
        >

          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-lg font-semibold">
              Basic Information
            </h2>

            <div className="grid gap-5">

              <input
                value={form.title}
                onChange={(e) =>
                  updateField("title", e.target.value)
                }
                placeholder="Hackathon title"
                required
                className="rounded-xl border p-3 outline-none focus:ring-2 focus:ring-violet-500"
              />

              <textarea
                value={form.description}
                onChange={(e) =>
                  updateField(
                    "description",
                    e.target.value
                  )
                }
                placeholder="Describe your hackathon..."
                required
                rows={5}
                className="rounded-xl border p-3 outline-none focus:ring-2 focus:ring-violet-500"
              />

              <div className="grid gap-5 md:grid-cols-2">

                <select
                  value={form.mode}
                  onChange={(e) =>
                    updateField("mode", e.target.value)
                  }
                  className="rounded-xl border p-3"
                >
                  <option>Online</option>
                  <option>Offline</option>
                  <option>Hybrid</option>
                </select>

                <input
                  value={form.location}
                  onChange={(e) =>
                    updateField(
                      "location",
                      e.target.value
                    )
                  }
                  placeholder="Location / Platform"
                  required
                  className="rounded-xl border p-3"
                />

              </div>

            </div>

          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-lg font-semibold">
              Competition Details
            </h2>

            <div className="grid gap-5 md:grid-cols-3">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Team Size
                </label>

                <input
                  type="number"
                  min={2}
                  max={20}
                  value={form.team_size}
                  onChange={(e) =>
                    updateField(
                      "team_size",
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
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
                  className="w-full rounded-xl border p-3"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
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
                  required
                  className="w-full rounded-xl border p-3"
                />
              </div>

            </div>

          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-lg font-semibold">
              Schedule
            </h2>

            <div className="grid gap-5 md:grid-cols-3">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Registration Deadline
                </label>

                <input
                  type="date"
                  value={form.registration_deadline}
                  onChange={(e) =>
                    updateField(
                      "registration_deadline",
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Start Date
                </label>

                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    updateField(
                      "start_date",
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  End Date
                </label>

                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    updateField(
                      "end_date",
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border p-3"
                />
              </div>

            </div>

          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-lg font-semibold">
              Additional Information
            </h2>

            <div className="space-y-5">

              <input
                value={form.banner_image}
                onChange={(e) =>
                  updateField(
                    "banner_image",
                    e.target.value
                  )
                }
                placeholder="Banner image URL (optional)"
                className="w-full rounded-xl border p-3"
              />

              <input
                type="url"
                value={form.website}
                onChange={(e) =>
                  updateField(
                    "website",
                    e.target.value
                  )
                }
                placeholder="Official website URL (optional)"
                className="w-full rounded-xl border p-3"
              />

            </div>

          </section>

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={() =>
                router.push("/organizer/hackathons")
              }
              className="rounded-xl border px-6 py-3 font-semibold text-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-600 px-7 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : "Create Hackathon"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}