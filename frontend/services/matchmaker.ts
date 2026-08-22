import { api } from "@/lib/api";

export interface MatchRecommendation {
  user_id: string;
  full_name: string;
  username?: string | null;

  college?: string | null;
  course?: string | null;
  year?: number | null;

  bio?: string | null;

  skills: string[];
  preferred_roles: string[];

  match_score: number;

  matched_skills: string[];
  matched_roles: string[];
}

export interface MatchmakerResponse {
  recommendations: MatchRecommendation[];
}

export async function getMatchmakerRecommendations(
  limit: number = 10
): Promise<MatchRecommendation[]> {
  const response = await api.get<MatchmakerResponse>(
    "/matchmaker/recommendations",
    {
      params: {
        limit,
      },
    }
  );

  return response.data.recommendations;
}