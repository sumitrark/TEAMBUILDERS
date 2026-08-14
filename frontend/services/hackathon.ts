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
}

export async function getHackathons() {
  const res = await api.get("/hackathons");
  return res.data;
}