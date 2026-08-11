"use client";

import { Bell, Search } from "lucide-react";

export default function Navbar() {
  return (
    <header className="bg-white h-20 border-b flex items-center justify-between px-8">

      <h2 className="text-2xl font-bold">
        Dashboard
      </h2>

      <div className="flex items-center gap-5">

        <div className="relative">

          <Search
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            placeholder="Search..."
            className="pl-10 pr-4 py-2 rounded-xl border"
          />

        </div>

        <Bell className="cursor-pointer" />

        <img
          src="https://ui-avatars.com/api/?name=Student"
          className="w-11 h-11 rounded-full"
        />

      </div>

    </header>
  );
}