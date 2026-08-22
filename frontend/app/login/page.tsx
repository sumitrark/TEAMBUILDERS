"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = await login(form);

      /*
       * login() already stores the JWT tokens.
       *
       * Backend also returns:
       * data.user.role
       */

      const role = data.user?.role?.toLowerCase();

      console.log("Authenticated user:", data.user);
      console.log("User role:", role);

      if (role === "organizer") {
        router.push("/organizer");
        return;
      }

      if (role === "judge") {
        router.push("/judge");
        return;
      }

      // Default role = student
      router.push("/dashboard");

    } catch (err: any) {
      console.error("Login failed:", err);

      alert(
        err?.response?.data?.detail ??
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-white to-blue-100">

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">

        <div className="text-center mb-8">

          <p className="text-sm font-semibold tracking-widest text-violet-600">
            TEAMBUILDERS AI
          </p>

          <h1 className="text-3xl font-bold text-gray-800 mt-2">
            Welcome Back
          </h1>

          <p className="text-gray-500 mt-2">
            Login to your TEAMBUILDERS account
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl py-3 font-semibold transition"
          >
            {loading ? "Signing In..." : "Login"}
          </button>

        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          Don't have an account?{" "}

          <a
            href="/register"
            className="text-violet-600 font-semibold hover:underline"
          >
            Register
          </a>
        </p>

      </div>

    </div>
  );
}