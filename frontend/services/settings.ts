import { api } from "@/lib/api";

export interface Settings {
  team_invitations: boolean;
  hackathon_reminders: boolean;
  ai_recommendations: boolean;
  profile_visibility: "public" | "team_only" | "private";
}

export async function getSettings() {
  const res = await api.get("/settings");
  return res.data;
}

export async function updateSettings(data: Settings) {
  const res = await api.put("/settings", data);
  return res.data;
}