import { api } from "@/lib/api";

export interface ProctoringEventResult {
  strike_count: number;
  strike_threshold: number;
  newly_flagged_for_review: boolean;
  message: string;
}

export interface MyProctoringStatus {
  strike_count: number;
  strike_threshold: number;
  flagged_for_review: boolean;
}

export async function submitProctoringEvent(
  hackathonId: string,
  eventType: "check_in" | "periodic_snapshot",
  faceDetected: boolean,
  snapshotDataUrl: string | null
): Promise<ProctoringEventResult> {
  const response = await api.post("/proctoring/events", {
    hackathon_id: hackathonId,
    event_type: eventType,
    face_detected: faceDetected,
    snapshot_data_url: snapshotDataUrl,
  });

  return response.data;
}

export async function getMyProctoringStatus(
  hackathonId: string
): Promise<MyProctoringStatus> {
  const response = await api.get("/proctoring/my-status", {
    params: { hackathon_id: hackathonId },
  });

  return response.data;
}

export interface FlaggedEvent {
  id: string;
  event_type: string;
  snapshot_data_url: string | null;
  created_at: string;
}

export interface FlaggedParticipant {
  user_id: string;
  full_name: string;
  email: string;
  strike_count: number;
  recent_flagged_events: FlaggedEvent[];
}

export async function getFlaggedParticipants(
  hackathonId: string
): Promise<FlaggedParticipant[]> {
  const response = await api.get(
    `/proctoring/hackathons/${hackathonId}/flagged`
  );

  return response.data;
}

export async function dismissParticipantFlag(
  hackathonId: string,
  userId: string
) {
  const response = await api.post(
    `/proctoring/hackathons/${hackathonId}/flagged/${userId}/dismiss`
  );

  return response.data;
}

export async function disqualifyParticipant(
  hackathonId: string,
  userId: string
) {
  const response = await api.post(
    `/proctoring/hackathons/${hackathonId}/flagged/${userId}/disqualify`
  );

  return response.data;
}
