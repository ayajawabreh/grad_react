import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { CANDIDATES } from "../../constants/data";
import { Btn, MatchRing, SBadge } from "../../components/ui";
import { Sparkles, MapPin, Briefcase, CalendarPlus, Bookmark } from "lucide-react";

const WHY_MAP: Record<number, string[]> = {
  1: ["96% skills overlap with open roles", "Portfolio demonstrates end-to-end ownership", "Stanford HCI background ideal for product work"],
  2: ["React & TypeScript align with engineering needs", "MIT graduate with 4 yrs experience", "Previous contributions to large-scale systems"],
  3: ["Node.js & PostgreSQL match backend roles", "Berkeley grad with strong technical foundation", "3 yrs at relevant companies"],
  4: ["Motion design expertise is rare and valuable", "CMU design program top-ranked nationally", "Strong portfolio of production work"],
};

export default function RecommendedCandidates() {
  const nav = useNavigate();

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Recommended Candidates</h1>
            <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: C.purpleBg, borderRadius: 99, fontSize: 12, fontWeight: 600, color: C.purple }}>
              <Sparkles size={11} />AI Powered
            </span>
          </div>
          <p style={{ color: C.textSec, fontSize: 14, margin: 0 }}>Top candidates matched to your open roles</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {CANDIDATES.map(c => (
          <div key={c.id} style={{ background: C.surface, borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 4px 20px ${C.accent}18`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <img src={c.avatar} alt={c.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{c.name}</h3>
                  <SBadge status={c.status} />
                </div>
                <p style={{ margin: "0 0 10px", fontSize: 13, color: C.textSec }}>{c.title} · {c.univ}</p>
                <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: C.textSec, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{c.location}</span>
                  <span style={{ fontSize: 12, color: C.textSec, display: "flex", alignItems: "center", gap: 4 }}><Briefcase size={12} />{c.exp}</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {c.skills.map(s => <span key={s} style={{ padding: "4px 10px", background: C.accentLight, color: C.accentHover, borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{s}</span>)}
                </div>
                {/* Why this matches */}
                <div style={{ background: C.bg, borderRadius: 10, padding: "10px 14px" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: "0.06em" }}>Why this matches</p>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {(WHY_MAP[c.id] ?? []).map(b => <li key={b} style={{ fontSize: 12, color: C.textSec, marginBottom: 3 }}>{b}</li>)}
                  </ul>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <MatchRing match={c.match} />
                <Btn v="primary" size="sm" icon={CalendarPlus} onClick={() => nav(`/company/applicants/${c.id}`)}>Invite</Btn>
                <Btn v="outline" size="sm" icon={Bookmark} onClick={() => {}}>Save</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
