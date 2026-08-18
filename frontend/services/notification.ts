import { api } from "@/lib/api";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(): Promise<
  Notification[]
> {
  const res = await api.get("/notifications");

  return res.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await api.get(
    "/notifications/unread-count"
  );

  return res.data.count ?? 0;
}

export async function markNotificationAsRead(
  notificationId: string
) {
  const res = await api.post(
    `/notifications/${notificationId}/read`
  );

  return res.data;
}

export async function markAllNotificationsAsRead() {
  const res = await api.post(
    "/notifications/read-all"
  );

  return res.data;
}