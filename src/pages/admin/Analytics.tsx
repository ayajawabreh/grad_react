import { useEffect, useState } from "react";
import { Activity, Briefcase, Building2, CalendarCheck, FileText, Target, TrendingUp, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { C, F } from "../../constants/tokens";
import { getAdminAnalytics, getAdminDashboard, getAdminJobsModeration, getAdminPlatformReport } from "../../imports/api";
import { useSyncResourceVersion } from "../../sync/useSyncResourceVersion";

const box = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18 };
const colors = [C.accent, C.info, C.purple, C.success, C.warning, C.error];
const ANALYTICS_CACHE_KEY = "careerbridge:admin-analytics";
const valueOf = (source: any, ...keys: string[]) => { for (const key of keys) if (source?.[key] !== undefined) return Number(source[key]) || 0; return 0; };
const listOf = (data: any, ...keys: string[]) => { for (const key of keys) if (Array.isArray(data?.[key])) return data[key]; return []; };

export default function AdminAnalytics() {
  const applicationsSyncVersion = useSyncResourceVersion("applications");
  const jobsSyncVersion = useSyncResourceVersion("jobs");
  const interviewsSyncVersion = useSyncResourceVersion("interviews");
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => {
    try {
      const cached = sessionStorage.getItem(ANALYTICS_CACHE_KEY);
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
      }
    } catch {
      sessionStorage.removeItem(ANALYTICS_CACHE_KEY);
    }
    const [analyticsResult, reportResult, dashboardResult, jobsResult] = await Promise.allSettled([getAdminAnalytics(), getAdminPlatformReport("month"), getAdminDashboard(), getAdminJobsModeration()]);
    const unwrap = (result: PromiseSettledResult<any>) => result.status === "fulfilled" ? result.value?.data ?? result.value ?? {} : {};
    const analytics = unwrap(analyticsResult); const report = unwrap(reportResult); const dashboard = unwrap(dashboardResult); const jobsResponse = unwrap(jobsResult);
    const jobs = Array.isArray(jobsResponse) ? jobsResponse : jobsResponse.jobs ?? jobsResponse.data ?? [];
    const monthlyJobs = Array.from(jobs.reduce((months: Map<string, number>, job: any) => {
      if (!job.created_at && !job.posted_at && !job.posted) return months;
      const date = new Date(job.created_at ?? job.posted_at ?? job.posted);
      if (Number.isNaN(date.getTime())) return months;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months.set(key, (months.get(key) ?? 0) + 1); return months;
    }, new Map<string, number>()).entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month: new Date(`${month}-01`).toLocaleDateString("en-US", { month: "short", year: "2-digit" }), count }));
    const categoryJobs = Array.from(jobs.reduce((categories: Map<string, number>, job: any) => {
      const name = job.category?.name ?? "Uncategorized";
      categories.set(name, (categories.get(name) ?? 0) + 1); return categories;
    }, new Map<string, number>()).entries()).map(([name, count]) => ({ name, count }));
    const apiTrend = analytics.jobs_over_time ?? analytics.jobsOverTime ?? analytics.jobs_by_month;
    const apiCategories = analytics.jobs_by_category ?? analytics.jobsByCategory ?? report.highlights?.jobs_by_category;
    const overview = {
      ...(analytics.overview ?? analytics.metrics ?? analytics.statistics ?? {}),
      total_students: report.students?.total ?? dashboard.statistics?.total_students ?? analytics.total_students,
      total_companies: report.companies?.total ?? dashboard.statistics?.total_companies ?? analytics.total_companies,
      total_jobs: report.jobs?.total ?? dashboard.statistics?.active_jobs ?? analytics.total_jobs,
      total_applications: report.applications?.total ?? analytics.total_applications,
      total_interviews: report.hiring?.total_interviews ?? report.applications?.interviews ?? analytics.total_interviews,
      total_hires: report.hiring?.total_hires ?? report.applications?.accepted ?? dashboard.statistics?.total_hires ?? analytics.total_hires,
    };
    const nextData = {
      ...analytics,
      overview,
      application_funnel: analytics.application_funnel ?? analytics.applicationFunnel ?? report.applications,
      jobs_over_time: Array.isArray(apiTrend) && apiTrend.length ? apiTrend : monthlyJobs,
      jobs_by_category: Array.isArray(apiCategories) && apiCategories.length ? apiCategories : categoryJobs,
      companies_summary: analytics.companies_summary ?? analytics.companiesSummary ?? { approved: report.companies?.active, pending: dashboard.needs_review?.companies },
    };
    setData(nextData);
    try {
      sessionStorage.setItem(ANALYTICS_CACHE_KEY, JSON.stringify(nextData));
    } catch {}
    if (analyticsResult.status === "rejected" && reportResult.status === "rejected" && dashboardResult.status === "rejected") toast.error("Could not load platform analytics");
    setLoading(false);
  })(); }, [applicationsSyncVersion, jobsSyncVersion, interviewsSyncVersion]);
  const metrics = data.overview ?? data.metrics ?? data.statistics ?? data;
  const cards = [
    ["Students", valueOf(metrics, "total_students", "totalStudents", "students"), Users, C.info],
    ["Companies", valueOf(metrics, "total_companies", "totalCompanies", "companies"), Building2, C.purple],
    ["Jobs", valueOf(metrics, "total_jobs", "totalJobs", "jobs"), Briefcase, C.accent],
    ["Applications", valueOf(metrics, "total_applications", "totalApplications", "applications"), FileText, C.warning],
    ["Interviews", valueOf(metrics, "total_interviews", "totalInterviews", "interviews"), CalendarCheck, C.success],
    ["Hires", valueOf(metrics, "total_hires", "totalHires", "hires", "accepted"), Target, C.error],
  ] as const;
  const rawJobsTrend = listOf(data, "jobs_over_time", "jobsOverTime", "jobs_by_month").map((item: any, i: number) => ({ name: item.label ?? item.month ?? item.date ?? `Period ${i + 1}`, value: valueOf(item, "value", "count", "total", "jobs") }));
  const totalJobs = valueOf(metrics, "total_jobs", "totalJobs", "jobs");
  const jobsTrend = rawJobsTrend.some((item) => item.value > 0)
    ? (rawJobsTrend.length === 1 ? [{ name: "Start", value: 0 }, ...rawJobsTrend] : rawJobsTrend)
    : [{ name: "Start", value: 0 }, { name: "Current", value: totalJobs }];
  const categories = listOf(data, "jobs_by_category", "jobsByCategory", "categories").map((item: any) => ({ name: item.name ?? item.category ?? item.label ?? "Other", value: valueOf(item, "value", "count", "total", "jobs") }));
  const statusesRaw = data.application_funnel ?? data.applicationFunnel ?? data.application_statuses ?? data.applicationStatuses ?? {};
  const funnelKeys = [{ name: "Submitted", keys: ["submitted", "total"] }, { name: "Viewed", keys: ["viewed"] }, { name: "Shortlisted", keys: ["shortlisted"] }, { name: "Interview", keys: ["interview", "interviews"] }, { name: "Accepted", keys: ["accepted", "hired"] }];
  const funnel = Array.isArray(statusesRaw) ? statusesRaw.map((item: any) => ({ name: item.name ?? item.status ?? item.label, value: valueOf(item, "value", "count", "total") })) : funnelKeys.map((item) => ({ name: item.name, value: valueOf(statusesRaw, ...item.keys) }));
  const companies = listOf(data, "top_companies", "topCompanies", "companies_analytics").slice(0, 6);
  const companyStats = data.companies_summary ?? data.companiesSummary ?? {};
  const maxFunnel = Math.max(1, ...funnel.map((item: any) => item.value));

  return <div style={{ fontFamily: F, color: C.text }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}><div><h1 style={{ fontSize: 25, fontWeight: 800, margin: 0 }}>Reports & Analytics</h1><p style={{ color: C.textSec, fontSize: 14, margin: "6px 0 0" }}>Live platform health, growth and recruitment conversion data.</p></div><span style={{ padding: "7px 11px", borderRadius: 99, background: C.successBg, color: C.success, fontSize: 11, fontWeight: 700, display: "flex", gap: 6, alignItems: "center" }}><Activity size={13}/> Live API data</span></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 13, marginBottom: 20 }}>{cards.map(([label, value, Icon, color]) => <div key={label} style={{ ...box, padding: 17 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", background: `${color}16`, color }}><Icon size={18}/></div><TrendingUp size={14} color={C.textMuted}/></div><div style={{ fontSize: 23, fontWeight: 800, marginTop: 13 }}>{loading ? "—" : value.toLocaleString()}</div><div style={{ color: C.textSec, fontSize: 12, marginTop: 2 }}>Total {label}</div></div>)}</div>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(300px,1fr)", gap: 16, marginBottom: 16 }}>
      <ChartBox title="Jobs Posted Over Time" subtitle="New job listings by reporting period"><ResponsiveContainer width="100%" height={260}><AreaChart data={jobsTrend}><defs><linearGradient id="jobsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={.3}/><stop offset="95%" stopColor={C.accent} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.divider}/><XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false}/><YAxis domain={[0, (max: number) => Math.max(1, max)]} allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false}/><Tooltip/><Area type="monotone" dataKey="value" name="Jobs" stroke={C.accent} fill="url(#jobsFill)" strokeWidth={2}/></AreaChart></ResponsiveContainer></ChartBox>
      <ChartBox title="Jobs by Category" subtitle="Distribution of active demand"><ResponsiveContainer width="100%" height={260}>{categories.length ? <PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>{categories.map((_: any, i: number) => <Cell key={i} fill={colors[i % colors.length]}/>)}</Pie><Tooltip/></PieChart> : <Empty text="No category analytics returned"/>}</ResponsiveContainer>{categories.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>{categories.slice(0, 6).map((item: any, i: number) => <span key={item.name} style={{ fontSize: 11, color: C.textSec }}><i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 3, background: colors[i % colors.length], marginRight: 5 }}/>{item.name}</span>)}</div>}</ChartBox>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.35fr) minmax(300px,1fr)", gap: 16 }}>
      <ChartBox title="Application Funnel" subtitle="Conversion through the recruitment journey"><div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 10 }}>{funnel.map((item: any, i: number) => <div key={item.name}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}><b>{item.name}</b><span style={{ color: C.textSec }}>{item.value.toLocaleString()} · {Math.round(item.value / maxFunnel * 100)}%</span></div><div style={{ height: 10, borderRadius: 99, background: C.divider, overflow: "hidden" }}><div style={{ height: "100%", width: `${item.value / maxFunnel * 100}%`, background: colors[i % colors.length], borderRadius: 99 }}/></div></div>)}</div></ChartBox>
      <ChartBox title="Companies Analytics" subtitle="Status and highest platform activity"><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>{[["Approved", "approved"], ["Pending", "pending"], ["Suspended", "suspended"]].map(([label,key]) => <div key={key} style={{ background: C.bg, borderRadius: 11, padding: 10, textAlign: "center" }}><b style={{ fontSize: 18 }}>{valueOf(companyStats, key, `${key}_companies`)}</b><div style={{ color: C.textMuted, fontSize: 10 }}>{label}</div></div>)}</div>{companies.length ? companies.map((company: any, i: number) => <div key={company.id ?? i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < companies.length - 1 ? `1px solid ${C.divider}` : "none", fontSize: 12 }}><span style={{ fontWeight: 600 }}>{company.name ?? company.company_name ?? `Company ${i + 1}`}</span><span style={{ color: C.textSec }}>{valueOf(company, "jobs", "jobs_count", "job_count")} jobs · {valueOf(company, "applications", "applications_count")} applications</span></div>) : <div style={{ textAlign: "center", color: C.textMuted, padding: 25, fontSize: 12 }}>No top-company data returned</div>}</ChartBox>
    </div>
  </div>;
}

function ChartBox({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section style={{ ...box, padding: 20 }}><h2 style={{ fontSize: 15, margin: 0 }}>{title}</h2><p style={{ color: C.textMuted, fontSize: 11, margin: "4px 0 18px" }}>{subtitle}</p>{children}</section>; }
function Empty({ text }: { text: string }) { return <div style={{ height: "100%", display: "grid", placeItems: "center", color: C.textMuted, fontSize: 12 }}>{text}</div>; }
