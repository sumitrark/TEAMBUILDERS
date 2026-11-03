
import { api } from "@/lib/api";

export async function getMyHackathons() {
  const res = await api.get("/participants/my");
  return res.data;
}

export async function joinHackathon(id: string) {
  const res = await api.post(`/participants/join/${id}`);
  return res.data;
}

export interface LeaderboardEntry {
  rank: number;
  project_id: string;
  project_title: string;
  team_id: string;
  score: number;
  evaluation_count: number;
}

export interface PublishedResults {
  hackathon_id: string;
  hackathon_title: string;
  announced_at: string;
  leaderboard: LeaderboardEntry[];
  top_three: LeaderboardEntry[];
}

export async function getPublishedResults(
  hackathonId: string
): Promise<PublishedResults> {
  const response = await api.get(
    `/participants/hackathons/${hackathonId}/results`
  );

  return response.data;
}
