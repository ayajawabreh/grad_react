import { API } from "./api";

export const getOverviewReport = async () => {
  const { data } = await API.get("/company/reports/overview");
  return data;
};

export const getJobsReport = async () => {
  const { data } = await API.get("/company/reports/jobs");
  return data;
};

export const getPipelineReport = async () => {
  const { data } = await API.get("/company/reports/pipeline");
  return data;
};

export const getMonthlyApplicationsReport = async () => {
  const { data } = await API.get("/company/reports/monthly-applications");
  return data;
};