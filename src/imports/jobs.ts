/// <reference types="vite/client" />

import { API } from "./api";
import { refreshSavedJobsCache, setSavedJobState } from "../sync/savedJobsStore";
import { refreshApplicationsCache, setApplicationState } from "../sync/applicationsStore";

export interface ApiCompany {
  id: number;
  name?: string;
  company_name?: string;
  logo?: string | null;
}

export interface ApiSkill {
  id: number;
  name: string;
}

export interface ApiJob {
  id: number;
  title: string;

  employment_type: string;
  work_mode: string;
  status: string;

  salary?: string | null;
  location?: string | null;

  category_id?: number | null;
  category?: { id: number; name: string } | null;
  level?: string | null;

  description?: string | null;
  about?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;

  created_at: string;

  applications_count: number;
  is_saved?: boolean;
  min_experience_years?: number | null;
  max_experience_years?: number | null;

  company: ApiCompany;
  skills: ApiSkill[];
}


export interface ApiPaginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}


export interface UiJob {
  id: number;

  title: string;

  company: string;
  dept: string;

  type: string;
  mode: string;
  level: string;

  status: string;

  salary: string;
  location: string;

  posted: string;

  applicants: number;

  tags: string[];

  color: string;

  saved: boolean;

  applied?: boolean;
  min_experience_years?: number | null;
  max_experience_years?: number | null;

  description?: string;

  about?: string;

  responsibilities?: string;

  requirements?: string;
}


// =========================================
// Applications
// =========================================

export interface ApiApplication {
  id: number;
  job_post_id: number;
  title: string;
  company: string;
  logo: string | null;
  status: string;
  date: string;
}

export interface ApplicationStats {
  total: number;
  active: number;
  interviews: number;
  offers: number;
}

export interface MyApplicationsResponse {
  stats: ApplicationStats;
  applications: ApiApplication[];
}


const COLORS = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
];


function pickColor(seed: number) {
  return COLORS[seed % COLORS.length];
}


function timeAgo(dateStr: string) {

  const diffMs =
    Date.now() - new Date(dateStr).getTime();

  const days = Math.floor(
    diffMs / (1000 * 60 * 60 * 24)
  );


  if (days <= 0) return "Today";

  if (days === 1) return "1 day ago";

  if (days < 30)
    return `${days} days ago`;


  const months = Math.floor(days / 30);

  return months === 1
    ? "1 month ago"
    : `${months} months ago`;
}



export function mapApiJobToUiJob(
  job: ApiJob
): UiJob {

  return {

    id: job.id,

    title: job.title,


    company:
      job.company?.company_name ??
      job.company?.name ??
      "Unknown Company",


    dept:
      job.category?.name ??
      "General",


    type:
      job.employment_type,


    mode:
      job.work_mode,


    level:
      job.level ??
      "",


    status:
      job.status,


    salary:
      job.salary ??
      "Not specified",


    location:
      job.location ??
      "Remote",


    posted:
      timeAgo(job.created_at),


    applicants:
      job.applications_count ?? 0,


    tags:
      job.skills?.map(
        (s) => s.name
      ) ?? [],


    color:
      pickColor(job.id),


    saved:
      job.is_saved ?? false,

    min_experience_years: job.min_experience_years ?? null,
    max_experience_years: job.max_experience_years ?? null,


    description:
      job.description ??
      undefined,


    about:
      job.about ??
      undefined,


    responsibilities:
      job.responsibilities ??
      undefined,


    requirements:
      job.requirements ??
      undefined,
  };
}





export async function fetchJobs(params?: {

  search?: string;

  types?: string[];

  modes?: string[];

  categoryId?: number;

  page?: number;

}): Promise<{ jobs: UiJob[]; total: number }> {


  const query =
    new URLSearchParams();



  if (params?.search)
    query.append(
      "search",
      params.search
    );



  params?.types?.forEach((t) =>
    query.append(
      "types[]",
      t
    )
  );



  params?.modes?.forEach((m) =>
    query.append(
      "modes[]",
      m
    )
  );



  if (params?.page)
    query.append(
      "page",
      String(params.page)
    );



  const res =
    await API.get<ApiPaginated<ApiJob>>(
      `/jobs?${query.toString()}`
    );



  return {

    jobs:
      res.data.data.map(
        mapApiJobToUiJob
      ),

    total:
      res.data.total,

  };
}





export async function fetchJob(
  id: string | number
): Promise<UiJob> {


  const res =
    await API.get<ApiJob>(
      `/jobs/${id}`
    );


  return mapApiJobToUiJob(
    res.data
  );
}





export async function saveJob(
  id: string | number
): Promise<void> {


  await API.post(
    `/jobs/${id}/save`
  );

  if (params?.categoryId)
    query.append("category_id", String(params.categoryId));

  setSavedJobState(id, true);
  void refreshSavedJobsCache(true);

}





export async function unsaveJob(
  id: string | number
): Promise<void> {


  await API.delete(
    `/jobs/${id}/save`
  );

  setSavedJobState(id, false);
  void refreshSavedJobsCache(true);

}





export async function checkJobSaved(
  id: string | number
): Promise<boolean> {


  const res =
    await API.get<{ saved: boolean }>(
      `/jobs/${id}/saved`
    );


  return res.data.saved;

}





export async function fetchSavedJobs(): Promise<UiJob[]> {


  const res =
    await API.get<ApiJob[]>(
      `/student/saved-jobs`
    );


  return res.data.map(
    mapApiJobToUiJob
  );

}


// =========================================
// Apply Flow
// =========================================

export async function applyToJob(
  id: string | number,
  resumeId?: number
): Promise<{ message: string; application: any }> {

  setApplicationState(id, true);
  try {
    const res = await API.post(
    `/jobs/${id}/apply`,
    resumeId ? { resume_id: resumeId } : {}
    );
    void refreshApplicationsCache(true);
    return res.data;
  } catch (error) {
    setApplicationState(id, false);
    throw error;
  }
}


export async function checkJobApplied(
  id: string | number
): Promise<boolean> {

  const res = await API.get<{ applied: boolean }>(
    `/jobs/${id}/applied`
  );

  return res.data.applied;
}


export async function withdrawJobApplication(
  id: string | number
): Promise<void> {

  setApplicationState(id, false);
  try {
    await API.delete(`/jobs/${id}/apply`);
    void refreshApplicationsCache(true);
  } catch (error) {
    setApplicationState(id, true);
    throw error;
  }

}


export async function fetchMyApplications(): Promise<MyApplicationsResponse> {

  const res = await API.get<MyApplicationsResponse>(
    `/student/applications`
  );

  return res.data;

}
