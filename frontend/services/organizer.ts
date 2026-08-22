import { api } from "@/lib/api";

// ============================================================
// ORGANIZER DASHBOARD
// ============================================================

export async function getOrganizerStats() {
  const response = await api.get("/organizer/stats");
  return response.data;
}

// ============================================================
// ORGANIZER HACKATHONS
// ============================================================

export async function getOrganizerHackathons() {
  const response = await api.get("/organizer/hackathons");
  return response.data;
}

// ============================================================
// CREATE HACKATHON
// ============================================================

export async function createOrganizerHackathon(data: {
  title: string;
  description: string;
  organizer?: string;
  mode: string;
  location: string;
  team_size: number;
  difficulty: string;
  prize_pool: string;
  registration_deadline: string;
  start_date: string;
  end_date: string;
  banner_image?: string;
  website?: string;
}) {
  const response = await api.post(
    "/hackathons/",
    {
      ...data,
      organizer: data.organizer || "",
    }
  );

  return response.data;
}

// ============================================================
// GET SINGLE HACKATHON
// ============================================================

export async function getOrganizerHackathon(
  id: string
) {
  const response = await api.get(
    `/hackathons/${id}`
  );

  return response.data;
}

// ============================================================
// UPDATE HACKATHON
// ============================================================

export async function updateOrganizerHackathon(
  id: string,
  data: Record<string, unknown>
) {
  const response = await api.put(
    `/organizer/hackathons/${id}`,
    data
  );

  return response.data;
}

// ============================================================
// OPEN / CLOSE HACKATHON
// ============================================================

export async function updateOrganizerHackathonStatus(
  id: string,
  status?: string
) {
  const response = await api.patch(
    `/organizer/hackathons/${id}/status`
  );

  return response.data;
}

// ============================================================
// DELETE HACKATHON
// ============================================================

export async function cancelOrganizerHackathon(
  id: string
) {
  const response = await api.delete(
    `/organizer/hackathons/${id}`
  );

  return response.data;
}