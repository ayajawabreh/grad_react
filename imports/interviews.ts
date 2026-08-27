import { API } from "./api";

export interface BulkScheduleData {
  application_ids: number[];
  interview_date: string;
  start_time: string;
  duration: number;
  type: "Online" | "Onsite";
  meeting_link?: string;
  location?: string;
}

export function fetchInterviews() {
  return API.get("/company/interviews");
}

export function fetchInterviewStats() {
  return API.get("/company/interviews/stats");
}

export function fetchInterviewCalendar() {
  return API.get("/company/interviews/calendar");
}

export function getInterview(id: number) {
  return API.get(`/company/interviews/${id}`);
}

export function updateInterview(id: number, data: any) {
  return API.put(`/company/interviews/${id}`, data);
}

export function deleteInterview(id: number) {
  return API.delete(`/company/interviews/${id}`);
}

export function cancelInterview(id: number) {
  return API.patch(`/company/interviews/${id}/cancel`);
}

export function completeInterview(id: number) {
  return API.patch(`/company/interviews/${id}/complete`);
}

export function fetchInterviewFeedback(id: number) {
  return API.get(`/company/interviews/${id}/feedback`);
}

export function createInterviewFeedback(id: number, data: any) {
  return API.post(`/company/interviews/${id}/feedback`, data);
}

export function updateInterviewFeedback(id: number, data: any) {
  return API.put(`/company/interviews/${id}/feedback`, data);
}

export function deleteInterviewFeedback(id: number) {
  return API.delete(`/company/interviews/${id}/feedback`);
}

export function bulkScheduleInterviews(data: BulkScheduleData) {
  return API.post("/company/interviews/bulk-schedule", data);
}
