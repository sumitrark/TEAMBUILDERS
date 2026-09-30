import { api } from "@/lib/api";

export interface Hackathon {
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
  banner_image: string;
  website: string;
  status: string;
  lifecycle_status?: string | null;
}

export interface WorkspaceTeamMember {
  user_id: string;
  name: string;
  email: string;
  presence: "ONLINE" | "AWAY" | "OFFLINE";
  is_current_user: boolean;
}

export interface WorkspaceData {
  hackathon: {
    id: string;
    title: string;
    description: string;
  };

  lifecycle_status: string;
  seconds_remaining: number | null;

  team: {
    id: string;
    name: string;
  } | null;

  team_members: WorkspaceTeamMember[];

  project: {
    id: string;
    title: string;
    status: string;
    description: string | null;
    tech_stack: string | null;
    github_url: string | null;
    demo_url: string | null;
    ai_tools_used: string | null;
  } | null;

  latest_submission_version: number | null;
  submitted_at: string | null;
  submission_count: number;

  proctoring_strikes: number;
  flagged_for_review: boolean;
}
export async function getHackathons() {
  const res = await api.get("/hackathons");
  return res.data;
}

export async function getWorkspace(
  hackathonId: string
): Promise<WorkspaceData> {
  const res = await api.get(`/hackathons/${hackathonId}/workspace`);
  return res.data;
}