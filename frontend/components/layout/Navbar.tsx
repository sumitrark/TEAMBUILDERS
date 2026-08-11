"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <h1 className="text-2xl font-bold text-blue-600">
          TEAMBUILDERS
        </h1>

        <div className="flex items-center gap-6">
          <Link href="/">Home</Link>

          <Link href="/login">
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}