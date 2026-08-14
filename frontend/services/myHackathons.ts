import { api } from "@/lib/api";

export async function getMyHackathons() {
  const res = await api.get("/participants/my");
  return res.data;
}