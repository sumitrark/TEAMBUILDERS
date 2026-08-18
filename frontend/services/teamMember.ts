import { api } from "@/lib/api";

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

// Get members of a team
export async function getTeamMembers(
  teamId: string
): Promise<TeamMember[]> {
  const res = await api.get(
    `/team-members/${teamId}`
  );

  return res.data;
}

// Add a member
export async function addTeamMember(
  teamId: string,
  userId: string
) {
  const res = await api.post(
    `/team-members/${teamId}`,
    {
      user_id: userId,
    }
  );

  return res.data;
}

// Remove a member
export async function removeTeamMember(
  teamId: string,
  userId: string
) {
  const res = await api.delete(
    `/team-members/${teamId}/${userId}`
  );

  return res.data;
}