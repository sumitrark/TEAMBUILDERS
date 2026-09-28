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
  snapshotDataUrl: string | null,
  faceMatchStatus:
    | "MATCH"
    | "MISMATCH"
    | "NO_FACE"
    | "MULTIPLE_FACES"
    | "UNAVAILABLE"
    | null = null,
  faceSimilarity: number | null = null
): Promise<ProctoringEventResult> {
  const response = await api.post("/proctoring/events", {
    hackathon_id: hackathonId,
    event_type: eventType,
    face_detected: faceDetected,
    snapshot_data_url: snapshotDataUrl,
    face_match_status: faceMatchStatus,
    face_similarity: faceSimilarity,
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

export interface ProctoringMonitorEvent {
  id: string;
  event_type: string;
  face_detected: boolean;
  face_match_status:
    | "MATCH"
    | "MISMATCH"
    | "NO_FACE"
    | "MULTIPLE_FACES"
    | "UNAVAILABLE"
    | null;
  face_similarity: number | null;
  snapshot_data_url: string | null;
  created_at: string;
}

export interface ProctoringMonitorParticipant {
  user_id: string;
  full_name: string;
  email: string;
  team_id: string | null;
  identity_status: string;
  strike_count: number;
  flagged_for_review: boolean;
  last_check_at: string | null;
  last_face_detected: boolean | null;
  recent_events: ProctoringMonitorEvent[];
}

export async function getProctoringMonitor(
  hackathonId: string
): Promise<ProctoringMonitorParticipant[]> {
  const response = await api.get(
    `/proctoring/hackathons/${hackathonId}/monitor`
  );

  return response.data;
}

export async function deleteProctoringSnapshot(
  hackathonId: string,
  eventId: string
): Promise<void> {
  await api.delete(
    `/proctoring/hackathons/${hackathonId}/events/${eventId}/snapshot`
  );
}
