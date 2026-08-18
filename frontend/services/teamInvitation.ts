import { api } from "@/lib/api";

export interface TeamInvitation {
  id: string;
  team_id: string;
  inviter_id: string;
  invitee_id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
}

export async function getMyInvitations(): Promise<TeamInvitation[]> {
  const response = await api.get(
    "/team-invitations/my"
  );

  return response.data;
}

export async function acceptInvitation(
  invitationId: string
) {
  const response = await api.post(
    `/team-invitations/${invitationId}/accept`
  );

  return response.data;
}

export async function declineInvitation(
  invitationId: string
) {
  const response = await api.post(
    `/team-invitations/${invitationId}/decline`
  );

  return response.data;
}