import { api } from "@/lib/api";

export interface ProjectPayload {
  title: string;
  description?: string;
  tech_stack?: string;
  github_url?: string;
  demo_url?: string;
  team_id?: string | null;
  ai_tools_used?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  tech_stack: string | null;
  github_url: string | null;
  demo_url: string | null;
  owner_id: string;
  team_id: string | null;
  ai_tools_used: string | null;
  created_at: string;
}


export async function createProject(
  data: ProjectPayload
) {
  const res = await api.post(
    "/projects",
    data
  );

  return res.data;
}


export async function getMyProjects(): Promise<Project[]> {
  const res = await api.get(
    "/projects/my"
  );

  return res.data;
}


export async function getProject(
  projectId: string
): Promise<Project> {
  const res = await api.get(
    `/projects/${projectId}`
  );

  return res.data;
}


export async function updateProject(
  projectId: string,
  data: ProjectPayload
) {
  const res = await api.put(
    `/projects/${projectId}`,
    data
  );

  return res.data;
}


export async function deleteProject(
  projectId: string
) {
  const res = await api.delete(
    `/projects/${projectId}`
  );

  return res.data;
}