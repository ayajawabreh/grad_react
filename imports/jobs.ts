import { API } from "./api";

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
  department?: string | null;
  level?: string | null;
  description?: string | null;
  about?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;
  created_at: string;
  applications_count: number;
  is_saved?: boolean;
  min_experience_years?: number | string | null;
  max_experience_years?: number | string | null;
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
  description?: string;
  about?: string;
  responsibilities?: string;
  requirements?: string;
  minExperienceYears?: number | null;
  maxExperienceYears?: number | null;
}

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

function timeAgo(dateStr: string): string {
  const timestamp = new Date(dateStr).getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const diffMs = Date.now() - timestamp;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    return "Today";
  }

  if (days === 1) {
    return "1 day ago";
  }

  if (days < 30) {
    return `${days} days ago`;
  }

  const months = Math.floor(days / 30);

  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export function mapApiJobToUiJob(job: ApiJob): UiJob {
  return {
    id: job.id,

    title: job.title,

    company:
      job.company?.company_name ?? job.company?.name ?? "Unknown Company",

    dept: job.department ?? "General",

    type: job.employment_type,

    mode: job.work_mode,

    level: job.level ?? "",

    status: job.status,

    salary: job.salary ?? "Not specified",

    location: job.location ?? "Remote",

    posted: timeAgo(job.created_at),

    applicants: job.applications_count ?? 0,

    tags: job.skills?.map((skill) => skill.name) ?? [],

    color: pickColor(job.id),

    saved: job.is_saved ?? false,

    description: job.description ?? undefined,

    about: job.about ?? undefined,

    responsibilities: job.responsibilities ?? undefined,

    requirements: job.requirements ?? undefined,

    minExperienceYears:
      job.min_experience_years == null ? null : Number(job.min_experience_years),

    maxExperienceYears:
      job.max_experience_years == null ? null : Number(job.max_experience_years),
  };
}

export function formatExperienceRange(
  min?: number | string | null,
  max?: number | string | null,
): string {
  const normalizedMin = min == null || min === "" ? null : Number(min);
  const normalizedMax = max == null || max === "" ? null : Number(max);

  if (normalizedMin !== null && normalizedMax !== null) {
    return `${normalizedMin}–${normalizedMax} years of experience`;
  }
  if (normalizedMin !== null) return `At least ${normalizedMin} years`;
  if (normalizedMax !== null) return `Up to ${normalizedMax} years`;
  return "Experience not specified";
}

export async function fetchJobs(params?: {
  search?: string;
  types?: string[];
  modes?: string[];
  page?: number;
}): Promise<{
  jobs: UiJob[];
  total: number;
}> {
  const query = new URLSearchParams();

  if (params?.search) {
    query.append("search", params.search);
  }

  params?.types?.forEach((type) => {
    query.append("types[]", type);
  });

  params?.modes?.forEach((mode) => {
    query.append("modes[]", mode);
  });

  if (params?.page) {
    query.append("page", String(params.page));
  }

  const queryString = query.toString();

  const response = await API.get<ApiPaginated<ApiJob>>(
    queryString ? `/jobs?${queryString}` : "/jobs",
  );

  return {
    jobs: response.data.data.map(mapApiJobToUiJob),

    total: response.data.total,
  };
}

export async function fetchJob(id: string | number): Promise<UiJob> {
  const response = await API.get<ApiJob>(`/jobs/${id}`);

  return mapApiJobToUiJob(response.data);
}

export async function saveJob(id: string | number): Promise<void> {
  await API.post(`/jobs/${id}/save`);
}

export async function unsaveJob(id: string | number): Promise<void> {
  await API.delete(`/jobs/${id}/save`);
}

export async function checkJobSaved(id: string | number): Promise<boolean> {
  const response = await API.get<{
    saved: boolean;
  }>(`/jobs/${id}/saved`);

  return response.data.saved;
}

export async function fetchSavedJobs(): Promise<UiJob[]> {
  const response = await API.get<ApiJob[]>("/student/saved-jobs");

  return response.data.map(mapApiJobToUiJob);
}

export async function applyToJob(
  id: string | number,
  resumeId?: number,
): Promise<{
  message: string;
  application: any;
}> {
  const response = await API.post(
    `/jobs/${id}/apply`,
    resumeId
      ? {
          resume_id: resumeId,
        }
      : {},
  );

  return response.data;
}

export async function checkJobApplied(id: string | number): Promise<boolean> {
  const response = await API.get<{
    applied: boolean;
  }>(`/jobs/${id}/applied`);

  return response.data.applied;
}

export async function withdrawJobApplication(
  id: string | number,
): Promise<void> {
  await API.delete(`/jobs/${id}/apply`);
}

export async function fetchMyApplications(): Promise<MyApplicationsResponse> {
  const response = await API.get<MyApplicationsResponse>(
    "/student/applications",
  );

  return response.data;
}
