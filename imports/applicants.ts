import { API } from "./api";

export interface MatchData {
  percentage: number | null;
  reasons?: string[];
  matching_skills?: string[];
  missing_skills?: string[];
  recommendation_level?: string;
  breakdown?: Record<string, unknown>;
  warnings?: string[];
  source?: string;
}

export interface ApiApplicant {
  id: number;
  application_id: number;
  name: string;
  title: string | null;
  university: string | null;
  location: string | null;
  avatar: string | null;
  job_id: number;
  job: string;
  status: string;
  match: number | MatchData;
  match_score?: number | null;
  match_analysis?: MatchData | null;
  skills: string[];
  email: string;
  applied_at: string | null;
}

export interface UiApplicant {
  id: number;
  application_id: number;
  name: string;
  title: string;
  university: string;
  location: string;
  avatar: string | null;
  job: string;
  status: string;
  match: number;
  skills: string[];
  email: string;
  applied_at: string | null;
}

export interface ResumeData {
  id?: number;
  title?: string;
  template?: string;
  full_name?: string;
  professional_title?: string;
  summary?: string;
  file_path?: string | null;
  file_url?: string | null;
  url?: string | null;
  skills?: any[];
  experience?: any;
  education?: any[];
  projects?: any[];
  certificates?: any[];
  languages?: any[];
  is_public?: boolean;
  updated_at?: string;
  total_years_of_experience?: number;
  total_years_experience?: number;
}

export interface CompanyNote {
  id: number;
  note: string;
  created_at?: string;
  updated_at?: string;
}

export type ApplicantDetails = {
  application_id: number;
  status: string;
  total_years_of_experience?: number;
  total_years_experience?: number;

  student: {
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    headline?: string;
    university?: string;
    major?: string;
    gpa?: string;
    location?: string;
    portfolio?: string;
    linkedin?: string;
    github?: string;
    bio?: string;
  };

  skills: string[];

  match: {
    percentage: number;
    matching_skills: string[];
    missing_skills: string[];
    reasons: string[];
    recommendation_level?: string;
    breakdown?: Record<string, unknown>;
    warnings?: string[];
    source?: string;
  };

  education: any[];
  experience: any;
  projects: any[];
  certificates: any[];
  languages: any[];
  resume: ResumeData | null;
  notes: CompanyNote[];
  timeline: any[];
  ai_summary?: string | null;
};

function parseResumeField(value: any, fallback: any = []) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeArray(value: any): any[] {
  const parsed = parseResumeField(value, []);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed === null || parsed === undefined || parsed === "") {
    return [];
  }

  return [parsed];
}

