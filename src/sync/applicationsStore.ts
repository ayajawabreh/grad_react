import { useSyncExternalStore } from "react";
import { API } from "../imports/api";
import type { ApiApplication, ApplicationStats, MyApplicationsResponse } from "../imports/jobs";

interface ApplicationsSnapshot {
  applications: ApiApplication[];
  stats: ApplicationStats;
  jobIds: ReadonlySet<string>;
  loading: boolean;
  error: string;
  hydrated: boolean;
}

const emptyStats: ApplicationStats = { total: 0, active: 0, interviews: 0, offers: 0 };
let snapshot: ApplicationsSnapshot = {
  applications: [], stats: emptyStats, jobIds: new Set(), loading: false, error: "", hydrated: false,
};
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: Partial<ApplicationsSnapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

export function getApplicationsSnapshot() { return snapshot; }
export function subscribeApplications(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function refreshApplicationsCache(silent = true): Promise<void> {
  if (inFlight) return inFlight;
  if (!silent) emit({ loading: true, error: "" });

  inFlight = API.get<MyApplicationsResponse>("/student/applications")
    .then(({ data }) => {
      const applications = Array.isArray(data) ? data : data?.applications ?? [];
      const stats = Array.isArray(data) ? { ...emptyStats, total: data.length } : data?.stats ?? emptyStats;
      emit({
        applications,
        stats,
        jobIds: new Set(applications.map((app) => String(app.job_post_id))),
        loading: false,
        error: "",
        hydrated: true,
      });
    })
    .catch(() => emit({ loading: false, error: "Failed to load applications", hydrated: true }))
    .finally(() => { inFlight = null; });
  return inFlight;
}

export function setApplicationState(jobId: string | number, applied: boolean) {
  const id = String(jobId);
  const jobIds = new Set(snapshot.jobIds);
  const hadApplication = jobIds.has(id);
  applied ? jobIds.add(id) : jobIds.delete(id);
  emit({
    jobIds,
    applications: applied
      ? snapshot.applications
      : snapshot.applications.filter((app) => String(app.job_post_id) !== id),
    stats: {
      ...snapshot.stats,
      total: Math.max(0, snapshot.stats.total + (applied && !hadApplication ? 1 : !applied && hadApplication ? -1 : 0)),
    },
  });
}

export function clearApplicationsCache() {
  snapshot = { applications: [], stats: emptyStats, jobIds: new Set(), loading: false, error: "", hydrated: false };
  listeners.forEach((listener) => listener());
}

export function useApplicationsCache() {
  return useSyncExternalStore(subscribeApplications, getApplicationsSnapshot, getApplicationsSnapshot);
}
