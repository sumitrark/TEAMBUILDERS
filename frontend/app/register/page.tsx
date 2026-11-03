"use client";

import { Suspense, useEffect, useState } from "react";
import { Eye, EyeOff, Gavel, Building2, Globe, Link2, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { register, registerAndLogin } from "@/services/auth";
import { api } from "@/lib/api";

type Role = "student" | "organizer";

function JudgeInvitationRegisterForm({
  invitationToken,
}: {
  invitationToken: string;
}) {
  const router = useRouter();

  // Invitation metadata loaded from the public API
  const [invitedEmail, setInvitedEmail] = useState("");
  const [hackathonTitle, setHackathonTitle] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [invitationError, setInvitationError] = useState("");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load invitation details on mount so we can pre-fill email
  // and show hackathon context.
  useEffect(() => {
    async function loadInvitation() {
      try {
        setLoadingInvitation(true);

        const response = await api.get(
          `/judge/invitations/token/${invitationToken}`
        );

        setInvitedEmail(response.data.invited_email);
        setHackathonTitle(response.data.hackathon_title);
        setOrganizerName(response.data.organizer_name);

        if (response.data.is_expired || response.data.status !== "pending") {
          setInvitationError(
            "This invitation is no longer valid. Please ask the " +
              "organizer for a new one."
          );
        }
      } catch {
        setInvitationError(
          "This invitation link is invalid or has expired."
        );
      } finally {
        setLoadingInvitation(false);
      }
    }

    loadInvitation();
  }, [invitationToken]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      // Register + auto-login in one step so the judge lands directly
      // on the invitation acceptance page without a separate login.
      await registerAndLogin({
        full_name: fullName.trim(),
        email: invitedEmail,
        password,
        role: "judge",
        invitation_token: invitationToken,
        bio: bio.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        portfolio_url: portfolioUrl.trim() || undefined,
      });

      // Navigate directly to the invitation acceptance page.
      // The judge is now logged in, so the page will show Accept/Decline.
      router.push(`/judge/invite/${invitationToken}`);
    } catch (err: any) {
      console.error("Judge registration failed:", err);
      setError(
        err?.response?.data?.detail ??
          "Registration failed. Please check your details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInvitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-amber-50">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
          Loading invitation…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50 px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-3xl bg-white shadow-2xl">

          {/* ── Header ────────────────────────────────────── */}
          <div className="rounded-t-3xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                <Gavel size={26} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-white/80">
                  Judge Invitation
                </p>
                <h1 className="mt-0.5 text-2xl font-bold">
                  Create Your Judge Account
                </h1>
              </div>
            </div>

            {(hackathonTitle || organizerName) && (
              <div className="mt-5 rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm">
                {hackathonTitle && (
                  <p className="font-semibold">
                    {hackathonTitle}
                  </p>
                )}
                {organizerName && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/80">
                    <Building2 size={13} />
                    Invited by {organizerName}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="px-8 py-8">

            {invitationError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="font-semibold text-red-800">Invitation Invalid</p>
                <p className="mt-1 text-sm text-red-700">{invitationError}</p>
                <a
                  href="/login"
                  className="mt-4 inline-block text-sm font-semibold text-violet-600 hover:underline"
                >
                  Go to Login →
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* ── Locked email banner ───────────────── */}
                <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Invited as
                    </p>
                    <p className="truncate text-sm font-bold text-amber-900">
                      {invitedEmail}
                    </p>
                  </div>
                </div>

                {/* ── Required fields ───────────────────── */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    required
                    minLength={2}
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      required
                      className="w-full rounded-xl border border-gray-300 p-3 pr-11 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      minLength={8}
                      required
                      className="w-full rounded-xl border border-gray-300 p-3 pr-11 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      Passwords do not match.
                    </p>
                  )}
                </div>

                {/* ── Optional profile fields ───────────── */}
                <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Professional Profile
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Optional — helps organisers and participants know who
                      is evaluating their work.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Briefly describe your background and expertise…"
                      rows={3}
                      maxLength={1000}
                      className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                    <p className="mt-0.5 text-right text-xs text-gray-400">
                      {bio.length}/1000
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      LinkedIn URL
                    </label>
                    <div className="relative">
                      <Link2
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/yourprofile"
                        className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Portfolio / Website URL
                    </label>
                    <div className="relative">
                      <Globe
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Error ─────────────────────────────── */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* ── Submit ────────────────────────────── */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 font-bold text-white transition hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Creating Account…" : "Create Judge Account & Continue"}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <a
                    href={`/login?redirect=${encodeURIComponent(
                      `/judge/invite/${invitationToken}`
                    )}`}
                    className="font-semibold text-violet-600 hover:underline"
                  >
                    Log in instead
                  </a>
                </p>

              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("invitation_token");

  if (invitationToken) {
    return (
      <JudgeInvitationRegisterForm invitationToken={invitationToken} />
    );
  }

  return <StandardRegisterForm />;
}

function StandardRegisterForm() {
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

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}