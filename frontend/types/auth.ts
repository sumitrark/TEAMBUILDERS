import { AxiosResponse } from "axios";

export type UserRole =
  | "student"
  | "organizer"
  | "judge";

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;

  role: UserRole;

  // Student fields
  college?: string;
  course?: string;
  year?: number;

  // Organizer fields
  organization?: string;
  designation?: string;
  bio?: string;
  linkedin_url?: string;
  portfolio_url?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  full_name: string;
  username: string | null;
  email: string;

  college?: string | null;
  course?: string | null;
  year?: number | null;

  role: UserRole;
  is_active: boolean;

  mobile_number?: string | null;
  phone_verified?: boolean;

  bio?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;

  skills?: string[] | null;
  preferred_roles?: string[] | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginResponse {
  user: User;
  tokens: TokenResponse;
}