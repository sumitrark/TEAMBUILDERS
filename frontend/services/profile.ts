import { api } from "@/lib/api";

export interface ProfileData {
  id: string;
  full_name: string;
  username: string | null;
  email: string;
  college: string;
  course: string;
  year: number;
  role: string;
  is_active: boolean;

  bio: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;

  skills: string[];
  preferred_roles: string[];
}

export interface ProfileUpdatePayload {
  full_name: string;
  username: string;
  college: string;
  course: string;
  year: number;

  bio: string;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;

  skills: string[];
  preferred_roles: string[];
}

export async function getProfile(): Promise<ProfileData> {
  const res = await api.get("/profile");
  return res.data;
}

export async function updateProfile(
  data: ProfileUpdatePayload
): Promise<ProfileData> {
  const res = await api.put("/profile", data);
  return res.data;
}