import { api } from "@/lib/api";
import {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  User,
} from "@/types/auth";

export const register = async (data: RegisterRequest) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const login = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const response = await api.post("/auth/login", data);

  // Backend returns:
  // {
  //   user: {...},
  //   tokens: {
  //     access_token: "...",
  //     refresh_token: "...",
  //     token_type: "bearer"
  //   }
  // }

  localStorage.setItem(
    "access_token",
    response.data.tokens.access_token
  );

  localStorage.setItem(
    "refresh_token",
    response.data.tokens.refresh_token
  );

  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};