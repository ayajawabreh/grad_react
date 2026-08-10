import { API } from "./api";

export interface MatchData {
  percentage: number | null;
  reasons?: string[];
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
}

export type ApplicantDetails = {
  application_id: number;
  status: string;

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
    return match.percentage ?? 0;
  }

  return match ?? 0;
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
    match: getMatchPercentage(a.match),
    skills: a.skills ?? [],
    email: a.email,
    applied_at: a.applied_at,
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

  return res.data.map(
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
    `/company/applicants/${id}`
  );

  console.log(
    "Applicant response:",
    res.data
  );

  const data = res.data;

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

    skills: resumeSkills,

    education: resumeEducation,

    experience: resumeExperience,

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
        data.match?.percentage ??
        (typeof data.match === "number"
          ? data.match
          : 0),

      matching_skills:
        data.match?.matching_skills ?? [],

      missing_skills:
        data.match?.missing_skills ?? [],

      reasons:
        data.match?.reasons ?? [],
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