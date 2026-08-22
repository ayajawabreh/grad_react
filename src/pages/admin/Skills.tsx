import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BriefcaseBusiness, Pencil, Plus, Search, Tags, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import { createAdminSkill, deleteAdminSkill, getAdminSkills, updateAdminSkill } from "../../imports/api";

type Skill = {
  id: number; name: string;
  students_count?: number; student_count?: number; students?: number | unknown[];
  jobs_count?: number; job_count?: number; jobs?: number | unknown[];
};

const usage = (skill: Skill, type: "students" | "jobs") => {
  const count = type === "students" ? skill.students_count ?? skill.student_count : skill.jobs_count ?? skill.job_count;
  const relation = type === "students" ? skill.students : skill.jobs;
  if (typeof count === "number") return count;
  if (typeof relation === "number") return relation;
  return Array.isArray(relation) ? relation.length : 0;
};

const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18 };
const columns = "100px minmax(220px, 1fr) 130px 130px 150px";

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const loadSkills = async () => {
    try {
      setLoading(true); setError("");
      const response = await getAdminSkills();
      const data = response?.data ?? response;
      setSkills(Array.isArray(data) ? data : data?.skills ?? []);
    } catch (err) {
      console.error(err); setError("Skills could not be loaded. Please try again.");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadSkills(); }, []);
  const filtered = useMemo(() => skills.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase())), [skills, query]);
  const studentsTotal = skills.reduce((sum, s) => sum + usage(s, "students"), 0);
  const jobsTotal = skills.reduce((sum, s) => sum + usage(s, "jobs"), 0);

  const openForm = (skill?: Skill) => {
    setEditing(skill ?? null); setName(skill?.name ?? ""); setError(""); setShowForm(true);
  };
  const closeForm = () => { if (!busy) { setShowForm(false); setEditing(null); setName(""); } };

  const saveSkill = async () => {
    const clean = name.trim();
    if (!clean) return setError("Enter a skill name first.");
    if (skills.some((s) => s.id !== editing?.id && s.name.trim().toLowerCase() === clean.toLowerCase())) {
      return setError(`“${clean}” already exists in the skills catalog.`);
    }
    try {
      setBusy(true); setError("");
      if (editing) {
        await updateAdminSkill(editing.id, { name: clean });
        setSkills((current) => current.map((skill) => skill.id === editing.id ? { ...skill, name: clean } : skill));
        toast.success("Skill updated successfully", { description: `“${editing.name}” was changed to “${clean}”.` });
      } else {
        const response = await createAdminSkill({ name: clean });
        const data = response?.data ?? response;
        const created = data?.skill ?? data;
        const newSkill: Skill = created?.id
          ? created
          : { id: Math.max(0, ...skills.map((skill) => skill.id)) + 1, name: clean };
        setSkills((current) => current.some((skill) => skill.id === newSkill.id) ? current : [...current, newSkill]);
        toast.success("Skill added successfully", { description: `“${clean}” is now available across the platform.` });
      }
      setShowForm(false); setEditing(null); setName("");
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || "The skill could not be saved.";
      setError(message);
      toast.error("Could not save skill", { description: message });
    } finally { setBusy(false); }
  };

  const deleteSkill = async () => {
    if (!deletingSkill) return;
    try {
      setBusy(true); setError("");
      const removed = deletingSkill;
      await deleteAdminSkill(removed.id);
      setSkills((current) => current.filter((skill) => skill.id !== removed.id));
      setDeletingSkill(null);
      toast.success("Skill deleted successfully", { description: `“${removed.name}” was removed from the catalog.` });
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || "This skill could not be deleted. It may still be in use.";
      setError(message); setDeletingSkill(null);
      toast.error("Could not delete skill", { description: message });
    } finally { setBusy(false); }
  };

  const stats = [
    { label: "Total Skills", value: skills.length, icon: Tags, color: C.accent, bg: C.accentLight },
    { label: "Student Uses", value: studentsTotal, icon: Users, color: C.info, bg: C.infoBg },
    { label: "Job Uses", value: jobsTotal, icon: BriefcaseBusiness, color: C.purple, bg: C.purpleBg },
  ];

  return <div style={{ fontFamily: F, color: C.text }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: C.accentLight, color: C.accent, display: "grid", placeItems: "center" }}><Tags size={19} /></div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Skills Catalog</h1>
        </div>
        <p style={{ color: C.textSec, fontSize: 14, margin: "0 0 0 48px" }}>Manage the central list of skills used by students and jobs across CareerBridge.</p>
      </div>
      <Btn v="primary" size="sm" icon={Plus} onClick={() => openForm()}>Add Skill</Btn>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
      {stats.map(({ label, value, icon: Icon, color, bg }) => <div key={label} style={{ ...card, padding: "17px 18px", display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, color, display: "grid", placeItems: "center" }}><Icon size={19} /></div>
        <div><div style={{ fontSize: 21, fontWeight: 800 }}>{loading ? "—" : value}</div><div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{label}</div></div>
      </div>)}
    </div>

    {error && <div style={{ padding: "11px 14px", borderRadius: 12, background: C.errorBg, color: C.error, fontSize: 13, marginBottom: 16, display: "flex", gap: 9, alignItems: "center" }}><AlertTriangle size={16} />{error}</div>}

    <div style={{ ...card, overflow: "hidden" }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div><div style={{ fontSize: 15, fontWeight: 700 }}>Master skills</div><div style={{ color: C.textMuted, fontSize: 12, marginTop: 3 }}>{filtered.length} of {skills.length} skills</div></div>
        <div style={{ position: "relative", width: 290, maxWidth: "100%" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by skill name..." style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 13, background: C.bg, boxSizing: "border-box", outline: "none" }} />
        </div>
      </div>
      <div style={{ overflowX: "auto" }}><div style={{ minWidth: 680 }}>
        <div style={{ display: "grid", gridTemplateColumns: columns, gap: 16, padding: "12px 20px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          {["SKILL ID", "SKILL", "STUDENTS", "JOBS", "ACTIONS"].map((h) => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>{h}</span>)}
        </div>
        {loading ? <div style={{ padding: 42, textAlign: "center", color: C.textSec, fontSize: 13 }}>Loading skills...</div>
        : filtered.length === 0 ? <div style={{ padding: 48, textAlign: "center" }}><Tags size={28} color={C.textMuted} /><div style={{ fontWeight: 700, marginTop: 10 }}>No skills found</div><div style={{ color: C.textSec, fontSize: 13, marginTop: 4 }}>Try another search or add a new skill.</div></div>
        : filtered.map((skill, index) => <div key={skill.id} style={{ display: "grid", gridTemplateColumns: columns, gap: 16, padding: "15px 20px", borderBottom: index < filtered.length - 1 ? `1px solid ${C.divider}` : "none", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.textSec, fontFamily: "monospace" }}>#{skill.id}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 32, height: 32, borderRadius: 9, background: C.accentLight, color: C.accent, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800 }}>{skill.name.charAt(0).toUpperCase()}</div><span style={{ fontSize: 13, fontWeight: 700 }}>{skill.name}</span></div>
          <span style={{ fontSize: 13, color: C.textSec }}><Users size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{usage(skill, "students")}</span>
          <span style={{ fontSize: 13, color: C.textSec }}><BriefcaseBusiness size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{usage(skill, "jobs")}</span>
          <div style={{ display: "flex", gap: 7 }}>
            <button aria-label={`Edit ${skill.name}`} onClick={() => openForm(skill)} style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.infoBg, color: C.info, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: F, fontSize: 12, fontWeight: 600 }}><Pencil size={13} />Edit</button>
            <button aria-label={`Delete ${skill.name}`} onClick={() => setDeletingSkill(skill)} style={{ padding: 8, borderRadius: 8, border: `1px solid ${C.border}`, background: C.errorBg, color: C.error, cursor: "pointer", display: "flex" }}><Trash2 size={14} /></button>
          </div>
        </div>)}
      </div></div>
    </div>

    {showForm && <div onMouseDown={(e) => e.target === e.currentTarget && closeForm()} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.48)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ width: 430, maxWidth: "100%", ...card, padding: 24, boxShadow: "0 24px 70px rgba(15,23,42,.22)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}><div><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{editing ? "Edit Skill" : "Add New Skill"}</h2><p style={{ margin: "5px 0 0", color: C.textSec, fontSize: 12 }}>{editing ? "Keep skill names consistent across the platform." : "Add a new option to the master skills catalog."}</p></div><button onClick={closeForm} style={{ border: 0, background: C.bg, borderRadius: 8, padding: 6, cursor: "pointer", display: "flex" }}><X size={17} /></button></div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Skill name</label>
        <input value={name} onChange={(e) => { setName(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && saveSkill()} placeholder="e.g. Docker" autoFocus style={{ width: "100%", padding: "12px 13px", borderRadius: 10, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 7 }}>Use one clear, standardized name such as “React” or “UI Design”.</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 24 }}><Btn v="outline" size="sm" onClick={closeForm}>Cancel</Btn><Btn v="primary" size="sm" onClick={saveSkill}>{busy ? "Saving..." : editing ? "Save Changes" : "Add Skill"}</Btn></div>
      </div>
    </div>}

    {deletingSkill && <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.48)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, padding: 20 }}>
      <div style={{ width: 440, maxWidth: "100%", ...card, padding: 24, boxShadow: "0 24px 70px rgba(15,23,42,.22)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: C.errorBg, color: C.error, display: "grid", placeItems: "center", marginBottom: 16 }}><AlertTriangle size={22} /></div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Delete “{deletingSkill.name}”?</h2>
        <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, margin: "9px 0 0" }}>{usage(deletingSkill, "students") + usage(deletingSkill, "jobs") > 0 ? `This skill is currently used by ${usage(deletingSkill, "students")} students and ${usage(deletingSkill, "jobs")} jobs. Deleting it may remove these relationships.` : "This skill is not currently linked to any students or jobs. This action cannot be undone."}</p>
        {usage(deletingSkill, "students") + usage(deletingSkill, "jobs") > 0 && <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: C.warningBg, color: C.warning, fontSize: 12 }}>We recommend replacing or unlinking this skill before deleting it.</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 24 }}><Btn v="outline" size="sm" onClick={() => setDeletingSkill(null)}>Cancel</Btn><Btn v="danger" size="sm" onClick={deleteSkill}>{busy ? "Deleting..." : "Delete Skill"}</Btn></div>
      </div>
    </div>}
  </div>;
}
