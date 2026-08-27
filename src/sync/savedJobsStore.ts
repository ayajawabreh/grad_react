import { useSyncExternalStore } from "react";
import { API } from "../imports/api";

interface SavedJobsSnapshot {
  jobs: any[];
  ids: ReadonlySet<string>;
  loading: boolean;
  error: string;
  hydrated: boolean;
}

let snapshot: SavedJobsSnapshot = {
  jobs: [],
  ids: new Set(),
  loading: false,
  error: "",
  hydrated: false,
};

let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: Partial<SavedJobsSnapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

export function subscribeSavedJobs(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSavedJobsSnapshot() {
  return snapshot;
}

export function refreshSavedJobsCache(silent = true): Promise<void> {
  if (inFlight) return inFlight;
  if (!silent) emit({ loading: true, error: "" });

  inFlight = API.get("/student/saved-jobs")
    .then((response) => {
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.jobs ?? response.data?.data ?? [];
      const jobs = data.map((job: any) => ({ ...job, saved: true, is_saved: true }));
      emit({
        jobs,
        ids: new Set(jobs.map((job: any) => String(job.id ?? job.job_id))),
        loading: false,
        error: "",
        hydrated: true,
      });
    })
    .catch(() => {
      emit({ loading: false, error: "Failed to load saved jobs", hydrated: true });
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function setSavedJobState(jobId: string | number, saved: boolean) {
  const id = String(jobId);
  const ids = new Set(snapshot.ids);
  saved ? ids.add(id) : ids.delete(id);
  emit({
    ids,
    jobs: saved
      ? snapshot.jobs
      : snapshot.jobs.filter((job) => String(job.id ?? job.job_id) !== id),
  });
}

export function clearSavedJobsCache() {
  snapshot = { jobs: [], ids: new Set(), loading: false, error: "", hydrated: false };
  listeners.forEach((listener) => listener());
}

export function useSavedJobsCache() {
  return useSyncExternalStore(subscribeSavedJobs, getSavedJobsSnapshot, getSavedJobsSnapshot);
}
