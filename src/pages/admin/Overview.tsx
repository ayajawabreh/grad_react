import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { trendData } from "../../constants/data";
import { StatCard, Btn } from "../../components/ui";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Building2, Briefcase, Trophy, ClipboardList, ShieldAlert, UserPlus } from "lucide-react";

export default function AdminOverview() {
  const nav = useNavigate();

  const quickActions = [
    { label: "Review Companies", path: "/admin/companies", color: C.info, bg: C.infoBg },
    { label: "Moderate Jobs", path: "/admin/jobs", color: C.warning, bg: C.warningBg },
    { label: "Analytics", path: "/admin/analytics", color: C.purple, bg: C.purpleBg },
    { label: "Reports", path: "/admin/reports", color: C.success, bg: C.successBg },
  ];

  const summaryCards = [
    { label: "New Registrations", value: 142, icon: UserPlus, color: C.info, path: "/admin/students" },
    { label: "Pending Reviews", value: 8, icon: ClipboardList, color: C.warning, path: "/admin/companies" },
    { label: "Flagged Content", value: 3, icon: ShieldAlert, color: C.error, path: "/admin/jobs" },
  ];

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Platform Overview</h1>
        <p style={{ color: C.textSec, marginTop: 6, fontSize: 14 }}>CareerBridge admin dashboard — real-time platform insights</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="Students" value="52,480" trend="+8%" icon={Users} color={C.info} />
        <StatCard label="Companies" value="512" trend="+12%" icon={Building2} color={C.accent} />
        <StatCard label="Live Jobs" value="1,842" trend="+5%" icon={Briefcase} color={C.purple} />
        <StatCard label="Hires" value="248" trend="+18%" icon={Trophy} color={C.success} />
      </div>

      {/* Area Chart */}
      <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>Platform Activity</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData.map(d => ({ ...d, v: d.v * 8 }))} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.purple} stopOpacity={0.25} />
                <stop offset="95%" stopColor={C.purple} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.divider} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: C.textSec }} />
            <YAxis tick={{ fontSize: 12, fill: C.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontFamily: F }} />
            <Area type="monotone" dataKey="v" stroke={C.purple} strokeWidth={2} fill="url(#adminGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
      <div style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {quickActions.map(a => (
            <button key={a.label} onClick={() => nav(a.path)} style={{ padding: "18px 16px", borderRadius: 14, border: `1px solid ${C.border}`, background: a.bg, cursor: "pointer", fontFamily: F, fontSize: 13, fontWeight: 600, color: a.color, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.boxShadow = `0 4px 16px ${a.color}22`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {summaryCards.map(s => (
          <div key={s.label} onClick={() => nav(s.path)} style={{ background: C.surface, borderRadius: 18, padding: 20, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.boxShadow = `0 4px 16px ${s.color}18`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 13, color: C.textSec }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
