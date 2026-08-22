import { api } from "@/lib/api";

export interface OrganizerHackathon {
  id: string;
  title: string;
  description: string;
  organizer: string;
  mode: string;
  location: string;
  team_size: number;
  difficulty: string;
  prize_pool: string;
  registration_deadline: string;
  start_date: string;
  end_date: string;
  banner_image?: string;
  website?: string;
  status: string;
  is_active?: boolean;
  judge_invitation_code?: string;
}

export type Hackathon = OrganizerHackathon;

export interface Participant {
  id: string;
  user_id: string;
  name: string;
  username?: string;
  email: string;
  college?: string;
  course?: string;
  year?: number;
  status?: string;
  team_id?: string | null;
}
export interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  username?: string;
  email: string;
}


export interface OrganizerTeam {
  id: string;
  name: string;
  description?: string;
  max_members: number;
  owner_id: string;
  hackathon_id: string;
  members: TeamMember[];
}

export interface Judge {
  id: string;
  hackathon_id: string;
  user_id: string;
  name: string;
  username?: string;
  email: string;
  status: string;
  created_at: string;
}

export interface OrganizerAnalytics {
  participants: number;
  teams: number;
  projects: number;
  judges: number;
}

// ============================================================
// HACKATHONS
// ============================================================

export async function getOrganizerHackathons() {
  const response = await api.get<OrganizerHackathon[]>(
    "/organizer/hackathons"
  );

  return response.data;
}

export async function getOrganizerHackathon(id: string) {
  const response = await api.get<OrganizerHackathon>(
    `/hackathons/${id}`
  );

  return response.data;
}

export async function updateOrganizerHackathon(
  id: string,
  data: Record<string, unknown>
) {
  const response = await api.put(
    `/organizer/hackathons/${id}`,
    data
  );

  return response.data;
}

export async function updateOrganizerHackathonStatus(
  id: string,
  status?: string
) {
  const response = await api.patch(
    `/organizer/hackathons/${id}/status`,
    status ? null : undefined,
    status
      ? {
          params: { status },
        }
      : undefined
  );

  return response.data;
}

export async function deleteOrganizerHackathon(id: string) {
  const response = await api.delete(
    `/organizer/hackathons/${id}`
  );

  return response.data;
}

// ============================================================
// PARTICIPANTS
// ============================================================

export async function getHackathonParticipants(
  id: string
): Promise<Participant[]> {
  const response = await api.get<Participant[]>(
    `/organizer/hackathons/${id}/participants`
  );

  return response.data;
}

export const getParticipants =
  getHackathonParticipants;

// ============================================================
// TEAMS
// ============================================================

export async function getHackathonTeams(
  id: string
): Promise<OrganizerTeam[]> {
  const response = await api.get<OrganizerTeam[]>(
    `/organizer/hackathons/${id}/teams`
  );

  return response.data;
}

// ============================================================
// TEAM MANAGEMENT
// ============================================================

export async function removeTeamMember(
  hackathonId: string,
  teamId: string,
  userId: string
) {
  const response = await api.delete(
    `/organizer/hackathons/${hackathonId}/teams/${teamId}/members/${userId}`
  );

  return response.data;
}

export async function deleteOrganizerTeam(
  hackathonId: string,
  teamId: string
) {
  const response = await api.delete(
    `/organizer/hackathons/${hackathonId}/teams/${teamId}`
  );

  return response.data;
}

// ============================================================
// JUDGES
// ============================================================

export async function getHackathonJudges(
  id: string
): Promise<Judge[]> {
  const response = await api.get<Judge[]>(
    `/organizer/hackathons/${id}/judges`
  );

  return response.data;
}

export async function inviteJudge(
  id: string,
  email: string
) {
  const response = await api.post(
    `/organizer/hackathons/${id}/judges/invite`,
    {
      email,
    }
  );

  return response.data;
}

export async function removeJudge(
  hackathonId: string,
  judgeId: string
) {
  const response = await api.delete(
    `/organizer/hackathons/${hackathonId}/judges/${judgeId}`
  );

  return response.data;
}

// ============================================================
// ANALYTICS
// ============================================================

export async function getHackathonAnalytics(
  id: string
): Promise<OrganizerAnalytics> {
  const response = await api.get<OrganizerAnalytics>(
    `/organizer/hackathons/${id}/analytics`
  );

  return response.data;
}

// ============================================================
// CREATE
// ============================================================

export async function createOrganizerHackathon(data: {
  title: string;
  description: string;
  mode: string;
  location: string;
  team_size: number;
  difficulty: string;
  prize_pool: string;
  registration_deadline: string;
  start_date: string;
  end_date: string;
  banner_image?: string;
  website?: string;
}) {
  const response = await api.post(
    "/hackathons/organizer/create",
    {
      ...data,
      organizer: "",
    }
  );

  return response.data;
}

// ============================================================
// PROJECTS
// ============================================================

export interface OrganizerProject {
  id: string;
  title: string;
  description?: string;
  tech_stack?: string;
  github_url?: string;
  demo_url?: string;
  owner_id: string;
  team_id?: string | null;
  created_at: string;
}

export async function getHackathonProjects(
  id: string
): Promise<OrganizerProject[]> {
  const response = await api.get<OrganizerProject[]>(
    `/organizer/hackathons/${id}/projects`
  );

  return response.data;
}

export async function getOrganizerProject(
  hackathonId: string,
  projectId: string
): Promise<OrganizerProject> {
  const response = await api.get<OrganizerProject>(
    `/organizer/hackathons/${hackathonId}/projects/${projectId}`
  );

  return response.data;
}