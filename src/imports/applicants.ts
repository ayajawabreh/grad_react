import { API } from "./api";

export interface MatchData {
  percentage: number | null;
  reasons?: string[];
  match?: number | string | null;
  score?: number | string | null;
  matching_skills?: string[];
  missing_skills?: string[];
  warnings?: string[];
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
  skills: string[];
  email: string;
  applied_at: string | null;
  match_score?: number | null;
  matching_skills?: string[] | null;
  missing_skills?: string[] | null;
  match_analysis?: any;
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
  matching_skills: string[];
  missing_skills: string[];
  reasons: string[];
  warnings: string[];
}

export interface ResumeData {
  id?: number;
  title?: string;
  template?: string;
  full_name?: string;
  professional_title?: string;
  total_years_experience?: number | null;
  total_years_of_experience?: number | null;
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
}

export type ApplicantDetails = {
  application_id: number;
  status: string;
  total_years_of_experience?: number | null;
  total_years_experience?: number | null;
  job_title?: string;
  job?: { title?: string } | string;

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
    percentage: number | null;
    matching_skills: string[];
    missing_skills: string[];
    reasons: string[];
    warnings: string[];
    source?: string | null;
    recommendation_level?: string | null;
    available?: boolean | null;
    breakdown?: Record<string, unknown> | null;
  };

  education: any[];
  experience: any;
  projects: any[];
  certificates: any[];
  languages: any[];
  resume: ResumeData | null;
  notes: CompanyNote[];
  timeline: any[];
  ai_summary?: string;
};

export interface CompanyNote {
  id: number;
  note: string;
  created_at?: string;
  updated_at?: string;
}

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

  if (
    parsed === null ||
    parsed === undefined ||
    parsed === ""
  ) {
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
          return skill;
        }

        if (skill && typeof skill === "object") {
          return (
            skill.name ||
            skill.title ||
            skill.skill ||
            ""
          );
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

    experience: parseResumeField(
      resume.experience,
      []
    ),

    education: normalizeArray(
      resume.education
    ),

    projects: normalizeArray(
      resume.projects
    ),

    certificates: normalizeArray(
      resume.certificates
    ),

    languages: normalizeArray(
      resume.languages
    ),
  };
}

