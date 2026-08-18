"use client";

import NotificationBell from "./NotificationBell";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  X,
} from "lucide-react";

import {
  getHackathons,
  Hackathon,
} from "@/services/hackathon";

import {
  getCurrentUser,
} from "@/services/auth";

interface CurrentUser {
  id: string;
  full_name: string;
  username?: string | null;
  email: string;
  role: string;
}

export default function Topbar() {
  const [query, setQuery] = useState("");

  const [hackathons, setHackathons] =
    useState<Hackathon[]>([]);

  const [results, setResults] =
    useState<Hackathon[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [showResults, setShowResults] =
    useState(false);

  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [userLoading, setUserLoading] =
    useState(true);

  const searchRef =
    useRef<HTMLDivElement>(null);

  // ==================================================
  // LOAD LOGGED-IN USER
  // ==================================================

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);
      } catch (error) {
        console.error(
          "Failed to load current user:",
          error
        );
      } finally {
        setUserLoading(false);
      }
    }

    loadUser();
  }, []);

  // ==================================================
  // LOAD HACKATHONS
  // ==================================================

  useEffect(() => {
    async function loadHackathons() {
      try {
        setLoading(true);

        const data =
          await getHackathons();

        setHackathons(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load hackathons for search:",
          error
        );

        setHackathons([]);
      } finally {
        setLoading(false);
      }
    }

    loadHackathons();
  }, []);

  // ==================================================
  // SEARCH HACKATHONS
  // ==================================================

  useEffect(() => {
    const search =
      query.trim().toLowerCase();

    if (!search) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const filtered =
      hackathons.filter(
        (hackathon) => {
          return (
            hackathon.title
              ?.toLowerCase()
              .includes(search) ||
            hackathon.organizer
              ?.toLowerCase()
              .includes(search) ||
            hackathon.description
              ?.toLowerCase()
              .includes(search) ||
            hackathon.mode
              ?.toLowerCase()
              .includes(search) ||
            hackathon.location
              ?.toLowerCase()
              .includes(search) ||
            hackathon.difficulty
              ?.toLowerCase()
              .includes(search)
          );
        }
      );

    setResults(
      filtered.slice(0, 6)
    );

    setShowResults(true);
  }, [query, hackathons]);

  // ==================================================
  // CLOSE SEARCH WHEN CLICKING OUTSIDE
  // ==================================================

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target as Node
        )
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // ==================================================
  // CLEAR SEARCH
  // ==================================================

  function clearSearch() {
    setQuery("");
    setResults([]);
    setShowResults(false);
  }

  // ==================================================
  // USER DISPLAY
  // ==================================================

  const userName =
    user?.full_name || "Student";

  const userRole =
    user?.role || "student";

  const userInitial =
    userName
      .trim()
      .charAt(0)
      .toUpperCase() || "U";

  return (
    <header className="flex h-20 items-center justify-between border-b bg-white px-8">

      {/* ==================================================
          LEFT SIDE
      ================================================== */}

      <div>

        <h1 className="text-2xl font-bold text-slate-800">
          Student Dashboard
        </h1>

        <p className="text-sm text-gray-500">
          {userLoading
            ? "Welcome back! Let's build something amazing 🚀"
            : `Welcome back, ${userName}! Let's build something amazing 🚀`}
        </p>

      </div>

      {/* ==================================================
          RIGHT SIDE
      ================================================== */}

      <div className="flex items-center gap-6">

        {/* ==================================================
            SEARCH
        ================================================== */}

        <div
          ref={searchRef}
          className="relative"
        >

          <Search
            size={18}
            className="absolute left-4 top-3.5 text-gray-400"
          />

          <input
            type="text"
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            onFocus={() => {
              if (query.trim()) {
                setShowResults(true);
              }
            }}
            placeholder="Search hackathons..."
            className="w-80 rounded-xl border bg-gray-50 py-3 pl-11 pr-10 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
          />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          )}

          {/* ==================================================
              SEARCH RESULTS
          ================================================== */}

          {showResults && (
            <div className="absolute right-0 top-14 z-50 w-96 overflow-hidden rounded-2xl border bg-white shadow-xl">

              {/* Loading */}

              {loading && (
                <div className="px-5 py-6 text-center text-sm text-gray-500">
                  Loading hackathons...
                </div>
              )}

              {/* Results */}

              {!loading &&
                results.length > 0 && (
                  <div className="py-2">

                    <div className="border-b px-5 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Hackathons
                      </p>
                    </div>

                    {results.map(
                      (hackathon) => (
                        <Link
                          key={hackathon.id}
                          href={`/dashboard/hackathons/${hackathon.id}`}
                          onClick={() =>
                            setShowResults(false)
                          }
                          className="block border-b px-5 py-4 transition last:border-b-0 hover:bg-violet-50"
                        >

                          <div className="flex items-start gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                              <Search size={17} />
                            </div>

                            <div className="min-w-0">

                              <p className="truncate font-semibold text-slate-800">
                                {hackathon.title}
                              </p>

                              <p className="mt-1 truncate text-xs text-gray-500">
                                {hackathon.organizer}
                              </p>

                              <div className="mt-2 flex gap-2">

                                {hackathon.mode && (
                                  <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-600">
                                    {hackathon.mode}
                                  </span>
                                )}

                                {hackathon.difficulty && (
                                  <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] text-violet-700">
                                    {hackathon.difficulty}
                                  </span>
                                )}

                              </div>

                            </div>

                          </div>

                        </Link>
                      )
                    )}

                  </div>
                )}

              {/* No Results */}

              {!loading &&
                query.trim() &&
                results.length === 0 && (
                  <div className="px-5 py-8 text-center">

                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <Search
                        size={20}
                        className="text-gray-400"
                      />
                    </div>

                    <p className="font-semibold text-gray-700">
                      No hackathons found
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      Try a different search term.
                    </p>

                  </div>
                )}

            </div>
          )}

        </div>

        {/* ==================================================
            NOTIFICATIONS
        ================================================== */}

        <NotificationBell />

        {/* ==================================================
            USER PROFILE
        ================================================== */}

        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-gray-100"
        >

          {/* Avatar */}

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 font-bold text-white">
            {userLoading
              ? "..."
              : userInitial}
          </div>

          {/* User Information */}

          <div>

            <h3 className="font-semibold">
              {userLoading
                ? "Loading..."
                : userName}
            </h3>

            <p className="text-xs capitalize text-gray-500">
              {userRole}
            </p>

          </div>

        </Link>

      </div>

    </header>
  );
}