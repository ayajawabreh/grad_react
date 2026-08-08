import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { trendData } from "../../constants/data";
import { Btn, StatCard } from "../../components/ui";
import { JobCard } from "../../components/cards/JobCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Briefcase, BookOpen, Heart, Eye, Search, FileText, Bot } from "lucide-react";
import { API } from "../../imports/api";

export default function StudentDashboard() {
  const nav = useNavigate();
  const [userName, setUserName] = useState<string>("Marcus");
  const [stats, setStats] = useState({ applications: "0", interviews: "0", saved: "0", views: "0" });
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const actions = [
    { label: "Browse Jobs", icon: Search, path: "/student/jobs" },
    { label: "Build Resume", icon: FileText, path: "/student/resume" },
    { label: "My Applications", icon: Briefcase, path: "/student/applications" },
    { label: "AI Assistant", icon: Bot, path: "/student/ai" },
  ];

  const fetchDashboardData = async () => {
    try {
      const [userRes, dashboardRes, jobsRes] = await Promise.all([
        API.get("/user"),
        API.get("/student/dashboard"),
        API.get("/student/recommended-jobs")
      ]);

      if (userRes.data?.name) {
        setUserName(userRes.data.name);
      }

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
          views: String(s.views ?? s.profile_views_count ?? "0"),
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
          views: String(d.profile_views_count ?? d.views ?? "0"),
        });
      }

      if (Array.isArray(jobsRes.data)) {
        setRecommendedJobs(jobsRes.data);
      } else if (jobsRes.data?.jobs) {
        setRecommendedJobs(jobsRes.data.jobs);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSaveToggle = (_jobId: string, isSavedNow: boolean) => {
    setStats(prev => ({
      ...prev,
      saved: String(Math.max(0, Number(prev.saved) + (isSavedNow ? 1 : -1)))
    }));
  };

  if (loading) {
    return (
      <div style={{ fontFamily: F, color: C.textSec, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh", fontSize: 16, fontWeight: 600 }}>
        Loading Dashboard Data...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Welcome back, {userName} 👋</h1>
        <p style={{ color: C.textSec, marginTop: 6, fontSize: 14 }}>Here's what's happening with your job search today.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="Applications" value={stats.applications} trend="+12%" icon={Briefcase} color={C.info} />
        <StatCard label="Interviews" value={stats.interviews} trend="+50%" icon={BookOpen} color={C.purple} />
        <StatCard label="Saved Jobs" value={stats.saved} icon={Heart} color={C.accent} />
        <StatCard label="Profile Views" value={stats.views} trend="+22%" icon={Eye} color={C.success} />
      </div>

      <div style={{ background: C.surface, borderRadius: 20, padding: 24, marginBottom: 28, border: `1px solid ${C.border}` }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>Application Activity</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
            <Area type="monotone" dataKey="v" stroke={C.accent} strokeWidth={2} fill="url(#appGrad)" />
          </AreaChart>
        </ResponsiveContainer>
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