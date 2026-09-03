import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { Btn, StatCard } from "../../components/ui";
import { JobCard } from "../../components/cards/JobCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Briefcase, BookOpen, Heart, Sparkles, Search, FileText, Bot } from "lucide-react";
import { API } from "../../imports/api";
import { refreshApplicationsCache, useApplicationsCache } from "../../sync/applicationsStore";
import { useSyncResourceVersion } from "../../sync/useSyncResourceVersion";

export default function StudentDashboard() {
  const profileSyncVersion = useSyncResourceVersion("student");
  const resumeSyncVersion = useSyncResourceVersion("resume");
  const jobsSyncVersion = useSyncResourceVersion("jobs");
  const interviewsSyncVersion = useSyncResourceVersion("interviews");
  const nav = useNavigate();
  const [userName, setUserName] = useState<string>("");
  const [stats, setStats] = useState({ applications: "0", interviews: "0", saved: "0" });
  const [dashboardActivity, setDashboardActivity] = useState<Array<{ month: string; applications: number }>>([]);
  const [trends, setTrends] = useState<{ applications?: number; interviews?: number; profile_views?: number }>({});
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const {
    applications,
    stats: applicationStats,
    hydrated: applicationsHydrated,
  } = useApplicationsCache();

  useEffect(() => {
    void refreshApplicationsCache(applicationsHydrated);
  }, []);

  useEffect(() => {
    if (!applicationsHydrated) return;
    setStats((current) => ({ ...current, applications: String(applicationStats.total) }));
  }, [applicationStats.total, applicationsHydrated]);

  const applicationActivity = useMemo(() => {
    if (dashboardActivity.some((item) => item.applications > 0)) return dashboardActivity;
    if (!applicationsHydrated || applicationStats.total === 0) return [];

    const grouped = new Map<string, { date: Date; applications: number }>();
    let undated = 0;
    applications.forEach((application) => {
      const date = new Date(application.date);
      if (Number.isNaN(date.getTime())) { undated += 1; return; }
      const monthDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
      const current = grouped.get(key);
      grouped.set(key, { date: monthDate, applications: (current?.applications ?? 0) + 1 });
    });

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
    if (undated > 0 || grouped.size === 0) {
      const current = grouped.get(currentKey);
      grouped.set(currentKey, { date: currentMonth, applications: (current?.applications ?? 0) + (undated || applicationStats.total) });
    }

    const points = [...grouped.values()]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-6)
      .map((item) => ({ month: item.date.toLocaleDateString("en-US", { month: "short" }), applications: item.applications }));

    if (points.length === 1) {
      const previous = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      points.unshift({ month: previous.toLocaleDateString("en-US", { month: "short" }), applications: 0 });
    }
    return points;
  }, [applications, applicationsHydrated, applicationStats.total, dashboardActivity]);

  const actions = [
    { label: "Browse Jobs", icon: Search, path: "/student/jobs" },
    { label: "Build Resume", icon: FileText, path: "/student/resume" },
    { label: "My Applications", icon: Briefcase, path: "/student/applications" },
    { label: "AI Assistant", icon: Bot, path: "/student/ai" },
  ];

  const fetchDashboardData = async () => {
    const [userResult, dashboardResult, jobsResult] = await Promise.allSettled([
        API.get("/user"),
        API.get("/student/dashboard"),
        API.get("/student/recommended-jobs")
    ]);

    if (userResult.status === "fulfilled") {
      const userRes = userResult.value;
      if (userRes.data?.name) {
        setUserName(userRes.data.name);
      }
    } else {
      console.error("Error fetching user data:", userResult.reason);
    }

    if (dashboardResult.status === "fulfilled") {
      const dashboardRes = dashboardResult.value;
      if (dashboardRes.data?.stats) {
        const s = dashboardRes.data.stats;
        setStats({
          applications: String(s.applications ?? s.applications_count ?? "0"),
          interviews: String(s.interviews ?? s.interviews_count ?? "0"),
          saved: String(
            s.saved ??
            s.saved_jobs ??
            s.saved_jobs_count ??
            s.saved_count ??
            s.savedJobsCount ??
            "0"
          ),
        });
      } else if (dashboardRes.data) {
        const d = dashboardRes.data;
        setStats({
          applications: String(d.applications_count ?? d.applications ?? "0"),
          interviews: String(d.interviews_count ?? d.interviews ?? "0"),
          saved: String(
            d.saved_jobs ??
            d.saved_jobs_count ??
            d.saved_count ??
            d.savedJobsCount ??
            d.saved ??
            "0"
          ),
        });
      }

      const activity = dashboardRes.data?.application_activity ?? dashboardRes.data?.activity ?? [];
      if (Array.isArray(activity)) {
        const points = activity.map((item: any) => ({
          month: String(item.month ?? item.label ?? ""),
          applications: Number(item.applications ?? item.count ?? item.value ?? 0),
        })).filter((item: { month: string }) => item.month);
        if (points.length === 1) points.unshift({ month: "Start", applications: 0 });
        setDashboardActivity(points);
      }

      if (dashboardRes.data?.trends) setTrends(dashboardRes.data.trends);
    } else {
      console.error("Error fetching dashboard data:", dashboardResult.reason);
    }

    if (jobsResult.status === "fulfilled") {
      const jobsRes = jobsResult.value;
      if (Array.isArray(jobsRes.data)) {
        setRecommendedJobs(jobsRes.data);
      } else if (jobsRes.data?.jobs) {
        setRecommendedJobs(jobsRes.data.jobs);
      }
    } else {
      console.error("Error fetching recommended jobs:", jobsResult.reason);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [profileSyncVersion, resumeSyncVersion, jobsSyncVersion, interviewsSyncVersion]);

  const handleSaveToggle = (_jobId: string, isSavedNow: boolean) => {
    setStats(prev => ({
      ...prev,
      saved: String(Math.max(0, Number(prev.saved) + (isSavedNow ? 1 : -1)))
    }));
  };

  const jobMatchesCount = recommendedJobs.filter(
    (job) =>
      Number(
        job.match_percentage ??
        job.match_score ??
        job.match ??
        0
      ) >= 70
  ).length;

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Welcome back{userName ? `, ${userName}` : ""} 👋</h1>
        <p style={{ color: C.textSec, marginTop: 6, fontSize: 14 }}>Here's what's happening with your job search today.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="Applications" value={stats.applications} trend={trends.applications == null ? undefined : `${trends.applications >= 0 ? "+" : ""}${trends.applications}%`} icon={Briefcase} color={C.info} />
        <StatCard label="Interviews" value={stats.interviews} trend={trends.interviews == null ? undefined : `${trends.interviews >= 0 ? "+" : ""}${trends.interviews}%`} icon={BookOpen} color={C.purple} />
        <StatCard label="Saved Jobs" value={stats.saved} icon={Heart} color={C.accent} />
        <StatCard
          label="Job Matches"
          value={String(jobMatchesCount)}
          sub="Jobs matching your skills"
          icon={Sparkles}
          color="#7C3AED"
          onClick={() => nav("/student/recommended")}
        />
      </div>

      <div style={{ background: C.surface, borderRadius: 20, padding: 24, marginBottom: 28, border: `1px solid ${C.border}` }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>Application Activity</h2>
        {applicationActivity.length === 0 ? (
          <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.textSec, fontSize: 14 }}>
            No application activity yet.
          </div>
        ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={applicationActivity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.accent} stopOpacity={0.25} />
                <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.divider} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: C.textSec }} />
            <YAxis tick={{ fontSize: 12, fill: C.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontFamily: F }} />
            <Area type="monotone" dataKey="applications" stroke={C.accent} strokeWidth={2} fill="url(#appGrad)" />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Recommended for You</h2>
          <Btn v="ghost" size="sm" onClick={() => nav("/student/recommended")}>View all →</Btn>
        </div>
        
        {recommendedJobs.length === 0 ? (
          <div style={{ background: C.surface, borderRadius: 16, padding: 32, textAlign: "center", border: `1px solid ${C.border}`, color: C.textSec, fontSize: 14 }}>
            No recommendations found at the moment. Try updating your profile or fields of interest!
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {recommendedJobs.slice(0, 3).map((job, idx) => (
              <JobCard 
                key={job.id || idx} 
                job={job} 
                onView={() => nav(`/student/jobs/${job.id}`)} 
                onSave={handleSaveToggle}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {actions.map(a => (
            <button
              key={a.label}
              onClick={() => nav(a.path)}
              style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 16px", cursor: "pointer", fontFamily: F, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "all 0.15s", outline: "none" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 4px 16px ${C.accent}22`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
            >
              <a.icon size={22} color={C.accent} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
