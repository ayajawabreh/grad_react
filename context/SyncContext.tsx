import { usePathname } from "expo-router";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Network from "expo-network";

import { API } from "@/imports/api";
import { useAuth } from "@/context/AuthContext";

export type SyncResource =
  | "messages"
  | "conversations"
  | "jobs"
  | "applications"
  | "interviews"
  | "student"
  | "company"
  | "admin"
  | "notifications"
  | "saved_jobs"
  | "resume";

type SyncEvent = {
  id: number;
  resource?: string;
  action?: string;
  path?: string;
  actor_id?: string | number;
  context?: Record<string, unknown>;
};

type SyncResponse = {
  events?: SyncEvent[];
  cursor?: number;
  poll_after_ms?: number;
  data?: SyncResponse;
};

type Subscriber = {
  resources: Set<string>;
  path: string;
  jobId?: string;
  refresh: () => void | Promise<void>;
};

function runRefreshSafely(refresh: () => void | Promise<void>) {
  try {
    Promise.resolve(refresh()).catch((error: any) => {
      if (__DEV__ && error?.response?.status && error.response.status !== 401) {
        console.warn("[Sync] background refetch failed:", error.message);
      }
    });
  } catch (error: any) {
    if (__DEV__) console.warn("[Sync] background refetch failed:", error?.message ?? error);
  }
}

const SyncContext = createContext<{
  subscribe: (subscriber: Subscriber) => () => void;
} | null>(null);

// Polling every 200ms flooded the local Laravel server with five requests per
// second and delayed the real page requests. A short, bounded interval keeps
// cross-device updates responsive without starving navigation requests.
const POLL_MS = 3000;
const MIN_POLL_MS = 2000;
const MAX_POLL_MS = 10000;
const RETRY_MS = 2000;
const BATCH_MS = 30;

function normalizeResource(event: SyncEvent) {
  const path = String(event.path ?? "").toLowerCase();
  if (path.includes("/saved-jobs") || path.includes("/saved_jobs")) return "saved_jobs";
  if (path.includes("/resume")) return "resume";
  const explicit = String(event.resource ?? "").trim().toLowerCase();
  if (["saved-jobs", "savedjobs", "saved_job"].includes(explicit)) return "saved_jobs";
  if (explicit) return explicit;
  const match = String(event.path ?? "").match(
    /\/(messages|conversations|jobs|applications|interviews|notifications|student|company|admin)(?:\/|$)/i,
  );
  return match?.[1]?.toLowerCase() ?? "unknown";
}

