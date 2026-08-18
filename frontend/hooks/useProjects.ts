"use client";

import { useEffect, useState } from "react";

import {
  getMyProjects,
  Project,
} from "@/services/project";


export function useProjects() {
  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);


  async function loadProjects() {
    try {
      console.log("🚀 Loading my projects...");

      const data =
        await getMyProjects();

      console.log(
        "✅ My projects:",
        data
      );

      setProjects(data);

    } catch (error) {

      console.error(
        "❌ Failed to load projects:",
        error
      );

      setProjects([]);

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {
    loadProjects();
  }, []);


  return {
    projects,
    loading,
    reload: loadProjects,
  };
}