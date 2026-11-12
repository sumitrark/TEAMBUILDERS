"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <main className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden bg-[#faf8ff]">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[30rem] w-[30rem] rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:px-10 lg:py-20">
        {/* Left: Main message */}
        <section className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            Connect · Collaborate · Create
          </div>

          <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Great ideas
            <br />
            deserve
            <br />
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              great teams.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
            Your next big achievement starts with the right people. Discover
            talented teammates, build meaningful connections, join exciting
            hackathons and turn your ideas into reality.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-4 font-bold text-white shadow-xl shadow-violet-200 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-300"
            >
              Get Started
              <span className="text-xl transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>

            <Link
              href="/login"
              className="rounded-2xl border border-violet-200 bg-white/80 px-7 py-4 font-bold text-slate-700 transition hover:border-violet-400 hover:bg-violet-50"
            >
              I already have an account
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-violet-100 pt-7">
            <div>
              <p className="text-2xl font-black text-violet-700">01</p>
              <p className="mt-1 text-sm text-slate-500">Find teammates</p>
            </div>

            <div className="h-10 w-px bg-violet-200" />

            <div>
              <p className="text-2xl font-black text-violet-700">02</p>
              <p className="mt-1 text-sm text-slate-500">Join hackathons</p>
            </div>

            <div className="h-10 w-px bg-violet-200" />

            <div>
              <p className="text-2xl font-black text-violet-700">03</p>
              <p className="mt-1 text-sm text-slate-500">Build together</p>
            </div>
          </div>
        </section>

        {/* Right: Collaboration preview */}
        <section
          aria-label="Team collaboration preview"
          className="relative mx-auto w-full max-w-lg"
        >
          <div className="absolute -right-5 -top-7 h-28 w-28 rounded-full border-[18px] border-violet-200/60" />
          <div className="absolute -bottom-8 -left-7 h-24 w-24 rounded-3xl bg-indigo-200/50 rotate-12" />

          <div className="relative rounded-[2rem] border border-white bg-white/80 p-5 shadow-2xl shadow-violet-200/70 backdrop-blur-xl sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-violet-600">
                  YOUR NEXT BIG IDEA
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Build it together.
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-2xl">
                ✦
              </div>
            </div>

            <div className="mt-7 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white">
              <p className="text-sm font-medium text-violet-100">
                TEAM PROJECT
              </p>
              <h3 className="mt-2 text-2xl font-bold">
                Ideas become reality
              </h3>
              <p className="mt-2 text-sm leading-6 text-violet-100">
                Bring different skills and perspectives together to create
                something meaningful.
              </p>

              <div className="mt-7 flex items-center justify-between">
                <div className="flex -space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-violet-600 bg-amber-200 text-sm font-bold text-amber-900">
                    A
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-violet-600 bg-pink-200 text-sm font-bold text-pink-900">
                    R
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-violet-600 bg-cyan-200 text-sm font-bold text-cyan-900">
                    S
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-violet-600 bg-white text-xs font-bold text-violet-700">
                    +2
                  </div>
                </div>

                <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold">
                  Teamwork
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-violet-100 bg-violet-50/80 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-xl">
                  🤝
                </div>
                <p className="mt-3 font-bold text-slate-800">
                  Find your team
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Meet people who share your ambition.
                </p>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-xl">
                  🚀
                </div>
                <p className="mt-3 font-bold text-slate-800">
                  Make an impact
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Turn collaboration into creation.
                </p>
              </div>
            </div>
          </div>

          <div className="absolute -left-8 top-1/3 hidden rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-xl sm:block">
            <p className="text-xs font-semibold text-slate-500">
              THE POWER OF
            </p>
            <p className="mt-1 font-extrabold text-violet-700">
              Collaboration ✨
            </p>
          </div>
        </section>
      </div>

      <footer className="relative border-t border-violet-100/80 px-6 py-5 text-center text-sm text-slate-500">
        Find your people. Build something extraordinary.
      </footer>
    </main>
  );
}