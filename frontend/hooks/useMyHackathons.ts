"use client";

import { useEffect, useState } from "react";
import { getMyHackathons } from "@/services/participant";

export function useMyHackathons() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyHackathons()
      .then(setHackathons)
      .finally(() => setLoading(false));
  }, []);

  return {
    hackathons,
    loading,
  };
}