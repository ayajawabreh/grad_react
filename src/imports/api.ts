import axios, { AxiosRequestConfig } from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export const API = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
  },
});

export const forgotPassword = (email: string) =>
  apiRequest<{ message: string }>("/forgot-password", {
    method: "POST",
    data: { email },
  });

export const resetPassword = (data: {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}) =>
  apiRequest<{ message: string }>("/reset-password", {
    method: "POST",
    data,
  });

export const verifyEmail = (userId: number, code: string) =>
  apiRequest<{ message: string }>("/verify-email", {
    method: "POST",
    data: { user_id: userId, code },
  });

export const resendVerification = (userId: number) =>
  apiRequest<{ message: string }>("/resend-verification", {
    method: "POST",
    data: { user_id: userId },
  });

API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("cb_token") ||
      localStorage.getItem("token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

async function apiRequest<T = any>(
  path: string,
  options: AxiosRequestConfig = {}
): Promise<T> {
  const response = await API({
    url: path,
    ...options,
  });

  return response.data;
}

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

export const reviewCV = async () => {
  return apiRequest("/ai/cv-review", {
    method: "POST",
    timeout: 30000,
  });
};

export const getJobRecommendations = async () => {
  return apiRequest("/ai/job-recommendations", {
    method: "GET",
  });
};

export const generateInterviewQuestions = async (jobId: number) => {
  return apiRequest("/ai/interview/questions", {
    method: "POST",
    data: {
      job_id: jobId,
    },
    timeout: 60000,
  });
};

export const submitInterviewAnswers = async (data: any) => {
  return apiRequest("/ai/interview/submit", {
    method: "POST",
    data,
    timeout: 60000,
  });
};

export const retakeInterviewQuiz = async (jobId: number) => {
  return apiRequest("/ai/interview/retake", {
    method: "POST",
    data: { job_id: jobId },
    timeout: 60000,
  });
};

export const getInterviewAttempts = async (jobId: number) => {
  return apiRequest("/ai/interview/attempts", {
    method: "GET",
    params: { job_id: jobId },
    timeout: 30000,
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

export const getJobDetails = async (id: string | number) => {
  return apiRequest(`/company/jobs/${id}`, {
    method: "GET",
  });
};

export const getSavedJobs = async () => {
  return apiRequest("/student/saved-jobs", {
    method: "GET",
  });
};

export const getJobApplicants = async () => {
  return apiRequest("/company/applicants", {
    method: "GET",
  });
};

export const shortlistApplicant = async (applicationId: number) => {
  return apiRequest(
    `/company/applications/${applicationId}/shortlist`,
    {
      method: "PATCH",
    }
  );
};

export const getShortlistedApplicants = async (jobId: number) => {
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

export const deleteJob = async (id: string | number) => {
  return apiRequest(`/company/jobs/${id}`, {
    method: "DELETE",
  });
};

export const generateJobDescription = async (data: any) => {
  return apiRequest("/company/jobs/generate-description", {
    method: "POST",
    data,
  });
};

export const getCompanyProfile = async () => {
  return apiRequest("/company/profile", {
    method: "GET",
  });
};

export const updateCompanyProfile = async (data: any) => {
  return apiRequest("/company/profile", {
    method: "POST",
    data,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

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


//admin
export const getAdminDashboard = async () => {
  return apiRequest("/admin/dashboard", {
    method: "GET",
  });
};

export const getAdminSystemLogs = async (params?: Record<string, unknown>) => {
  return apiRequest("/admin/system-logs", { method: "GET", params });
};

export const getAdminAnalytics = async (params?: Record<string, unknown>) => {
  return apiRequest("/admin/analytics", { method: "GET", params });
};

export const getAdminApplications = async (params?: Record<string, unknown>) => {
  return apiRequest("/admin/applications", { method: "GET", params });
};

export const getAdminCompanies = async (status?: string) => {
  return apiRequest("/admin/companies", {
    method: "GET",
    params: status ? { status } : undefined,
  });
};

export const getPendingCompanies = async () => {
  return apiRequest("/admin/companies/pending", {
    method: "GET",
  });
};

export const getAdminCompany = async (id: string | number) => {
  return apiRequest(`/admin/companies/${id}`, {
    method: "GET",
  });
};

export const approveCompany = async (id: string | number) => {
  return apiRequest(`/admin/companies/${id}/approve`, {
    method: "PATCH",
  });
};

export const rejectCompany = async (id: string | number) => {
  return apiRequest(`/admin/companies/${id}/reject`, {
    method: "PATCH",
  });
};

export const suspendCompany = async (id: string | number) => {
  return apiRequest(`/admin/companies/${id}/suspend`, {
    method: "PATCH",
  });
};

export const getAdminPlatformReport = async (
  period: "week" | "month" | "year" = "month"
) => {
  return apiRequest("/admin/reports/platform", {
    method: "GET",
    params: { period },
  });
};

export const getAdminAbuseReports = async (params?: {
  status?: string;
  entity_type?: string;
  risk_level?: string;
  limit?: number;
}) => {
  return apiRequest("/admin/reports/abuse", {
    method: "GET",
    params,
  });
};

export const getAdminAbuseReport = async (
  reportId: string | number
) => {
  return apiRequest(`/admin/reports/abuse/${reportId}`, {
    method: "GET",
  });
};

export const resolveAdminAbuseReport = async (
  reportId: string | number,
  admin_note?: string
) => {
  return apiRequest(`/admin/reports/abuse/${reportId}/resolve`, {
    method: "PATCH",
    data: {
      admin_note,
    },
  });
};

export const dismissAdminAbuseReport = async (
  reportId: string | number,
  admin_note?: string
) => {
  return apiRequest(`/admin/reports/abuse/${reportId}/dismiss`, {
    method: "PATCH",
    data: {
      admin_note,
    },
  });
};


export const getAdminJobsModeration = async (params?: {
  status?: string;
  search?: string;
}) => {
  return apiRequest("/admin/jobs/moderation", {
    method: "GET",
    params,
  });
};

export const getAdminJobModeration = async (
  jobId: string | number
) => {
  return apiRequest(`/admin/jobs/${jobId}/moderation`, {
    method: "GET",
  });
};

export const approveAdminJob = async (
  jobId: string | number
) => {
  return apiRequest(`/admin/jobs/${jobId}/approve`, {
    method: "PATCH",
  });
};

export const rejectAdminJob = async (
  jobId: string | number,
  note: string
) => {
  return apiRequest(`/admin/jobs/${jobId}/reject`, {
    method: "PATCH",
    data: { note },
  });
};

export const requestChangesAdminJob = async (
  jobId: string | number
) => {
  return apiRequest(`/admin/jobs/${jobId}/request-changes`, {
    method: "PATCH",
  });
};

export const suspendAdminJob = async (
  jobId: string | number
) => {
  return apiRequest(`/admin/jobs/${jobId}/suspend`, {
    method: "PATCH",
  });
};

export const restoreAdminJobToReview = async (
  jobId: string | number
) => {
  return apiRequest(`/admin/jobs/${jobId}/restore-review`, {
    method: "PATCH",
  });
};

export const deleteAdminJob = async (jobId: string | number) => {
  return apiRequest(`/admin/jobs/${jobId}`, { method: "DELETE" });
};

export const getAdminCategories = async () => {
  return apiRequest("/admin/categories", { method: "GET" });
};

export const getJobCategories = async () => {
  return apiRequest("/job-categories", { method: "GET" });
};

export const createAdminCategory = async (data: { name: string }) => {
  return apiRequest("/admin/categories", { method: "POST", data });
};

export const updateAdminCategory = async (id: string | number, data: { name: string }) => {
  return apiRequest(`/admin/categories/${id}`, { method: "PUT", data });
};

export const deleteAdminCategory = async (id: string | number) => {
  return apiRequest(`/admin/categories/${id}`, { method: "DELETE" });
};


export const getAdminSkills = async () => {
  return apiRequest("/admin/skills", {
    method: "GET",
    params: { per_page: 100 },
  });
};

export const getAdminSkill = async (
  skillId: string | number
) => {
  return apiRequest(`/admin/skills/${skillId}`, {
    method: "GET",
  });
};

export const createAdminSkill = async (data: {
  name: string;
}) => {
  return apiRequest("/admin/skills", {
    method: "POST",
    data,
  });
};

export const updateAdminSkill = async (
  skillId: string | number,
  data: {
    name: string;
  }
) => {
  return apiRequest(`/admin/skills/${skillId}`, {
    method: "PUT",
    data,
  });
};

export const deleteAdminSkill = async (
  skillId: string | number
) => {
  return apiRequest(`/admin/skills/${skillId}`, {
    method: "DELETE",
  });
};

// Admin Students

export const getAdminStudents = async () => {
  return apiRequest("/admin/students", {
    method: "GET",
  });
};

export const getAdminStudent = async (
  id: string | number
) => {
  return apiRequest(`/admin/students/${id}`, {
    method: "GET",
  });
};

export const approveStudent = async (
  id: string | number
) => {
  return apiRequest(`/admin/students/${id}/approve`, {
    method: "PATCH",
  });
};

export const rejectStudent = async (
  id: string | number
) => {
  return apiRequest(`/admin/students/${id}/reject`, {
    method: "PATCH",
  });
};

export const suspendStudent = async (
  id: string | number
) => {
  return apiRequest(`/admin/students/${id}/suspend`, {
    method: "PATCH",
  });
};

export const restoreStudent = async (
  id: string | number
) => {
  return apiRequest(`/admin/students/${id}/restore`, {
    method: "PATCH",
  });
};

export const activateStudent = async (
  id: string | number
) => {
  return apiRequest(`/admin/students/${id}/activate`, {
    method: "PATCH",
  });
};



export default API;
