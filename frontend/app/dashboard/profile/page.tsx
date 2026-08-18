"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  getProfile,
  updateProfile,
  ProfileData,
  ProfileUpdatePayload,
} from "@/services/profile";

const AVAILABLE_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "AI/ML Engineer",
  "Data Scientist",
  "UI/UX Designer",
  "Cloud/DevOps",
  "Cybersecurity",
  "Product/Management",
];

function buildForm(data: ProfileData): ProfileUpdatePayload {
  return {
    full_name: data.full_name || "",
    username: data.username || "",
    college: data.college || "",
    course: data.course || "",
    year: data.year || 1,
    bio: data.bio || "",
    github_url: data.github_url || "",
    linkedin_url: data.linkedin_url || "",
    portfolio_url: data.portfolio_url || "",
    skills: data.skills || [],
    preferred_roles: data.preferred_roles || [],
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [form, setForm] = useState<ProfileUpdatePayload>({
    full_name: "",
    username: "",
    college: "",
    course: "",
    year: 1,
    bio: "",
    github_url: "",
    linkedin_url: "",
    portfolio_url: "",
    skills: [],
    preferred_roles: [],
  });

  const [skillInput, setSkillInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const data = await getProfile();

      setProfile(data);
      setForm(buildForm(data));
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError("Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "year" ? Number(value) : value,
    }));
  }

  function addSkill() {
    const skill = skillInput.trim();

    if (!skill) return;

    if (form.skills.includes(skill)) {
      setSkillInput("");
      return;
    }

    setForm((previous) => ({
      ...previous,
      skills: [...previous.skills, skill],
    }));

    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setForm((previous) => ({
      ...previous,
      skills: previous.skills.filter((item) => item !== skill),
    }));
  }

  function toggleRole(role: string) {
    setForm((previous) => {
      const selected = previous.preferred_roles.includes(role);

      return {
        ...previous,
        preferred_roles: selected
          ? previous.preferred_roles.filter((item) => item !== role)
          : [...previous.preferred_roles, role],
      };
    });
  }

  function startEditing() {
    if (!profile) return;

    setForm(buildForm(profile));
    setMessage("");
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    if (!profile) return;

    setForm(buildForm(profile));
    setSkillInput("");
    setMessage("");
    setError("");
    setEditing(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const updated = await updateProfile(form);

      setProfile(updated);
      setForm(buildForm(updated));

      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err: any) {
      console.error("Failed to update profile:", err);

      const detail =
        err?.response?.data?.detail ||
        "Unable to update your profile.";

      setError(detail);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-700">
          Unable to load profile
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error || "Please try again."}
        </p>

        <button
          onClick={loadProfile}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">

      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            My Profile
          </h1>

          <p className="mt-2 text-gray-500">
            Manage your profile, skills and preferred roles.
          </p>
        </div>

        {!editing && (
          <button
            onClick={startEditing}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PROFILE SUMMARY */}
      {!editing && (
        <>
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
                {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.full_name}
                </h2>

                <p className="mt-1 text-gray-500">
                  @{profile.username}
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  {profile.course} • Year {profile.year}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {profile.college}
                </p>
              </div>
            </div>
          </section>

          {/* ABOUT */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              About Me
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              {profile.bio || "No bio added yet."}
            </p>
          </section>

          {/* PROFESSIONAL LINKS */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              Professional Links
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-3">

              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border p-4 transition hover:border-blue-400 hover:bg-blue-50"
                >
                  <p className="font-semibold">GitHub</p>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {profile.github_url}
                  </p>
                </a>
              )}

              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border p-4 transition hover:border-blue-400 hover:bg-blue-50"
                >
                  <p className="font-semibold">LinkedIn</p>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {profile.linkedin_url}
                  </p>
                </a>
              )}

              {profile.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border p-4 transition hover:border-blue-400 hover:bg-blue-50"
                >
                  <p className="font-semibold">Portfolio</p>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {profile.portfolio_url}
                  </p>
                </a>
              )}

              {!profile.github_url &&
                !profile.linkedin_url &&
                !profile.portfolio_url && (
                  <p className="text-sm text-gray-400">
                    No professional links added yet.
                  </p>
                )}
            </div>
          </section>

          {/* SKILLS */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              Skills
            </h2>

            <div className="mt-5 flex flex-wrap gap-2">
              {profile.skills?.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
                >
                  {skill}
                </span>
              ))}

              {(!profile.skills ||
                profile.skills.length === 0) && (
                <p className="text-sm text-gray-400">
                  No skills added yet.
                </p>
              )}
            </div>
          </section>

          {/* PREFERRED ROLES */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              Preferred Roles
            </h2>

            <div className="mt-5 flex flex-wrap gap-2">
              {profile.preferred_roles?.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700"
                >
                  {role}
                </span>
              ))}

              {(!profile.preferred_roles ||
                profile.preferred_roles.length === 0) && (
                <p className="text-sm text-gray-400">
                  No preferred roles selected yet.
                </p>
              )}
            </div>
          </section>
        </>
      )}

      {/* EDIT FORM */}
      {editing && (
        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >

          {/* BASIC INFORMATION */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              Basic Information
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full Name
                </label>

                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Username
                </label>

                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email
                </label>

                <input
                  value={profile.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border bg-gray-100 px-4 py-3 text-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  College
                </label>

                <input
                  name="college"
                  value={form.college}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Course
                </label>

                <input
                  name="course"
                  value={form.course}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Year
                </label>

                <select
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                  <option value={5}>5th Year</option>
                  <option value={6}>6th Year</option>
                </select>
              </div>
            </div>
          </section>

          {/* BIO */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              About Me
            </h2>

            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={5}
              maxLength={1000}
              className="mt-5 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
            />

            <div className="mt-2 text-right text-xs text-gray-400">
              {form.bio.length}/1000
            </div>
          </section>

          {/* LINKS */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Professional Links
            </h2>

            <div className="mt-6 space-y-5">

              <input
                name="github_url"
                value={form.github_url}
                onChange={handleChange}
                placeholder="GitHub URL"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                name="linkedin_url"
                value={form.linkedin_url}
                onChange={handleChange}
                placeholder="LinkedIn URL"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                name="portfolio_url"
                value={form.portfolio_url}
                onChange={handleChange}
                placeholder="Portfolio URL"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </section>

          {/* SKILLS */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Skills
            </h2>

            <div className="mt-5 flex gap-3">

              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Example: Python"
                className="flex-1 rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />

              <button
                type="button"
                onClick={addSkill}
                className="rounded-xl bg-gray-900 px-5 py-3 font-medium text-white"
              >
                Add
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {form.skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-700"
                >
                  {skill}

                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="font-bold text-blue-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>

          {/* ROLES */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Preferred Roles
            </h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {AVAILABLE_ROLES.map((role) => {
                const selected =
                  form.preferred_roles.includes(role);

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-medium ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {selected ? "✓ " : ""}
                    {role}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={cancelEditing}
              className="rounded-xl border px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>
        </form>
      )}
    </div>
  );
}