import { useState } from "react";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import { Search, Filter, Download } from "lucide-react";

const COMPANIES = [
  { id: 1, name: "Nexus Technologies", industry: "Enterprise SaaS", status: "Active", joined: "Mar 1, 2025", verification: "Verified" },
  { id: 2, name: "Pulsify Health", industry: "HealthTech", status: "Active", joined: "Feb 14, 2025", verification: "Verified" },
  { id: 3, name: "Orbital Finance", industry: "FinTech", status: "Pending", joined: "Mar 15, 2025", verification: "Pending" },
  { id: 4, name: "Luminar AI", industry: "Artificial Intelligence", status: "Active", joined: "Jan 8, 2025", verification: "Verified" },
  { id: 5, name: "BuildStack", industry: "Developer Tools", status: "Suspended", joined: "Nov 20, 2024", verification: "Rejected" },
];

export default function AdminCompanies() {
  const [query, setQuery] = useState("");
  const filtered = COMPANIES.filter(c => !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.industry.toLowerCase().includes(query.toLowerCase()));

  const vColor = (v: string) => v === "Verified" ? C.success : v === "Pending" ? C.warning : C.error;
  const vBg = (v: string) => v === "Verified" ? C.successBg : v === "Pending" ? C.warningBg : C.errorBg;

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Company Management</h1>
          <p style={{ color: C.textSec, fontSize: 14, marginTop: 6 }}>Review and manage registered companies</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn v="outline" icon={Filter} onClick={() => {}}>Filter</Btn>
          <Btn v="outline" icon={Download} onClick={() => {}}>Export</Btn>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search companies…" style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 12, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 13, background: C.surface, boxSizing: "border-box" }} />
      </div>

      <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 100px 130px 110px 140px", gap: 16, padding: "12px 20px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          {["Company", "Industry", "Status", "Joined", "Verification", "Actions"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
          ))}
        </div>
        {filtered.map((co, i) => (
          <div key={co.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 100px 130px 110px 140px", gap: 16, padding: "14px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.divider}` : "none", alignItems: "center" }}
            onMouseEnter={e => e.currentTarget.style.background = C.bg}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{co.name}</span>
            <span style={{ fontSize: 13, color: C.textSec }}>{co.industry}</span>
            <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: co.status === "Active" ? C.successBg : co.status === "Pending" ? C.warningBg : C.errorBg, color: co.status === "Active" ? C.success : co.status === "Pending" ? C.warning : C.error, display: "inline-block" }}>{co.status}</span>
            <span style={{ fontSize: 12, color: C.textSec }}>{co.joined}</span>
            <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: vBg(co.verification), color: vColor(co.verification), display: "inline-block" }}>{co.verification}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn v="outline" size="sm" onClick={() => {}}>View</Btn>
              <Btn v={co.status === "Active" ? "danger" : "secondary"} size="sm" onClick={() => {}}>
                {co.status === "Active" ? "Suspend" : "Restore"}
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
