"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/services/dashboard";

export function useDashboard() {
  const [stats, setStats] = useState({
    hackathons: 0,
    participants: 0,
    projects: 0,
    teams: 0,
  });

  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  return stats;
}