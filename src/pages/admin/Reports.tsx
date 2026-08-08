import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import { BarChart2, Building2, GraduationCap, DollarSign, Download } from "lucide-react";

const REPORTS = [
  { icon: BarChart2, color: C.info, bg: C.infoBg, title: "Monthly Platform Report", desc: "Comprehensive overview of platform activity, user growth, and key engagement metrics for the past month.", generated: "Jul 1, 2026" },
  { icon: Building2, color: C.accent, bg: C.accentLight, title: "Company Performance", desc: "Analysis of company hiring activity, job posting effectiveness, and applicant funnel metrics.", generated: "Jul 1, 2026" },
  { icon: GraduationCap, color: C.purple, bg: C.purpleBg, title: "Student Outcomes", desc: "Placement rates, time-to-hire statistics, and academic background analysis across successful hires.", generated: "Jun 28, 2026" },
  { icon: DollarSign, color: C.success, bg: C.successBg, title: "Revenue & Billing", desc: "Platform revenue breakdown, subscription metrics, and billing activity across all company tiers.", generated: "Jun 30, 2026" },
];

export default function AdminReports() {
  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Reports</h1>
        <p style={{ color: C.textSec, fontSize: 14, marginTop: 6 }}>Download platform reports and data exports</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {REPORTS.map(r => (
          <div key={r.title} style={{ background: C.surface, borderRadius: 20, padding: 28, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 16, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.boxShadow = `0 4px 20px ${r.color}15`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <r.icon size={22} color={r.color} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>{r.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: C.textSec, lineHeight: 1.65 }}>{r.desc}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${C.divider}` }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>Last generated: {r.generated}</span>
              <Btn v="primary" size="sm" icon={Download} onClick={() => {}}>Download</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
