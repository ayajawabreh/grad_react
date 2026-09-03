import { AxiosRequestConfig, create as createAxios } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

// مهم:
// 10.0.0.8 هو IP جهاز الكمبيوتر الذي يشغل Laravel.
// إذا تغير IP الكمبيوتر، غيّريه هنا.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://10.0.0.8:8000/api";
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export class PublicApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message)
        : `Request failed with status ${status}.`;
    super(message);
    this.name = "PublicApiError";
    this.status = status;
    this.body = body;
  }
}

export async function postPublicJson<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  console.log("API URL:", url);
  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const rawBody = await response.text();
  let body: unknown = null;
  try { body = rawBody ? JSON.parse(rawBody) : null; } catch { body = rawBody; }
  console.log("API STATUS:", response.status);
  console.log("API RESPONSE:", body);
  if (!response.ok) throw new PublicApiError(response.status, body);
  return body as T;
}

export function resolveMediaUrl(value?: string | null) {
  if (!value) return null;

  const url = String(value).trim();
  if (!url) return null;

  if (url.startsWith("data:image/")) {
    return url;
  }

  if (/^https?:\/\//i.test(url)) {
    return url.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i,
      API_ORIGIN
    );
  }

  const path = url.replace(/^\/+/, "");
  return path.startsWith("storage/")
    ? `${API_ORIGIN}/${path}`
    : `${API_ORIGIN}/storage/${path}`;
}

export const API = createAxios({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
  },
});

// إضافة الـ Token تلقائياً لكل Request
API.interceptors.request.use(
  async (config) => {
    // Let Axios/React Native add the multipart boundary for native files.
    // A global JSON content type makes Laravel receive the URI as text
    // instead of an uploaded file.
    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      const headers = config.headers as any;
      if (typeof headers?.delete === "function") {
        headers.delete("Content-Type");
      } else if (headers) {
        delete headers["Content-Type"];
        delete headers["content-type"];
      }
    }

    try {
      const token =
        (await AsyncStorage.getItem("cb_token")) ||
        (await AsyncStorage.getItem("token"));

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error reading auth token:", error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let handlingUnauthorized = false;

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url ?? "");

    if (status === 401 && !requestUrl.endsWith("/login") && !handlingUnauthorized) {
      handlingUnauthorized = true;
      await AsyncStorage.multiRemove([
        "cb_token",
        "token",
        "user",
        "user_role",
      ]);
      router.replace("/(auth)/login");
      setTimeout(() => {
        handlingUnauthorized = false;
      }, 500);
    }

    return Promise.reject(error);
  }
);

// Generic API Request
export async function apiRequest<T = any>(
  path: string,
  options: AxiosRequestConfig = {}
): Promise<T> {
  const response = await API({
    url: path,
    ...options,
  });

  return response.data;
}

// =====================================================
// STUDENT
// =====================================================

export const getStudentProfile = async () => {
  return apiRequest("/student/profile", {
    method: "GET",
  });
};

export const updateStudentProfile = async (data: any) => {
  return apiRequest("/student/profile", {
    method: "PUT",
    data,
  });
};

export const getSavedJobs = async () => {
  return apiRequest("/student/saved-jobs", {
    method: "GET",
  });
};

export const improveResumeSummary = async (text: string) => {
  return apiRequest("/student/resume/ai-improve", {
    method: "POST",
    data: {
      text,
    },
  });
};

// =====================================================
// AI
// =====================================================

export const reviewCV = async () => {
  try {
    const response = await API.post("/ai/cv-review", undefined, { timeout: 30000 });

    console.log("CV REVIEW RESPONSE:", response.data);

    return response.data;
  } catch (error: any) {
    console.log("CV REVIEW ERROR STATUS:", error?.response?.status);
    console.log("CV REVIEW ERROR DATA:", error?.response?.data);
    console.log("CV REVIEW ERROR MESSAGE:", error?.message);

    throw error;
  }
};

export const getJobRecommendations = async () => {
  return apiRequest("/ai/job-recommendations", {
    method: "GET",
  });
};

export const generateInterviewQuestions = async (
  jobId: number
) => {
  return apiRequest("/ai/interview/questions", {
    method: "POST",
    timeout: 60000,
    data: {
      job_id: jobId,
    },
  });
};

export const submitInterviewAnswers = async (data: any) => {
  return apiRequest("/ai/interview/submit", {
    method: "POST",
    timeout: 60000,
    data,
  });
};

export const retakeInterviewQuiz = async (jobId: number) =>
  apiRequest("/ai/interview/retake", {
    method: "POST",
    timeout: 60000,
    data: { job_id: jobId },
  });

export const getInterviewAttempts = async (jobId: number) =>
  apiRequest("/ai/interview/attempts", {
    method: "GET",
    params: { job_id: jobId },
  });

// =====================================================
// COMPANY
// =====================================================

export const getCompanyDashboard = async () => {
  return apiRequest("/company/dashboard", {
    method: "GET",
  });
};

export const getCompanyJobs = async () => {
  return apiRequest("/company/jobs", {
    method: "GET",
  });
};

export const getJobDetails = async (
  id: string | number
) => {
  return apiRequest(`/company/jobs/${id}`, {
    method: "GET",
  });
};

export const getJobApplicants = async () => {
  return apiRequest("/company/applicants", {
    method: "GET",
  });
};

export const shortlistApplicant = async (
  applicationId: number
) => {
  return apiRequest(
    `/company/applications/${applicationId}/shortlist`,
    {
      method: "PATCH",
    }
  );
};

export const getShortlistedApplicants = async (
  jobId: number
) => {
  return apiRequest(
    `/company/jobs/${jobId}/shortlisted`,
    {
      method: "GET",
    }
  );
};

