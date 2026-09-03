import apiRequest from "./api";

// ==================== Types ====================

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
  new_student_registration: boolean;
  new_company_registration: boolean;
  job_pending_approval: boolean;
  abuse_reports: boolean;
  system_alerts: boolean;
  admin_messages: boolean;
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

export interface CompanySettingsResponse {
  account: {
    email: string;
    role: string;
  };
  company: {
    company_name: string;
    approval_status: string;
  };
}

export const getCompanySettings = () => {
  return apiRequest<CompanySettingsResponse | { data: CompanySettingsResponse }>(
    "/settings/company",
    { method: "GET" }
  );
};

// ==================== Password ====================

export const changePassword = (data: ChangePasswordPayload) => {
  return apiRequest<MessageResponse>("/settings/password", {
    method: "PUT",
    data,
  });
};

// ==================== Notifications ====================

export const getNotificationSettings = () => {
  return apiRequest<NotificationSettings>("/settings/notifications", {
    method: "GET",
  });
};

export const updateNotificationSettings = (data: Partial<NotificationSettings>) => {
  return apiRequest<{ message: string; settings: NotificationSettings }>(
    "/settings/notifications",
    {
      method: "PUT",
      data,
    }
  );
};

// ==================== Privacy ====================

export const getPrivacySettings = () => {
  return apiRequest<PrivacySettings>("/settings/privacy", {
    method: "GET",
  });
};

export const updatePrivacySettings = (data: Partial<PrivacySettings>) => {
  return apiRequest<{ message: string; settings: PrivacySettings }>(
    "/settings/privacy",
    {
      method: "PUT",
      data,
    }
  );
};

// ==================== Delete Account ====================

export const deleteAccount = (password: string) => {
  return apiRequest<MessageResponse>("/settings/account", {
    method: "DELETE",
    data: { password },
  });
};
