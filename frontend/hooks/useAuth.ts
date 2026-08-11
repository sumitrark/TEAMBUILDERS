"use client";

import { useEffect, useState } from "react";
import { User } from "@/types/auth";
import { getCurrentUser } from "@/services/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const me = await getCurrentUser();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  return {
    user,
    loading,
  };
}