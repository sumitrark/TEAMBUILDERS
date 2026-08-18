import { api } from "@/lib/api";

export interface TeamPayload {
  name: string;
  description?: string;
  max_members?: number;
  hackathon_id?: string | null;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  max_members: number;
  owner_id: string;
  hackathon_id: string | null;
  created_at: string;
}
export async function createTeam(data: TeamPayload) {
  const res = await api.post("/teams", data);
  return res.data;
}

export async function getMyTeams(): Promise<Team[]> {
  const res = await api.get("/teams/my");
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