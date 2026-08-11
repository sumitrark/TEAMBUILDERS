"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/services/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    college: "",
    course: "",
    year: "",
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

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      await register({
        ...form,
        year: Number(form.year),
      });

      alert("Registration Successful!");

      router.push("/login");

    } catch (err: any) {

      alert(
        err.response?.data?.detail ??
          "Registration Failed"
      );

    } finally {

      setLoading(false);

    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">

      <div className="bg-white shadow-xl rounded-xl w-full max-w-md p-8">

        <h1 className="text-3xl font-bold text-center mb-8">
          Create Account
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <input
            name="full_name"
            placeholder="Full Name"
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
            required
          />

          <input
            name="college"
            placeholder="College"
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
            required
          />

          <input
            name="course"
            placeholder="Course"
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
            required
          />

          <input
            name="year"
            type="number"
            placeholder="Year"
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
            required
          />

          <button
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-3 font-semibold"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

        </form>

      </div>

    </div>
  );
}