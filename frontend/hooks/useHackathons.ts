"use client";

import { useEffect, useState } from "react";
import { getHackathons, Hackathon } from "@/services/hackathon";

export function useHackathons() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHackathons()
      .then(setHackathons)
      .finally(() => setLoading(false));
  }, []);

  return { hackathons, loading };
}