export function SyncProvider({ children }: PropsWithChildren) {
  const { token, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const subscribers = useRef(new Set<Subscriber>());
  const cursor = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const batchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingResources = useRef(new Set<string>());
  const pendingJobIds = useRef(new Set<string>());
  const stopped = useRef(true);
  const inFlight = useRef(false);
  const foreground = useRef(true);
  const [, setReady] = useState(false);

  const subscribe = useCallback((subscriber: Subscriber) => {
    subscribers.current.add(subscriber);
    return () => subscribers.current.delete(subscriber);
  }, []);

  const flush = useCallback(() => {
    batchTimer.current = null;
    const resources = new Set(pendingResources.current);
    pendingResources.current.clear();
    const jobIds = new Set(pendingJobIds.current);
    pendingJobIds.current.clear();
    const known = new Set([
      "messages", "conversations", "jobs", "applications", "interviews",
      "student", "company", "admin", "notifications", "saved_jobs", "resume",
    ]);
    const hasUnknown = [...resources].some((item) => !known.has(item));

    subscribers.current.forEach((subscriber) => {
      const matchesResource = [...resources].some((resource) =>
        subscriber.resources.has(resource) ||
        (resource === "messages" && subscriber.resources.has("conversations")) ||
        (resource === "conversations" && subscriber.resources.has("messages")),
      );
      const isOpenScreen = subscriber.path === pathnameRef.current;
      const targetsAnotherJob =
        resources.has("jobs") &&
        subscriber.jobId &&
        jobIds.size > 0 &&
        !jobIds.has(subscriber.jobId);
      if (!targetsAnotherJob && (matchesResource || (hasUnknown && isOpenScreen))) {
        runRefreshSafely(subscriber.refresh);
      }
    });
  }, []);

  const enqueue = useCallback((events: SyncEvent[]) => {
    events.forEach((event) => {
      pendingResources.current.add(normalizeResource(event));
      const jobId = event.context?.job_id ?? event.context?.id;
      if (normalizeResource(event) === "jobs" && jobId != null) {
        pendingJobIds.current.add(String(jobId));
      }
    });
    if (events.length && !batchTimer.current) {
      batchTimer.current = setTimeout(flush, BATCH_MS);
    }
  }, [flush]);

  useEffect(() => {
    stopped.current = !(isAuthenticated && token);
    if (stopped.current) {
      cursor.current = 0;
      if (timer.current) clearTimeout(timer.current);
      if (batchTimer.current) clearTimeout(batchTimer.current);
      pendingResources.current.clear();
      pendingJobIds.current.clear();
      return;
    }

    let disposed = false;
    const activeToken = token!;
    cursor.current = 0;
    foreground.current = AppState.currentState === "active";

    const schedule = (delay: number) => {
      if (disposed || stopped.current || !foreground.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(poll, delay);
    };

    const poll = async () => {
      if (disposed || stopped.current || inFlight.current || !foreground.current) return;
      inFlight.current = true;
      try {
        const response = await API.get<SyncResponse>("/sync/events", {
          params: { after_id: cursor.current },
          headers: { Authorization: `Bearer ${activeToken}`, Accept: "application/json" },
        });
        // Support both the documented response and Laravel resources wrapped
        // in a top-level `data` property.
        const envelope = response.data ?? {};
        const data = envelope.data && !Array.isArray(envelope.data)
          ? envelope.data
          : envelope;
        const events = Array.isArray(data.events) ? data.events : [];
        if (__DEV__ && events.length) {
          console.log("[Sync] received events:", events);
          events.forEach((event) => console.log(
            "[Sync] event resource/action:",
            event.resource,
            event.action,
          ));
        }
        enqueue(events);
        if (Number.isFinite(Number(data.cursor))) {
          cursor.current = Number(data.cursor);
        }
        // Respect slower backend hints, but never poll fast enough to compete
        // with page navigation and data-loading requests.
        const serverPollMs = Number(data.poll_after_ms) || POLL_MS;
        schedule(Math.max(MIN_POLL_MS, Math.min(serverPollMs, MAX_POLL_MS)));
      } catch (error: any) {
        const status = error?.response?.status;

        // A 404 means this backend build does not expose the optional sync
        // endpoint. Do not keep polling a route that is not installed.
        if (status === 404) {
          stopped.current = true;
          if (__DEV__) {
            console.warn("[Sync] /sync/events is unavailable; polling disabled.");
          }
        } else if (status !== 401) {
          schedule(RETRY_MS);
        }
      } finally {
        inFlight.current = false;
      }
    };

    setReady((value) => !value);
    void poll();

    const onAppStateChange = (state: AppStateStatus) => {
      foreground.current = state === "active";
      if (foreground.current) {
        if (timer.current) clearTimeout(timer.current);
        void poll();
      } else if (timer.current) {
        clearTimeout(timer.current);
      }
    };
    const appStateSubscription = AppState.addEventListener("change", onAppStateChange);
    const networkSubscription = Network.addNetworkStateListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      if (online && foreground.current) {
        // Let any failed in-flight request finish before polling immediately.
        schedule(250);
      } else if (!online && timer.current) {
        clearTimeout(timer.current);
      }
    });

    return () => {
      disposed = true;
      stopped.current = true;
      appStateSubscription.remove();
      networkSubscription.remove();
      if (timer.current) clearTimeout(timer.current);
      if (batchTimer.current) clearTimeout(batchTimer.current);
    };
  }, [enqueue, isAuthenticated, token]);

  return <SyncContext.Provider value={{ subscribe }}>{children}</SyncContext.Provider>;
}

export function useSyncRefresh(
  resources: SyncResource | SyncResource[],
  refresh: () => void | Promise<void>,
  options?: { jobId?: string | number },
) {
  const context = useContext(SyncContext);
  const pathname = usePathname();
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const resourceKey = Array.isArray(resources) ? resources.join("|") : resources;

  useEffect(() => {
    if (!context) throw new Error("useSyncRefresh must be used inside SyncProvider.");
    return context.subscribe({
      resources: new Set(resourceKey.split("|")),
      path: pathname,
      jobId: options?.jobId == null ? undefined : String(options.jobId),
      refresh: () => refreshRef.current(),
    });
  }, [context, pathname, resourceKey, options?.jobId]);
}
