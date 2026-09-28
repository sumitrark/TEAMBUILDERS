import { api } from "@/lib/api";

export interface IdentityVerification {
  id: string;
  participant_id: string;
  provider: string;
  provider_reference: string | null;
  status: "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED";
  verified_at: string | null;
  expires_at: string | null;
  updated_at: string;
}

export async function getIdentityVerification(
  hackathonId: string
): Promise<IdentityVerification> {
  const response = await api.get(
    `/identity-verification/${hackathonId}`
  );
  return response.data;
}

export async function startIdentityVerification(
  hackathonId: string
): Promise<IdentityVerification> {
  const response = await api.post(
    `/identity-verification/${hackathonId}/start`
  );
  return response.data;
}
