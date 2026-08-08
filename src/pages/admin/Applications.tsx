import { C, F } from "../../constants/tokens";
import { StatCard } from "../../components/ui";
import { FileText, TrendingUp, CheckCircle, Clock } from "lucide-react";

const RECENT = [
  { name: "Marcus Chen", job: "Senior Product Designer", company: "Stripe", status: "Interview", date: "Mar 15" },
  { name: "Sarah Johnson", job: "Frontend Engineer", company: "Vercel", status: "Shortlisted", date: "Mar 14" },
  { name: "James Kim", job: "Backend Engineer", company: "Linear", status: "Applied", date: "Mar 13" },
  { name: "Aisha Patel", job: "Product Designer", company: "Notion", status: "Applied", date: "Mar 12" },
  { name: "Priya Nair", job: "Data Scientist", company: "Anthropic", status: "Hired", date: "Mar 10" },
];

const STATUS_COLORS: Record<string, [string, string]> = {
  Interview: [C.purpleBg, C.purple],
  Shortlisted: [C.accentLight, C.accentHover],
  Applied: [C.infoBg, C.info],
  Hired: [C.successBg, C.success],
};

export default function AdminApplications() {
  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Applications</h1>
        <p style={{ color: C.textSec, fontSize: 14, marginTop: 6 }}>Platform-wide application analytics</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Applications" value="18,420" trend="+12%" icon={FileText} color={C.info} />
        <StatCard label="This Month" value="1,284" trend="+8%" icon={TrendingUp} color={C.accent} />
        <StatCard label="Successful Hires" value="248" trend="+18%" icon={CheckCircle} color={C.success} />
        <StatCard label="Pending Review" value="342" icon={Clock} color={C.warning} />
      </div>

      <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.divider}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Recent Applications</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1.5fr 120px 80px", gap: 16, padding: "12px 20px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          {["Candidate", "Job", "Company", "Status", "Date"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
          ))}
        </div>
        {RECENT.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1.5fr 120px 80px", gap: 16, padding: "14px 20px", borderBottom: i < RECENT.length - 1 ? `1px solid ${C.divider}` : "none", alignItems: "center" }}
            onMouseEnter={e => e.currentTarget.style.background = C.bg}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</span>
            <span style={{ fontSize: 13, color: C.textSec }}>{r.job}</span>
            <span style={{ fontSize: 13, color: C.textSec }}>{r.company}</span>
            <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: (STATUS_COLORS[r.status] ?? [C.divider, C.textSec])[0], color: (STATUS_COLORS[r.status] ?? [C.divider, C.textSec])[1], display: "inline-block" }}>{r.status}</span>
            <span style={{ fontSize: 12, color: C.textMuted }}>{r.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
