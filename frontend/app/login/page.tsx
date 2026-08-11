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

      // Login API
      const data = await login(form);

      // Save JWT Token
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      // Redirect to Dashboard
      router.push("/dashboard");
    } catch (err: any) {
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

        <h1 className="text-3xl font-bold text-center text-gray-800">
          Welcome Back
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-8">
          Login to your TEAMBUILDERS account
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-violet-500 outline-none"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-violet-500 outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3 font-semibold transition-all"
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