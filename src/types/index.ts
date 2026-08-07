export type Role = "student" | "company" | "admin";

export interface Job {
  id: number;
  title: string;
  company: string;
  dept: string;
  type: string;
  level: string;
  location: string;
  mode: string;
  salary: string;
  posted: string;
  status: string;
  applicants: number;
  views: number;
  match: number;
  color: string;
  tags: string[];
  shortlisted?: number;
}

export interface Candidate {
  id: number;
  name: string;
  title: string;
  univ: string;
  location: string;
  match: number;
  status: string;
  job: string;
  avatar: string;
  skills: string[];
  exp: string;
  email: string;
}

export interface Interview {
  id: number;
  name: string;
  role: string;
  type: string;
  date: string;
  time: string;
  duration: string;
  status: string;
  avatar: string;
}

export interface ChartPoint {
  month: string;
  v: number;
  h: number;
}

export interface PipelinePoint {
  name: string;
  value: number;
  color: string;
}
