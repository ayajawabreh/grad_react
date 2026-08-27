import { useEffect, useRef } from "react";
import { API } from "../imports/api";
import { useAuth } from "../context/AuthContext";
import { clearSavedJobsCache, refreshSavedJobsCache } from "./savedJobsStore";
import { clearApplicationsCache, refreshApplicationsCache } from "./applicationsStore";
import { SYNC_EVENT_NAME, type SyncEvent, type SyncEventDetail } from "./syncEvents";
export { SYNC_EVENT_NAME } from "./syncEvents";
export type { SyncEvent, SyncEventDetail } from "./syncEvents";

const DEFAULT_POLL_MS = 200;
const MAX_POLL_MS = 200;
const RETRY_MS = 2000;
const BATCH_MS = 30;

export function SyncListener() {
  const { isAuthenticated, user } = useAuth();
  const timerRef = useRef<number | null>(null);
  const batchTimerRef = useRef<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const queuedEventsRef = useRef<SyncEvent[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !localStorage.getItem("cb_token")) return;

    let stopped = false;
    let polling = false;
    const identity = String(user?.id ?? user?.email ?? "authenticated");
    const cursorKey = `careerbridge:sync-cursor:${identity}`;
    let cursor = Number(localStorage.getItem(cursorKey) || 0);

    const clearPollTimer = () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };

    const flushEvents = () => {
      batchTimerRef.current = null;
      const deduplicated = new Map<string, SyncEvent>();
      queuedEventsRef.current.forEach((event) => {
        const context = event.context ?? {};
        const key = [
          event.resource,
          context.application_id ?? "",
          context.job_id ?? "",
          context.company_id ?? "",
        ].join(":");
        deduplicated.set(key, event);
      });
      const events = [...deduplicated.values()];
      queuedEventsRef.current = [];
      if (!events.length || stopped) return;

      const hasSavedJobsEvent = events.some((event) =>
        event.resource?.toLowerCase() === "saved_jobs" ||
        event.path?.includes("/student/saved-jobs")
      );

      if (hasSavedJobsEvent) void refreshSavedJobsCache(true);

      const hasApplicationsEvent = events.some((event) =>
        event.resource?.toLowerCase() === "applications" ||
        event.path?.includes("/applications")
      );
      if (hasApplicationsEvent) void refreshApplicationsCache(true);

      const hasInterviewsEvent = events.some((event) =>
        event.resource?.toLowerCase() === "interviews" ||
        event.path?.includes("/interviews")
      );
      if (hasInterviewsEvent) void refreshApplicationsCache(true);

      window.dispatchEvent(
        new CustomEvent<SyncEventDetail>(SYNC_EVENT_NAME, {
          detail: {
            events,
            resources: [...new Set(events.map((event) => event.resource).filter(Boolean))],
            paths: [...new Set(events.map((event) => event.path).filter((path): path is string => Boolean(path)))],
          },
        })
      );
    };

    const queueEvents = (events: SyncEvent[]) => {
      if (!events.length) return;
      queuedEventsRef.current.push(...events);
      if (batchTimerRef.current == null) {
        batchTimerRef.current = window.setTimeout(flushEvents, BATCH_MS);
      }
    };

    const schedule = (delay: number, poll: () => Promise<void>) => {
      clearPollTimer();
      if (!stopped) timerRef.current = window.setTimeout(poll, delay);
    };

    const poll = async () => {
      if (stopped || polling) return;
      polling = true;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const response = await API.get("/sync/events", {
          params: { after_id: cursor },
          signal: controller.signal,
        });
        if (stopped) return;

        const data = response.data ?? {};
        const events = Array.isArray(data.events) ? data.events : [];
        const nextCursor = Number(data.cursor);
        if (Number.isFinite(nextCursor) && nextCursor >= cursor) {
          cursor = nextCursor;
          localStorage.setItem(cursorKey, String(cursor));
        }
        queueEvents(events);
        const serverPollMs = Number(data.poll_after_ms) || DEFAULT_POLL_MS;
        schedule(Math.max(100, Math.min(serverPollMs, MAX_POLL_MS)), poll);
      } catch (error: any) {
        if (!stopped && error?.code !== "ERR_CANCELED") schedule(RETRY_MS, poll);
      } finally {
        polling = false;
      }
    };

    const syncNow = () => {
      if (document.visibilityState !== "visible" || stopped) return;
      clearPollTimer();
      if (!polling) void poll();
    };

    document.addEventListener("visibilitychange", syncNow);
    window.addEventListener("focus", syncNow);
    window.addEventListener("online", syncNow);
    void poll();

    return () => {
      stopped = true;
      clearPollTimer();
      controllerRef.current?.abort();
      if (batchTimerRef.current != null) window.clearTimeout(batchTimerRef.current);
      queuedEventsRef.current = [];
      document.removeEventListener("visibilitychange", syncNow);
      window.removeEventListener("focus", syncNow);
      window.removeEventListener("online", syncNow);
    };
  }, [isAuthenticated, user?.email, user?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearSavedJobsCache();
      clearApplicationsCache();
    }
  }, [isAuthenticated]);

  return null;
}
