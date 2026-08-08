import { useState } from "react";
import { C, F } from "../../constants/tokens";
import { JOBS } from "../../constants/data";
import { Btn, SBadge } from "../../components/ui";
import { Search, CheckCircle, Flag, Trash2 } from "lucide-react";

export default function AdminJobs() {
  const [query, setQuery] = useState("");
  const filtered = JOBS.filter(j => !query || j.title.toLowerCase().includes(query.toLowerCase()) || j.company.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Job Moderation</h1>
        <p style={{ color: C.textSec, fontSize: 14, marginTop: 6 }}>Review and moderate job listings across the platform</p>
      </div>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search jobs…" style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 12, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 13, background: C.surface, boxSizing: "border-box" }} />
      </div>

      <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 80px 80px 110px 160px", gap: 16, padding: "12px 20px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          {["Title", "Company", "Applicants", "Status", "Posted", "Actions"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
          ))}
        </div>
        {filtered.map((job, i) => (
          <div key={job.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 80px 80px 110px 160px", gap: 16, padding: "14px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.divider}` : "none", alignItems: "center" }}
            onMouseEnter={e => e.currentTarget.style.background = C.bg}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{job.title}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.textSec }}>{job.dept} · {job.type}</p>
            </div>
            <span style={{ fontSize: 13, color: C.textSec }}>{job.company}</span>
            <span style={{ fontSize: 13, fontWeight: 600, textAlign: "center" }}>{job.applicants}</span>
            <SBadge status={job.status} />
            <span style={{ fontSize: 12, color: C.textSec }}>{job.posted}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button title="Approve" style={{ padding: "6px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.successBg, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <CheckCircle size={13} color={C.success} />
              </button>
              <button title="Flag" style={{ padding: "6px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.warningBg, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Flag size={13} color={C.warning} />
              </button>
              <button title="Remove" style={{ padding: "6px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.errorBg, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Trash2 size={13} color={C.error} />
              </button>
              <Btn v="outline" size="sm" onClick={() => {}}>View</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
