import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { supabase } from "../lib/supabase";

const TABLES = [
  "users", "students", "companies", "job_posts", "applications",
  "categories", "skills", "student_skills", "job_skills", "interviews",
  "notification_settings", "privacy_settings", "admin_notification_settings",
  "platform_settings", "notifications", "abuse_reports", "admin_activity_logs",
] as const;

const ROUTE_TABLES: Array<[RegExp, readonly string[]]> = [
  [/\/students?/, ["users", "students", "student_skills", "applications"]],
  [/\/companies?/, ["users", "companies", "job_posts", "applications"]],
  [/\/jobs?/, ["job_posts", "applications", "skills", "job_skills", "categories"]],
  [/\/applications?|\/applicants?|\/shortlisted/, ["applications", "job_posts", "students"]],
  [/\/interviews?/, ["interviews", "applications"]],
  [/\/categories?/, ["categories", "job_posts"]],
  [/\/skills?/, ["skills", "student_skills", "job_skills"]],
  [/\/analytics|\/company\/reports/, ["students", "companies", "job_posts", "applications", "interviews"]],
  [/\/admin\/reports/, ["abuse_reports"]],
  [/\/system-logs/, ["admin_activity_logs"]],
  [/\/notifications?/, ["notifications"]],
  [/\/settings?/, ["users", "companies", "students", "notification_settings", "privacy_settings", "admin_notification_settings", "platform_settings"]],
  [/\/profile/, ["users", "students", "companies", "student_skills"]],
  [/\/dashboard/, TABLES],
];

const UNSAFE_FORM_ROUTES = [
  /\/jobs\/create/,
  /\/jobs\/edit\//,
  /\/resume\/create/,
  /\/resume\/upload/,
  /\/messages?/,
  /\/ai(?:\/|$)/,
];

function tablesForPath(pathname: string): readonly string[] {
  if (UNSAFE_FORM_ROUTES.some((pattern) => pattern.test(pathname))) return [];
  return ROUTE_TABLES.find(([pattern]) => pattern.test(pathname))?.[1] ?? [];
}

/**
 * Keeps the active API-driven screen synchronized with changes made by the
 * mobile app or another browser. Supabase is primary; focus/visibility refresh
 * is the fallback. A debounced version prevents duplicate remounts when one
 * backend action updates several related tables.
 */
export function useCrossPlatformSync(scope: "student" | "company" | "admin") {
  const { pathname } = useLocation();
  const [version, setVersion] = useState(0);
  const pathnameRef = useRef(pathname);
  const timerRef = useRef<number | null>(null);
  const lastEventRef = useRef("");

  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  useEffect(() => {
    const refresh = () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setVersion((current) => current + 1);
        timerRef.current = null;
      }, 350);
    };

    const channel = supabase.channel(`careerbridge-${scope}-sync-${Date.now()}`);
    TABLES.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload: any) => {
          if (!tablesForPath(pathnameRef.current).includes(table)) return;
          const signature = `${table}:${payload.eventType}:${payload.commit_timestamp ?? ""}:${payload.new?.id ?? payload.old?.id ?? ""}`;
          if (signature === lastEventRef.current) return;
          lastEventRef.current = signature;
          refresh();
        }
      );
    });
    channel.subscribe();

    const refreshOnFocus = () => {
      if (tablesForPath(pathnameRef.current).length > 0) refresh();
    };
    const refreshOnVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        tablesForPath(pathnameRef.current).length > 0
      ) refresh();
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisibility);

    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisibility);
      supabase.removeChannel(channel);
    };
  }, [scope]);

  return version;
}
