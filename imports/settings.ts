import { API } from "./api";

export interface NotificationSettings {
  application_updates: boolean;
  interview_notifications: boolean;
  job_recommendations: boolean;
  messages: boolean;
  profile_views: boolean;
  resume_feedback: boolean;
  company_applications: boolean;
  company_messages: boolean;
  company_matches: boolean;
  company_deadlines: boolean;
  company_interviews: boolean;
  weekly_application_summary: boolean;
  job_deadline_reminders: boolean;
}

export interface PrivacySettings {
  profile_visibility: boolean;
  contact_visibility: boolean;
  ai_resume_analysis: boolean;
  ai_candidate_matching: boolean;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface MessageResponse {
  message: string;
}

export const changePassword = async (
  data: ChangePasswordPayload,
): Promise<MessageResponse> => {
  const response = await API.put("/settings/password", data);

  return response.data;
};

export const getNotificationSettings =
  async (): Promise<NotificationSettings> => {
    const response = await API.get("/settings/notifications");

    return response.data;
  };

export const updateNotificationSettings = async (
  data: Partial<NotificationSettings>,
): Promise<{
  message: string;
  settings: NotificationSettings;
}> => {
  const response = await API.put("/settings/notifications", data);

  return response.data;
};

export const getPrivacySettings = async (): Promise<PrivacySettings> => {
  const response = await API.get("/settings/privacy");

  return response.data;
};

export const updatePrivacySettings = async (
  data: Partial<PrivacySettings>,
): Promise<{
  message: string;
  settings: PrivacySettings;
}> => {
  const response = await API.put("/settings/privacy", data);

  return response.data;
};

export const deleteAccount = async (
  password: string,
): Promise<MessageResponse> => {
  const response = await API.delete("/settings/account", {
    data: {
      password,
    },
  });

  return response.data;
};
