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
  resume: any;
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

export function getMatchPercentage(
  match: number | MatchData | null | undefined
): number {
  if (typeof match === "object" && match !== null) {
    return match.percentage ?? 0;
  }

  return match ?? 0;
}

export function getMatchReasons(
  match: number | MatchData | null | undefined
): string[] {
  if (typeof match === "object" && match !== null) {
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

 console.log("RAW RESPONSE", res.data);

 return res.data.map(mapApiApplicantToUiApplicant);
}

export async function fetchApplicantDetails(
  id: number
): Promise<ApplicantDetails> {
  console.log("Fetching applicant id:", id);

  const res = await API.get<ApplicantDetails>(
    `/company/applicants/${id}`
  );

  console.log("Applicant response:", res.data);

  return res.data;
}

export async function fetchApplicantAISummary(
  id: number
): Promise<string> {
  const res = await API.get<{ summary: string }>(
    `/company/applicants/${id}/ai-summary`
  );

  return res.data.summary;
}

export async function fetchApplicantNotes(
  applicationId: number
): Promise<CompanyNote[]> {
  const res = await API.get<CompanyNote[]>(
    `/company/applicants/${applicationId}/notes`
  );

  return res.data;
}

export async function addApplicantNote(
  applicationId: number,
  note: string
): Promise<CompanyNote> {
  const res = await API.post<{ message: string; note: CompanyNote }>(
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
  const res = await API.put<{ message: string; note: CompanyNote }>(
    `/company/notes/${id}`,
    {
      note,
    }
  );

  return res.data.note;
}

export async function deleteApplicantNote(
  id: number
) {
  return API.delete(`/company/notes/${id}`);
}

export function shortlistApplicant(applicationId:number){
  return API.patch(
    `/company/applications/${applicationId}/shortlist`
  );
}

export function scheduleInterview(
  applicationId:number,
  data:any
){
  return API.post(
    "/company/interviews",
    {
      application_id: applicationId,
      ...data
    }
  );
}
export function fetchInterviews() {
  return API.get("/company/interviews");
}

export function updateApplicationStatus(
  applicationId: number,
  status: string
) {
  return API.put(`/company/applicants/${applicationId}/status`, {
    status,
  });
}