import { useState } from "react";
import { C, F } from "../../constants/tokens";
import { CANDIDATES } from "../../constants/data";
import { Btn } from "../../components/ui";
import { Search, Filter, Download } from "lucide-react";

const EXTRA = [
  { id: 5, name: "Priya Nair", univ: "Cornell University", status: "Active", joined: "Jan 12, 2025", email: "p.nair@cornell.edu" },
  { id: 6, name: "Ethan Brooks", univ: "Georgia Tech", status: "Suspended", joined: "Nov 5, 2024", email: "e.brooks@gatech.edu" },
];

const ROWS = [
  ...CANDIDATES.map(c => ({ id: c.id, name: c.name, univ: c.univ, status: "Active", joined: "Feb 14, 2025", email: c.email })),
  ...EXTRA,
];

export default function AdminStudents() {
  const [query, setQuery] = useState("");
  const filtered = ROWS.filter(r => !query || r.name.toLowerCase().includes(query.toLowerCase()) || r.univ.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Student Management</h1>
          <p style={{ color: C.textSec, fontSize: 14, marginTop: 6 }}>Manage registered students on the platform</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn v="outline" icon={Filter} onClick={() => {}}>Filter</Btn>
          <Btn v="outline" icon={Download} onClick={() => {}}>Export</Btn>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search students…" style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 12, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 13, background: C.surface, boxSizing: "border-box" }} />
      </div>

      <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 100px 130px 120px", gap: 16, padding: "12px 20px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          {["Name", "University", "Status", "Joined", "Actions"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
          ))}
        </div>
        {filtered.map((row, i) => (
          <div key={row.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 100px 130px 120px", gap: 16, padding: "14px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.divider}` : "none", alignItems: "center" }}
            onMouseEnter={e => e.currentTarget.style.background = C.bg}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{row.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.textSec }}>{row.email}</p>
            </div>
            <span style={{ fontSize: 13, color: C.textSec }}>{row.univ}</span>
            <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: row.status === "Active" ? C.successBg : C.errorBg, color: row.status === "Active" ? C.success : C.error, display: "inline-block" }}>{row.status}</span>
            <span style={{ fontSize: 12, color: C.textSec }}>{row.joined}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn v="outline" size="sm" onClick={() => {}}>View</Btn>
              <Btn v={row.status === "Active" ? "danger" : "secondary"} size="sm" onClick={() => {}}>
                {row.status === "Active" ? "Suspend" : "Restore"}
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
