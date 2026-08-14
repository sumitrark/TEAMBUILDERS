"use client";

import { Bell, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-20 bg-white border-b flex items-center justify-between px-8">

      {/* Left */}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Student Dashboard
        </h1>

        <p className="text-gray-500 text-sm">
          Welcome back! Let's build something amazing 🚀
        </p>
      </div>

      {/* Right */}

      <div className="flex items-center gap-6">

        {/* Search */}

        <div className="relative">

          <Search
            size={18}
            className="absolute left-4 top-3 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search hackathons..."
            className="w-72 rounded-xl border bg-gray-50 py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

        </div>

        {/* Notification */}

        <button className="relative rounded-xl bg-gray-100 p-3 hover:bg-gray-200">

          <Bell size={20} />

          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>

        </button>

        {/* User */}

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold">
            S
          </div>

          <div>

            <h3 className="font-semibold">
              Sumitra RK
            </h3>

            <p className="text-xs text-gray-500">
              Student
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}