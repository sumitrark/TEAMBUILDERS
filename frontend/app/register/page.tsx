"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { register } from "@/services/auth";

type Role = "student" | "organizer";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("student");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",

    // Student
    college: "",
    course: "",
    year: "",

    // Organizer
    organization: "",
    designation: "",
    bio: "",
    linkedin_url: "",
    portfolio_url: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function selectRole(selectedRole: Role) {
    setRole(selectedRole);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);

    try {
      const payload =
        role === "student"
          ? {
              full_name: form.full_name,
              email: form.email,
              password: form.password,

              // IMPORTANT:
              // role is now explicitly typed as Role
              role: role,

              college: form.college,
              course: form.course,
              year: Number(form.year),
            }
          : {
              full_name: form.full_name,
              email: form.email,
              password: form.password,

              // IMPORTANT:
              // role is now explicitly typed as Role
              role: role,

              organization: form.organization,
              designation: form.designation,
              bio: form.bio || undefined,
              linkedin_url: form.linkedin_url || undefined,
              portfolio_url: form.portfolio_url || undefined,
            };

      await register(payload);

      alert(
        role === "student"
          ? "Participant account created successfully!"
          : "Organizer account created successfully!"
      );

      router.push("/login");
    } catch (err: any) {
      console.error("Registration failed:", err);

      alert(
        err?.response?.data?.detail ??
          "Registration failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-100 via-white to-blue-100 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-3xl bg-white p-8 shadow-2xl">

          {/* HEADER */}
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold tracking-widest text-violet-600">
              TEAMBUILDERS AI
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Create Your Account
            </h1>

            <p className="mt-2 text-gray-500">
              Join hackathons, build teams and create amazing projects.
            </p>
          </div>

          {/* ROLE SELECTION */}
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-gray-700">
              I am registering as
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* PARTICIPANT */}
              <button
                type="button"
                onClick={() => selectRole("student")}
                className={`rounded-2xl border-2 p-5 text-left transition ${
                  role === "student"
                    ? "border-violet-600 bg-violet-50"
                    : "border-gray-200 hover:border-violet-300"
                }`}
              >
                <div className="text-3xl">🎓</div>

                <h2 className="mt-2 text-lg font-bold text-gray-900">
                  Participant
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Join hackathons, create teams and submit projects.
                </p>
              </button>

              {/* ORGANIZER */}
              <button
                type="button"
                onClick={() => selectRole("organizer")}
                className={`rounded-2xl border-2 p-5 text-left transition ${
                  role === "organizer"
                    ? "border-violet-600 bg-violet-50"
                    : "border-gray-200 hover:border-violet-300"
                }`}
              >
                <div className="text-3xl">🏢</div>

                <h2 className="mt-2 text-lg font-bold text-gray-900">
                  Organizer
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Create and manage hackathons, teams, judges and projects.
                </p>
              </button>

            </div>
          </div>

          {/* REGISTRATION FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* FULL NAME */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full Name
              </label>

              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email Address
              </label>

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* STUDENT */}
            {role === "student" && (
              <div className="space-y-5 rounded-2xl bg-slate-50 p-5">

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Participant Information
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    These details help with team matching and hackathon
                    participation.
                  </p>
                </div>

                {/* COLLEGE */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    College / Institution
                  </label>

                  <input
                    name="college"
                    value={form.college}
                    onChange={handleChange}
                    placeholder="Your college"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* COURSE */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Course
                  </label>

                  <input
                    name="course"
                    value={form.course}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science and Engineering"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* YEAR */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Year
                  </label>

                  <input
                    name="year"
                    type="number"
                    min="1"
                    max="6"
                    value={form.year}
                    onChange={handleChange}
                    placeholder="e.g. 3"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

              </div>
            )}

            {/* ORGANIZER */}
            {role === "organizer" && (
              <div className="space-y-5 rounded-2xl bg-slate-50 p-5">

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Organizer Information
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Provide your professional or institutional information.
                  </p>
                </div>

                {/* ORGANIZATION */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Organization / Institution
                  </label>

                  <input
                    name="organization"
                    value={form.organization}
                    onChange={handleChange}
                    placeholder="e.g. ABC College"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* DESIGNATION */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Designation
                  </label>

                  <input
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    placeholder="e.g. Faculty Coordinator"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* BIO */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Bio
                  </label>

                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Tell participants about yourself..."
                    rows={3}
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* LINKEDIN */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    LinkedIn URL
                  </label>

                  <input
                    name="linkedin_url"
                    type="url"
                    value={form.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* PORTFOLIO */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Portfolio URL
                  </label>

                  <input
                    name="portfolio_url"
                    type="url"
                    value={form.portfolio_url}
                    onChange={handleChange}
                    placeholder="https://yourportfolio.com"
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

              </div>
            )}

            {/* PASSWORD */}
<div>
  <label className="mb-1 block text-sm font-medium text-gray-700">
    Password
  </label>

  <div className="relative">
    <input
      name="password"
      type={showPassword ? "text" : "password"}
      value={form.password}
      onChange={handleChange}
      placeholder="Minimum 8 characters"
      minLength={8}
      required
      className="w-full rounded-xl border border-gray-300 p-3 pr-12 outline-none focus:ring-2 focus:ring-violet-500"
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-violet-600"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? (
        <EyeOff size={20} />
      ) : (
        <Eye size={20} />
      )}
    </button>
  </div>

  <p className="mt-1 text-xs text-gray-500">
    Use at least 8 characters.
  </p>
</div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating Account..."
                : role === "student"
                ? "Create Participant Account"
                : "Create Organizer Account"}
            </button>

          </form>

          {/* LOGIN */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}

            <a
              href="/login"
              className="font-semibold text-violet-600 hover:underline"
            >
              Login
            </a>
          </p>

        </div>
      </div>
    </main>
  );
}