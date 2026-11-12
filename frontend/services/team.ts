
import { api } from "@/lib/api";

export interface TeamPayload {
  name: string;
  description?: string;
  max_members?: number;
  hackathon_id?: string | null;
  required_skills?: string[];
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  max_members: number;
  owner_id: string;
  hackathon_id: string | null;
  required_skills: string[];
  created_at: string;
}

export interface TeamMatchRecommendation {
  user_id: string;
  full_name: string | null;
  username: string | null;
  college: string | null;
  course: string | null;
  year: number | null;
  bio: string | null;
  skills: string[];
  matched_skills: string[];
  match_score: number;
}

export interface TeamMatchmakerResponse {
  team_id: string;
  team_name: string;
  required_skills: string[];
  covered_skills: string[];
  missing_skills: string[];
  recommendations: TeamMatchRecommendation[];
}

export async function createTeam(data: TeamPayload) {
  const res = await api.post("/teams", data);
  return res.data;
}

export async function getMyTeams(): Promise<Team[]> {
  const res = await api.get("/teams/my");
  return res.data;
}

export async function getTeam(teamId: string): Promise<Team> {
  const res = await api.get(`/teams/${teamId}`);
  return res.data;
}

export async function updateTeam(
  teamId: string,
  data: TeamPayload
) {
  const res = await api.put(`/teams/${teamId}`, data);
  return res.data;
}

export async function deleteTeam(teamId: string) {
  const res = await api.delete(`/teams/${teamId}`);
  return res.data;
}

export async function getTeamMatchmakerRecommendations(
  teamId: string,
  limit = 10
): Promise<TeamMatchmakerResponse> {
  const res = await api.get(
    `/teams/${teamId}/matchmaker/recommendations`,
    {
      params: { limit },
    }
  );

  return res.data;
}