export const createCompanyJob = async (data: any) => {
  return apiRequest("/company/jobs", {
    method: "POST",
    data,
  });
};

export const updateJob = async (
  id: string | number,
  data: any
) => {
  return apiRequest(`/company/jobs/${id}`, {
    method: "PUT",
    data,
  });
};

export const deleteJob = async (
  id: string | number
) => {
  return apiRequest(`/company/jobs/${id}`, {
    method: "DELETE",
  });
};

export const generateJobDescription = async (
  data: any
) => {
  return apiRequest(
    "/company/jobs/generate-description",
    {
      method: "POST",
      data,
    }
  );
};

export const getCompanyProfile = async () => {
  return apiRequest("/company/profile", {
    method: "GET",
  });
};

export const updateCompanyProfile = async (
  data: any
) => {
  return apiRequest("/company/profile", {
    method: "POST",
    data,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// =====================================================
// COMPANY INTERVIEWS
// =====================================================

export const getInterviewFeedback = async (
  interviewId: string | number
) => {
  return apiRequest(
    `/company/interviews/${interviewId}/feedback`,
    {
      method: "GET",
    }
  );
};

export const createInterviewFeedback = async (
  interviewId: string | number,
  data: any
) => {
  return apiRequest(
    `/company/interviews/${interviewId}/feedback`,
    {
      method: "POST",
      data,
    }
  );
};

export const updateInterviewFeedback = async (
  interviewId: string | number,
  data: any
) => {
  return apiRequest(
    `/company/interviews/${interviewId}/feedback`,
    {
      method: "PUT",
      data,
    }
  );
};

export const deleteInterviewFeedback = async (
  interviewId: string | number
) => {
  return apiRequest(
    `/company/interviews/${interviewId}/feedback`,
    {
      method: "DELETE",
    }
  );
};

export const getCompanyJobForEdit = async (id: string | number) => {
  return apiRequest(`/company/jobs/${id}/edit`, {
    method: "GET",
  });
};

// =====================================================
// ADMIN
// =====================================================

export const getAdminDashboard = () =>
  apiRequest("/admin/dashboard", { method: "GET" });

export const getAdminAnalytics = (period?: "week" | "month" | "year") =>
  apiRequest("/admin/analytics", { method: "GET", params: period ? { period } : undefined });

export const getAdminPlatformReport = (period = "month") =>
  apiRequest("/admin/reports/platform", { method: "GET", params: { period } });

export const getAdminJobsModeration = (params?: {
  search?: string;
  status?: string;
  company_id?: number;
  category_id?: number;
  date?: string;
  page?: number;
  per_page?: number;
}) => apiRequest("/admin/jobs/moderation", {
  method: "GET",
  params,
  headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
});

export const getAdminJobApplicants = (
  jobId: string | number,
  page = 1,
  perPage = 20
) => apiRequest(`/admin/jobs/${jobId}/applicants`, {
  method: "GET",
  params: { page, per_page: perPage },
});

export const getAdminApplications = () =>
  apiRequest("/admin/applications", { method: "GET" });

export const getAdminCategories = () =>
  apiRequest("/admin/categories", { method: "GET" });

export const createAdminCategory = (data: { name: string }) =>
  apiRequest("/admin/categories", { method: "POST", data });

export const updateAdminCategory = (
  id: string | number,
  data: { name: string }
) => apiRequest(`/admin/categories/${id}`, { method: "PUT", data });

export const deleteAdminCategory = (id: string | number) =>
  apiRequest(`/admin/categories/${id}`, { method: "DELETE" });

export const getAdminSkills = () =>
  apiRequest("/admin/skills", {
    method: "GET",
    params: { per_page: 100 },
  });

export const createAdminSkill = (data: { name: string }) =>
  apiRequest("/admin/skills", { method: "POST", data });

export const updateAdminSkill = (
  id: string | number,
  data: { name: string }
) => apiRequest(`/admin/skills/${id}`, { method: "PUT", data });

export const deleteAdminSkill = (id: string | number) =>
  apiRequest(`/admin/skills/${id}`, { method: "DELETE" });

export const getAdminSettings = () =>
  apiRequest("/admin/settings", { method: "GET" });

export const updateAdminProfile = (data: { name: string; email: string }) =>
  apiRequest("/admin/settings/profile", { method: "PUT", data });

export const updateAdminPassword = (data: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) => apiRequest("/admin/settings/password", { method: "PUT", data });

export const updateAdminNotifications = (data: Record<string, boolean>) =>
  apiRequest("/admin/settings/notifications", { method: "PUT", data });

export const updateAdminPrivacy = (data: { profile_visibility: boolean }) =>
  apiRequest("/admin/settings/privacy", { method: "PUT", data });

export const deleteAdminAccount = () =>
  apiRequest("/admin/settings/account", { method: "DELETE" });

export const getAdminAbuseReports = (params?: {
  status?: string;
  limit?: number;
  _?: number;
}) => apiRequest("/admin/reports/abuse", { method: "GET", params });

export const resolveAdminAbuseReport = (id: string | number, adminNote?: string | null) =>
  apiRequest(`/admin/reports/abuse/${id}/resolve`, {
    method: "PATCH",
    data: { admin_note: adminNote || null },
  });

export const dismissAdminAbuseReport = (id: string | number, adminNote?: string | null) =>
  apiRequest(`/admin/reports/abuse/${id}/dismiss`, {
    method: "PATCH",
    data: { admin_note: adminNote || null },
  });

export const getAdminSystemLogs = () =>
  apiRequest("/admin/system-logs", { method: "GET" });

export default API;
