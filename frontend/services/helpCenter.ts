import { api } from "@/lib/api";

export interface HelpCenterMessage {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  category: string;
  created_at: string;
}

export interface HelpCenterQuestion {
  question: string;
}

export async function askHelpCenter(
  question: string
): Promise<HelpCenterMessage> {
  const res = await api.post(
    "/help-center/chat",
    {
      question,
    }
  );

  return res.data;
}

export async function getHelpCenterHistory(): Promise<
  HelpCenterMessage[]
> {
  const res = await api.get(
    "/help-center/history"
  );

  return res.data;
}

export async function clearHelpCenterHistory() {
  const res = await api.delete(
    "/help-center/history"
  );

  return res.data;
}