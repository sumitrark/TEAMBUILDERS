import { api } from "@/lib/api";

export interface OtpStatusResponse {
  message: string;
  expires_in_seconds: number | null;
  resend_available_in_seconds: number | null;
}

export async function sendOtp(
  mobileNumber: string
): Promise<OtpStatusResponse> {
  const response = await api.post("/auth/otp/send", {
    mobile_number: mobileNumber,
  });

  return response.data;
}

export async function verifyOtp(
  otp: string
): Promise<{ message: string }> {
  const response = await api.post("/auth/otp/verify", {
    otp,
  });

  return response.data;
}
