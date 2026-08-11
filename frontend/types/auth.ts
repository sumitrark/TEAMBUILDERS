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

export interface LoginResponse {
  access_token: string;
  token_type: string;
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