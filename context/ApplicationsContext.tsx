import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { useSyncRefresh } from "@/context/SyncContext";
import {
  ApiApplication,
  ApplicationStats,
  applyToJob,
  fetchMyApplications,
  withdrawJobApplication,
} from "@/imports/jobs";

const EMPTY_STATS: ApplicationStats = { total: 0, active: 0, interviews: 0, offers: 0 };

type ApplicationsContextValue = {
  applications: ApiApplication[];
  stats: ApplicationStats;
  appliedJobIds: Set<string>;
  loading: boolean;
  error: string;
  refreshApplications: () => Promise<void>;
  setJobApplied: (jobId: string | number, applied: boolean) => Promise<void>;
};

const ApplicationsContext = createContext<ApplicationsContextValue | null>(null);

export function ApplicationsProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, role } = useAuth();
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [optimisticStates, setOptimisticStates] = useState<Record<string, boolean>>({});

  const refreshApplications = useCallback(async () => {
    if (!isAuthenticated || role !== "student") return;
    try {
      const result = await fetchMyApplications();
      setApplications(result.applications ?? []);
      setStats(result.stats ?? EMPTY_STATS);
      setError("");
    } catch (requestError: any) {
      if (requestError?.response?.status !== 401) setError("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  // Always mounted: application events from this device and every other
  // logged-in device invalidate the shared account cache immediately.
  useSyncRefresh("applications", refreshApplications);

  useEffect(() => {
    if (isAuthenticated && role === "student") {
      setLoading(true);
      void refreshApplications();
    } else {
      setApplications([]);
      setStats(EMPTY_STATS);
      setError("");
      setLoading(false);
      setOptimisticStates({});
    }
  }, [isAuthenticated, refreshApplications, role]);

  const setJobApplied = useCallback(async (jobId: string | number, applied: boolean) => {
    const key = String(jobId);
    setOptimisticStates((current) => ({ ...current, [key]: applied }));
    if (!applied) {
      setApplications((current) => current.filter(
        (application) => String(application.job_post_id) !== key,
      ));
    }

    try {
      if (applied) await applyToJob(jobId);
      else await withdrawJobApplication(jobId);
      await refreshApplications();
    } catch (requestError: any) {
      // Apply/withdraw are idempotent for the UI. Refetch on conflicts so the
      // backend remains the final source of truth.
      await refreshApplications();
      if (requestError?.response?.status !== 409) throw requestError;
    } finally {
      setOptimisticStates((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }, [refreshApplications]);

  const appliedJobIds = useMemo(() => {
    const ids = new Set(applications.map((application) => String(application.job_post_id)));
    Object.entries(optimisticStates).forEach(([id, applied]) => {
      if (applied) ids.add(id);
      else ids.delete(id);
    });
    return ids;
  }, [applications, optimisticStates]);

  const value = useMemo(() => ({
    applications, stats, appliedJobIds, loading, error, refreshApplications, setJobApplied,
  }), [applications, appliedJobIds, error, loading, refreshApplications, setJobApplied, stats]);

  return <ApplicationsContext.Provider value={value}>{children}</ApplicationsContext.Provider>;
}

export function useApplications() {
  const value = useContext(ApplicationsContext);
  if (!value) throw new Error("useApplications must be used inside ApplicationsProvider.");
  return value;
}
