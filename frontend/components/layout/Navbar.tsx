"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-violet-100 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-black text-white shadow-lg shadow-violet-200">
            T
          </div>

          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            TEAM<span className="text-violet-600">BUILDERS</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="hidden text-sm font-semibold text-slate-600 transition hover:text-violet-700 sm:block"
          >
            Home
          </Link>

          <Link
            href="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-300"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}