function normalizeSkills(value: any): string[] {
  const parsed = parseResumeField(value, []);

  if (Array.isArray(parsed)) {
    return parsed
      .map((skill) => {
        if (typeof skill === "string") {
          return skill.trim();
        }

        if (skill && typeof skill === "object") {
          return skill.name || skill.title || skill.skill || "";
        }

        return "";
      })
      .filter(Boolean);
  }

  if (typeof parsed === "string") {
    return parsed
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeResume(resume: any): ResumeData | null {
  if (!resume) {
    return null;
  }

  return {
    ...resume,
    skills: normalizeSkills(resume.skills),
    experience: parseResumeField(resume.experience, []),
    education: normalizeArray(resume.education),
    projects: normalizeArray(resume.projects),
    certificates: normalizeArray(resume.certificates),
    languages: normalizeArray(resume.languages),
  };
}

export function getMatchPercentage(
  match: number | MatchData | null | undefined,
): number {
  if (typeof match === "object" && match !== null) {
    return match.percentage ?? 0;
  }

  return match ?? 0;
}

export function getMatchReasons(
  match: number | MatchData | null | undefined,
): string[] {
  if (typeof match === "object" && match !== null) {
    return match.reasons ?? [];
  }

  return [];
}

export function mapApiApplicantToUiApplicant(
  applicant: ApiApplicant,
): UiApplicant {
  return {
    id: applicant.id,
    application_id: applicant.application_id,
    name: applicant.name,
    title: applicant.title ?? "",
    university: applicant.university ?? "",
    location: applicant.location ?? "",
    avatar: applicant.avatar,
    job: applicant.job,
    status: applicant.status,
    match:
      typeof applicant.match === "object" && applicant.match !== null
        ? applicant.match.percentage ?? applicant.match_score ?? 0
        : applicant.match ?? applicant.match_score ?? 0,
    skills: applicant.skills ?? [],
    email: applicant.email,
    applied_at: applicant.applied_at,
  };
}

export async function fetchApplicants(): Promise<UiApplicant[]> {
  const response = await API.get("/company/applicants");

  console.log("RAW APPLICANTS RESPONSE:", response.data);

  const data = response.data;

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(mapApiApplicantToUiApplicant);
}

export async function fetchApplicantDetails(
  id: number,
): Promise<ApplicantDetails> {
  console.log("Fetching applicant id:", id);

  const response = await API.get(`/company/applicants/${id}/details`);

  console.log("Applicant response:", response.data);

  const data = response.data;
  const matchAnalysis = data?.match_analysis ?? (typeof data?.match === "object" ? data.match : {});

  const resume = normalizeResume(data?.resume);

  const resumeSkills = normalizeSkills(resume?.skills);

  const resumeExperience = parseResumeField(data?.experience ?? resume?.experience, []);

  const resumeEducation = normalizeArray(resume?.education);

  const resumeProjects = normalizeArray(resume?.projects);

  const resumeCertificates = normalizeArray(resume?.certificates);

  const resumeLanguages = normalizeArray(resume?.languages);

  const normalizedData: ApplicantDetails = {
    ...data,

    resume,

    skills: resumeSkills,

    education: resumeEducation,

    experience: resumeExperience,

    projects: resumeProjects,

    certificates: resumeCertificates,

    languages: resumeLanguages,

    student: {
      ...(data?.student || {}),
      name: data?.student?.name || "",
      email: data?.student?.email || "",
      university: data?.student?.university || "",
      major: data?.student?.major || "",
    },

    match: {
      percentage:
        (typeof data?.match === "object" ? data.match?.percentage : undefined) ??
        matchAnalysis?.percentage ??
        data?.match_score ??
        (typeof data?.match === "number" ? data.match : 0),

      matching_skills: matchAnalysis?.matching_skills ?? data?.matching_skills ?? [],

      missing_skills: matchAnalysis?.missing_skills ?? data?.missing_skills ?? [],

      reasons: matchAnalysis?.reasons ?? data?.reasons ?? [],

      recommendation_level: matchAnalysis?.recommendation_level ?? data?.recommendation_level,

      breakdown: matchAnalysis?.breakdown ?? data?.breakdown,

      warnings: matchAnalysis?.warnings ?? data?.warnings ?? [],
      source: matchAnalysis?.source ?? data?.match_source,
    },

    notes: Array.isArray(data?.notes) ? data.notes : [],

    timeline: Array.isArray(data?.timeline) ? data.timeline : [],
  };

  console.log("NORMALIZED APPLICANT:", normalizedData);

  return normalizedData;
}

export async function fetchApplicantAISummary(id: number): Promise<string> {
  const response = await API.get<{
    summary: string;
  }>(`/company/applicants/${id}/ai-summary`);

  return response.data.summary;
}

export async function fetchApplicantNotes(
  applicationId: number,
): Promise<CompanyNote[]> {
  const response = await API.get<CompanyNote[]>(
    `/company/applicants/${applicationId}/notes`,
  );

  return response.data;
}

export async function addApplicantNote(
  applicationId: number,
  note: string,
): Promise<CompanyNote> {
  const response = await API.post<{
    message: string;
    note: CompanyNote;
  }>(`/company/applicants/${applicationId}/notes`, {
    note,
  });

  return response.data.note;
}

export async function updateApplicantNote(
  id: number,
  note: string,
): Promise<CompanyNote> {
  const response = await API.put<{
    message: string;
    note: CompanyNote;
  }>(`/company/notes/${id}`, {
    note,
  });

  return response.data.note;
}

export function deleteApplicantNote(id: number) {
  return API.delete(`/company/notes/${id}`);
}

export function shortlistApplicant(applicationId: number) {
  return API.patch(`/company/applications/${applicationId}/shortlist`);
}

export function scheduleInterview(applicationId: number, data: any) {
  return API.post("/company/interviews", {
    application_id: applicationId,
    ...data,
  });
}

export function updateApplicationStatus(applicationId: number, status: string) {
  return API.put(`/company/applicants/${applicationId}/status`, {
    status,
  });
}