export function getMatchPercentage(
  match: number | MatchData | null | undefined
): number {
  if (
    typeof match === "object" &&
    match !== null
  ) {
    const value = match.percentage ?? match.match ?? match.score;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  const numeric = Number(match);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function getMatchReasons(
  match: number | MatchData | null | undefined
): string[] {
  if (
    typeof match === "object" &&
    match !== null
  ) {
    return match.reasons ?? [];
  }

  return [];
}

export function mapApiApplicantToUiApplicant(
  a: ApiApplicant
): UiApplicant {
  return {
    id: a.id,
    application_id: a.application_id,
    name: a.name,
    title: a.title ?? "",
    university: a.university ?? "",
    location: a.location ?? "",
    avatar: a.avatar,
    job: a.job,
    status: a.status,
    match: Number(a.match_score ?? getMatchPercentage(a.match) ?? 0),
    skills: a.skills ?? [],
    email: a.email,
    applied_at: a.applied_at,
    matching_skills: a.matching_skills ?? a.match_analysis?.matching_skills ?? [],
    missing_skills: a.missing_skills ?? a.match_analysis?.missing_skills ?? [],
    reasons: a.match_analysis?.reasons ?? getMatchReasons(a.match) ?? [],
    warnings: a.match_analysis?.warnings ?? [],
  };
}

export async function fetchApplicants(): Promise<UiApplicant[]> {
  const res = await API.get(
    "/company/applicants"
  );

  console.log(
    "RAW RESPONSE",
    res.data
  );

  const list = Array.isArray(res.data) ? res.data : res.data?.applicants ?? res.data?.data ?? [];
  return list.map(
    mapApiApplicantToUiApplicant
  );
}

export async function fetchApplicantDetails(
  id: number
): Promise<ApplicantDetails> {
  console.log(
    "Fetching applicant id:",
    id
  );

  const res = await API.get(
    `/company/applicants/${id}/details`
  );

  console.log(
    "Applicant response:",
    res.data
  );

  const data = res.data ?? {};
  const backendMatch = data?.match && typeof data.match === "object" ? data.match : null;

  const resume = normalizeResume(
    data.resume
  );

  const resumeSkills = normalizeSkills(
    resume?.skills
  );

  const resumeExperience = parseResumeField(
    resume?.experience,
    []
  );

  const resumeEducation = normalizeArray(
    resume?.education
  );

  const resumeProjects = normalizeArray(
    resume?.projects
  );

  const resumeCertificates = normalizeArray(
    resume?.certificates
  );

  const resumeLanguages = normalizeArray(
    resume?.languages
  );

  const normalizedData: ApplicantDetails = {
    ...data,

    resume,

    skills: normalizeSkills(data.skills),

    education: resumeEducation,

    experience: normalizeArray(data.experience).length > 0 ? normalizeArray(data.experience) : resumeExperience,

    projects: resumeProjects,

    certificates: resumeCertificates,

    languages: resumeLanguages,

    student: {
      ...(data.student || {}),
      university:
        data.student?.university || "",
      major:
        data.student?.major || "",
    },

    match: {
      percentage:
        typeof backendMatch?.percentage === "number" ? backendMatch.percentage : null,

      matching_skills: Array.isArray(backendMatch?.matching_skills) ? backendMatch.matching_skills : [],

      missing_skills: Array.isArray(backendMatch?.missing_skills) ? backendMatch.missing_skills : [],

      reasons: Array.isArray(backendMatch?.reasons) ? backendMatch.reasons : [],
      warnings: Array.isArray(backendMatch?.warnings) ? backendMatch.warnings : [],
      source: backendMatch?.source ?? null,
      recommendation_level: backendMatch?.recommendation_level ?? null,
      available: typeof backendMatch?.available === "boolean" ? backendMatch.available : null,
      breakdown: backendMatch?.breakdown && typeof backendMatch.breakdown === "object" ? backendMatch.breakdown : null,
    },

    notes: Array.isArray(data.notes)
      ? data.notes
      : [],

    timeline: Array.isArray(
      data.timeline
    )
      ? data.timeline
      : [],
  };

  console.log(
    "NORMALIZED RESUME:",
    normalizedData.resume
  );

  console.log(
    "RESUME SKILLS:",
    normalizedData.resume?.skills
  );

  console.log(
    "RESUME EDUCATION:",
    normalizedData.resume?.education
  );

  console.log(
    "RESUME EXPERIENCE:",
    normalizedData.resume?.experience
  );

  console.log(
    "RESUME PROJECTS:",
    normalizedData.resume?.projects
  );

  console.log(
    "RESUME CERTIFICATES:",
    normalizedData.resume?.certificates
  );

  console.log(
    "RESUME LANGUAGES:",
    normalizedData.resume?.languages
  );

  return normalizedData;
}

export async function fetchApplicantAISummary(
  id: number
): Promise<string> {
  const res = await API.get<{
    summary: string;
  }>(
    `/company/applicants/${id}/ai-summary`
  );

  return res.data.summary;
}

export async function fetchApplicantNotes(
  applicationId: number
): Promise<CompanyNote[]> {
  const res =
    await API.get<CompanyNote[]>(
      `/company/applicants/${applicationId}/notes`
    );

  return res.data;
}

export async function addApplicantNote(
  applicationId: number,
  note: string
): Promise<CompanyNote> {
  const res = await API.post<{
    message: string;
    note: CompanyNote;
  }>(
    `/company/applicants/${applicationId}/notes`,
    {
      note,
    }
  );

  return res.data.note;
}

export async function updateApplicantNote(
  id: number,
  note: string
): Promise<CompanyNote> {
  const res = await API.put<{
    message: string;
    note: CompanyNote;
  }>(
    `/company/notes/${id}`,
    {
      note,
    }
  );

  return res.data.note;
}

export function deleteApplicantNote(
  id: number
) {
  return API.delete(
    `/company/notes/${id}`
  );
}

export function shortlistApplicant(
  applicationId: number
) {
  return API.patch(
    `/company/applications/${applicationId}/shortlist`
  );
}

export function scheduleInterview(
  applicationId: number,
  data: any
) {
  return API.post(
    "/company/interviews",
    {
      application_id: applicationId,
      ...data,
    }
  );
}

export function fetchInterviews() {
  return API.get(
    "/company/interviews"
  );
}

export function updateApplicationStatus(
  applicationId: number,
  status: string
) {
  return API.put(
    `/company/applicants/${applicationId}/status`,
    {
      status,
    }
  );
}
