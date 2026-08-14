import { api } from "@/lib/api";

export async function getMyHackathons() {
  const res = await api.get("/participants/my");
  return res.data;
}

export async function joinHackathon(id: string) {
  const res = await api.post(`/participants/join/${id}`);
  return res.data;
}