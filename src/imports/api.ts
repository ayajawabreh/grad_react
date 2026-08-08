import axios, { AxiosRequestConfig } from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export const API = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
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

export const updateCompanyProfile = async (data:any)=>{
 return apiRequest("/company/profile",{
   method:"POST",
   data,
   headers:{
     "Content-Type":"multipart/form-data",
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

export default API;