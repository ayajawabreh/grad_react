import { API } from "./api";

export interface NotificationDTO {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  time: string;
  created_at: string;
}

export interface NotificationsResponse {
  unread_count: number;
  notifications: NotificationDTO[];
}

export const getNotifications =
  async (): Promise<NotificationsResponse> => {
    const response =
      await API.get<NotificationsResponse>(
        "/notifications"
      );

    return response.data;
  };

export const getUnreadCount =
  async (): Promise<{ unread_count: number }> => {
    const response =
      await API.get<{ unread_count: number }>(
        "/notifications/unread-count"
      );

    return response.data;
  };

export const markNotificationAsRead =
  async (
    id: number
  ) => {
    const response =
      await API.put(
        `/notifications/${id}/read`
      );

    return response.data;
  };

export const markAllNotificationsAsRead =
  async () => {
    const response =
      await API.put(
        "/notifications/read-all"
      );

    return response.data;
  };

export const deleteNotification =
  async (
    id: number
  ) => {
    const response =
      await API.delete(
        `/notifications/${id}`
      );

    return response.data;
  };
