import { api } from "@/lib/api";

export interface JudgeProject {
  id: string;
  title: string;
  description: string | null;
  tech_stack: string | null;
  github_url: string | null;
  demo_url: string | null;
  owner_id: string;
  team_id: string | null;
  team_name: string;
  created_at: string;
}

export interface Evaluation {
  id: string;
  project_id: string;
  judge_id: string;

  innovation_score: number;
  technical_score: number;
  impact_score: number;
  presentation_score: number;
  overall_score: number;

  feedback: string | null;

  created_at: string;
  updated_at: string;
}

export interface EvaluationCreate {
  project_id: string;
  innovation_score: number;
  technical_score: number;
  impact_score: number;
  presentation_score: number;
  overall_score: number;
  feedback?: string;
}


// ============================================================
// GET PROJECTS FOR JUDGE
// ============================================================

export async function getJudgeProjects(
  hackathonId: string
): Promise<JudgeProject[]> {
  const response = await api.get(
    `/judge/hackathons/${hackathonId}/projects`
  );

  return response.data;
}


// ============================================================
// GET SINGLE PROJECT
// ============================================================

export async function getJudgeProject(
  hackathonId: string,
  projectId: string
): Promise<JudgeProject> {
  const response = await api.get(
    `/judge/hackathons/${hackathonId}/projects/${projectId}`
  );

  return response.data;
}


// ============================================================
// CREATE EVALUATION
// ============================================================

export async function createEvaluation(
  data: EvaluationCreate
): Promise<Evaluation> {
  const response = await api.post(
    "/evaluations",
    data
  );

  return response.data;
}


// ============================================================
// GET MY EVALUATION
// ============================================================

export async function getMyEvaluation(
  projectId: string
): Promise<Evaluation | null> {
  try {
    const response = await api.get(
      `/evaluations/project/${projectId}/my`
    );

    return response.data;
  } catch (error: any) {

    if (error?.response?.status === 404) {
      return null;
    }

    throw error;
  }
}


// ============================================================
// UPDATE EVALUATION
// ============================================================

export async function updateEvaluation(
  evaluationId: string,
  data: Partial<EvaluationCreate>
): Promise<Evaluation> {
  const response = await api.put(
    `/evaluations/${evaluationId}`,
    data
  );

  return response.data;
}