"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { login } from "@/services/auth";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await login(form);
      const role = data.user?.role?.toLowerCase();

      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      if (role === "organizer") {
        router.push("/organizer");
        return;
      }

      if (role === "judge") {
        router.push("/judge");
        return;
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(
        err?.response?.data?.detail || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">

        {/* Brand panel */}
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-700 to-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative">
            <div className="mb-12 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-[0.25em]">
                  TEAMBUILDERS
                </p>
                <p className="text-xs text-white/60">Hackathon Platform</p>
              </div>
            </div>

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-violet-200">
              Build. Collaborate. Compete.
            </p>

            <h1 className="max-w-xl text-5xl font-black leading-[1.05]">
              Turn your ideas into something worth showcasing.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-white/70">
              Join hackathons, build with your team, submit projects,
              collaborate with creators and take your ideas from concept
              to working solution.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-3">
            <BrandStat icon={<Users />} label="Teams" />
            <BrandStat icon={<Sparkles />} label="Projects" />
            <BrandStat icon={<ShieldCheck />} label="Secure" />
          </div>
        </section>

        {/* Login panel */}
        <section className="flex items-center justify-center bg-white p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">

            <div className="mb-8 lg:hidden">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700">
                <Sparkles className="h-4 w-4" />
                TEAMBUILDERS
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-violet-600">
                Welcome back
              </p>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Continue building, collaborating and participating in
                your hackathons.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email address
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">
                NEW TO TEAMBUILDERS?
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Link
              href="/register"
              className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
            >
              Create an account
            </Link>

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              By continuing, you agree to use TEAMBUILDERS responsibly
              and follow the rules of each hackathon.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function BrandStat({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="mb-3 text-violet-200">
        {icon}
      </div>
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
