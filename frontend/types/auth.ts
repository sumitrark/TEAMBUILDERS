export interface RegisterRequest {
  full_name: string;
  email: string;
  college: string;
  course: string;
  year: number;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  college: string;
  course: string;
  year: number;
  role: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse {
  user: User;
  tokens: TokenResponse;
}