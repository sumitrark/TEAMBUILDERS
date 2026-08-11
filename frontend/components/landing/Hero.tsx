"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="flex min-h-[85vh] items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="mb-6 text-6xl font-bold">
          Welcome to
          <span className="text-blue-600"> TEAMBUILDERS</span>
        </h1>

        <p className="mx-auto mb-8 max-w-xl text-gray-600">
          AI Powered Unified Hackathon Platform
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white"
          >
            Get Started
          </Link>

          <Link
            href="/login"
            className="rounded-lg border px-6 py-3"
          >
            Login
          </Link>
        </div>
      </div>
    </section>
  );
}