"use client";

import { useEffect, useState } from "react";

import {
  getMyTeams,
  Team,
} from "@/services/team";

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadTeams() {
      try {
        console.log("🚀 Loading my teams...");

        const data = await getMyTeams();

        console.log("✅ My teams:", data);

        if (mounted) {
          setTeams(data);
        }
      } catch (error) {
        console.error(
          "❌ Failed to load teams:",
          error
        );

        if (mounted) {
          setTeams([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTeams();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    teams,
    loading,
  };
}