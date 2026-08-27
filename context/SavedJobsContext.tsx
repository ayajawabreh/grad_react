import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { useSyncRefresh } from "@/context/SyncContext";
import { API } from "@/imports/api";
import { saveJob, unsaveJob } from "@/imports/jobs";

export type SavedJob = Record<string, any> & { id: string | number; saved?: boolean };

type SavedJobsContextValue = {
  jobs: SavedJob[];
  savedJobIds: Set<string>;
  loading: boolean;
  error: string;
  refreshSavedJobs: () => Promise<void>;
  setJobSaved: (jobId: string | number, saved: boolean) => Promise<void>;
};

const SavedJobsContext = createContext<SavedJobsContextValue | null>(null);

function unwrapSavedJobs(payload: any): SavedJob[] {
  const list = Array.isArray(payload)
    ? payload
    : payload?.data?.data ?? payload?.data?.saved_jobs ?? payload?.data?.jobs
      ?? payload?.saved_jobs ?? payload?.jobs ?? payload?.data ?? [];
  return Array.isArray(list) ? list.map((job) => ({ ...job, saved: true, is_saved: true })) : [];
}

export function SavedJobsProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, role } = useAuth();
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [optimisticStates, setOptimisticStates] = useState<Record<string, boolean>>({});

  const refreshSavedJobs = useCallback(async () => {
    if (!isAuthenticated || role !== "student") return;
    try {
      const response = await API.get("/student/saved-jobs");
      setJobs(unwrapSavedJobs(response.data));
      setError("");
    } catch (requestError: any) {
      if (requestError?.response?.status !== 401) {
        setError("Failed to load saved jobs");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  // This subscription stays mounted for the entire authenticated app session,
  // regardless of which screen is currently visible.
  useSyncRefresh("saved_jobs", refreshSavedJobs);

  useEffect(() => {
    if (isAuthenticated && role === "student") {
      setLoading(true);
      void refreshSavedJobs();
    } else {
      setJobs([]);
      setError("");
      setLoading(false);
    }
  }, [isAuthenticated, refreshSavedJobs, role]);

  const setJobSaved = useCallback(async (jobId: string | number, saved: boolean) => {
    const key = String(jobId);
    setOptimisticStates((current) => ({ ...current, [key]: saved }));
    if (!saved) {
      setJobs((current) => current.filter((job) => String(job.id) !== String(jobId)));
    }

    try {
      if (saved) await saveJob(jobId);
      else await unsaveJob(jobId);
      await refreshSavedJobs();
    } catch (requestError: any) {
      if (requestError?.response?.status === 409) {
        await refreshSavedJobs();
        return;
      }
      await refreshSavedJobs();
      throw requestError;
    } finally {
      setOptimisticStates((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }, [refreshSavedJobs]);

  const savedJobIds = useMemo(() => {
    const ids = new Set(jobs.map((job) => String(job.id)));
    Object.entries(optimisticStates).forEach(([id, saved]) => {
      if (saved) ids.add(id);
      else ids.delete(id);
    });
    return ids;
  }, [jobs, optimisticStates]);

  const value = useMemo(() => ({
    jobs, savedJobIds, loading, error, refreshSavedJobs, setJobSaved,
  }), [error, jobs, loading, refreshSavedJobs, savedJobIds, setJobSaved]);

  return <SavedJobsContext.Provider value={value}>{children}</SavedJobsContext.Provider>;
}

export function useSavedJobs() {
  const value = useContext(SavedJobsContext);
  if (!value) throw new Error("useSavedJobs must be used inside SavedJobsProvider.");
  return value;
}
