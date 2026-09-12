"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel, ArrowRight } from "lucide-react";

import { getMyJudgeHackathons } from "@/services/judge";

export default function JudgeAccessBanner() {
  const router = useRouter();

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const hackathons = await getMyJudgeHackathons();
        setCount(hackathons.length);
      } catch {
        // Silently do nothing - this is a discoverability nicety,
        // never worth showing an error on the main dashboard for.
      } finally {
        setLoading(false);
      }
    }

    check();
  }, []);

  if (loading || count === 0) {
    return null;
  }

  return (
    <button
      onClick={() => router.push("/judge")}
      className="flex w-full items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left transition hover:bg-amber-100"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Gavel className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-amber-900">
            You're an active judge for {count} hackathon
            {count !== 1 ? "s" : ""}
          </p>
          <p className="text-sm text-amber-700">
            Your student account keeps full access - judging is a
            separate capability.
          </p>
        </div>
      </div>
      <ArrowRight className="h-5 w-5 text-amber-600" />
    </button>
  );
}
