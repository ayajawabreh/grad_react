import { C } from "../../constants/tokens";
import { Facebook, Github, Globe2, Linkedin } from "lucide-react";

const asArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
};

const text = (value: unknown) => String(value ?? "").trim();
const presentValue = (value: unknown) => {
  const result = text(value);
  return result && result !== "-" && result.toLowerCase() !== "null" ? result : "";
};
const linkLabel = (value: string, fallback: string) => value.toLowerCase().includes("github") ? "GitHub" : value.toLowerCase().includes("linkedin") ? "LinkedIn" : value.toLowerCase().includes("facebook") ? "Facebook" : fallback;
const formatMonth = (value: unknown) => {
  const raw = text(value);
  if (!raw) return "";
  if (/^present$/i.test(raw)) return "Present";
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(raw);
  if (!match) return raw;
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)));
};
const dateRange = (item: any) => [formatMonth(item?.start_date || item?.start_year), formatMonth(item?.end_date || item?.end_year)].filter(Boolean).join(" — ");

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return <section style={{ marginTop: 18 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, paddingBottom: 5, borderBottom: `2px solid ${C.accent}` }}><h2 style={{ margin: 0, color: C.accentHover, fontSize: 14, fontWeight: 900, letterSpacing: ".35px", textTransform: "uppercase" }}>{title}</h2>{aside}</div><div style={{ paddingTop: 9 }}>{children}</div></section>;
}

export default function ClassicResumeTemplate({ resume }: { resume: any }) {
  const experience = asArray(resume.experience);
  const education = asArray(resume.education);
  const skillItems = asArray(resume.skills).map((item, index) => {
    const rawCategory = typeof item === "object" ? item?.category ?? item?.type ?? item?.group : null;
    const category = text(typeof rawCategory === "object" ? rawCategory?.name || rawCategory?.title : rawCategory) || "Programming";
    const rawOrder = typeof item === "object" ? item?.category_order ?? (typeof rawCategory === "object" ? rawCategory?.order : null) : null;
    return { name: text(typeof item === "object" ? item?.name || item?.skill : item), category, order: Number.isFinite(Number(rawOrder)) ? Number(rawOrder) : null, index };
  }).filter((item) => item.name);
  const skillGroupMap = skillItems.reduce((groups, item) => {
    const existing = groups.get(item.category);
    if (existing) existing.items.push(item);
    else groups.set(item.category, { category: item.category, order: item.order, firstIndex: item.index, items: [item] });
    return groups;
  }, new Map<string, { category: string; order: number | null; firstIndex: number; items: typeof skillItems }>());
  const skillGroups = [...skillGroupMap.values()].sort((a, b) => (a.order ?? a.firstIndex) - (b.order ?? b.firstIndex));
  const categoryLabel = (category: string) => ({ Programming: "Programming Languages", Frameworks: "Frameworks & Libraries", Databases: "Databases", Tools: "Tools", "Soft Skills": "Soft Skills", Concepts: "Concepts", Other: "Other Skills" }[category] ?? category);
  const projects = asArray(resume.projects);
  const certificates = asArray(resume.certificates);
  const languages = asArray(resume.languages);
  const achievements = asArray(resume.achievements);
  const totalExperience = resume.total_years_of_experience ?? resume.total_years_experience ?? null;
  const avatar = resume.avatar || resume.profile_image || resume.photo;
  const includeProfilePhoto = resume.include_profile_photo !== false && resume.include_profile_photo !== 0;
  const contact = [["Location", resume.location], ["Phone", resume.phone], ["Email", resume.email]].map(([label, value]) => [label, presentValue(value)] as const).filter(([, value]) => value);
  const socialLinks = [["LinkedIn", resume.linkedin], ["GitHub", resume.github], ["Portfolio", resume.portfolio]].map(([label, value]) => ({ label, value: presentValue(value) })).filter((item) => item.value);

  return <div className="classic-resume-page" style={{ maxWidth: 850, minHeight: 1100, margin: "0 auto", padding: "66px 54px 48px", boxSizing: "border-box", background: C.surface, color: "#30343a", boxShadow: "0 8px 30px rgba(62,48,27,.09)", borderRadius: 5, fontFamily: "Arial, Helvetica, sans-serif" }}>
    <style>{`@media (max-width:700px){.classic-resume-page{padding:30px 24px!important;min-height:auto!important}.classic-resume-header{gap:20px!important}.classic-resume-photo{width:88px!important;height:88px!important}.classic-skill-grid{grid-template-columns:repeat(2,1fr)!important}} @media print{.classic-resume-page{box-shadow:none!important;margin:0!important;max-width:none!important;border-radius:0!important}}`}</style>
    <header className="classic-resume-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 32, paddingBottom: 10 }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ margin: "4px 0 6px", color: C.accentHover, fontSize: 27, lineHeight: 1, fontWeight: 900, letterSpacing: ".4px", textTransform: "uppercase" }}>{resume.full_name || "Your Name"}</h1>
        <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", marginBottom: 6 }}>{resume.professional_title || "Professional Title"}</div>
        {contact.length > 0 && <div style={{ fontSize: 11.5, fontWeight: 500, color: "#454a51", lineHeight: 1.65 }}>{contact.map(([label, value]) => `${label}: ${value}`).join("  |  ")}</div>}
        {socialLinks.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 10.5, marginTop: 5 }}>{socialLinks.map(({ label, value }) => { const displayLabel = linkLabel(value, label); const Icon = displayLabel === "GitHub" ? Github : displayLabel === "LinkedIn" ? Linkedin : displayLabel === "Facebook" ? Facebook : Globe2; return <a key={`${label}-${value}`} href={/^https?:\/\//i.test(value) ? value : `https://${value}`} target="_blank" rel="noreferrer" style={{ color: C.accentHover, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}><Icon size={13}/><span>{value}</span></a>; })}</div>}
      </div>
      {includeProfilePhoto && <div className="classic-resume-photo" style={{ width: 112, height: 112, background: C.accentLight, overflow: "hidden", flexShrink: 0 }}><img src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(resume.full_name || "User")}&size=160&background=E8D8BC&color=654C27`} alt={resume.full_name || "Profile"} style={{ width: "100%", height: "100%", objectFit: "cover" }}/></div>}
    </header>

    {text(resume.summary) && <Section title="Summary"><p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#25282d", textAlign: "justify" }}>{resume.summary}</p></Section>}

    {experience.length > 0 && <Section title="Professional Experience" aside={totalExperience != null ? <span style={{ color: C.accentHover, fontSize: 12.5, fontWeight: 900 }}>Total Experience: {totalExperience} Years</span> : null}><div style={{ display: "grid", gap: 14 }}>{experience.map((item, index) => <article key={item.id ?? index}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 24, alignItems: "baseline" }}><div style={{ fontSize: 12 }}><strong>{text(item.title || item.position || "Experience")}</strong>{text(item.company) && <span style={{ marginLeft: 7, color: "#4b5057" }}>— {text(item.company)}</span>}</div><strong style={{ fontSize: 11, whiteSpace: "nowrap" }}>{dateRange(item)}</strong></div>
      {text(item.description) && <div style={{ marginTop: 6, fontSize: 11.5, lineHeight: 1.5, color: "#30343a", whiteSpace: "pre-line" }}>{text(item.description).split("\n").map((line, i) => <div key={i}>• {line.replace(/^[-•]\s*/, "")}</div>)}</div>}
    </article>)}</div></Section>}

    {education.length > 0 && <Section title="Education"><div style={{ display: "grid", gap: 12 }}>{education.map((item, index) => <article key={item.id ?? index}><div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 24 }}><strong style={{ fontSize: 12 }}>{[text(item.degree), text(item.field_of_study)].filter(Boolean).join(" in ")}</strong><strong style={{ fontSize: 11, whiteSpace: "nowrap" }}>{dateRange(item)}</strong></div><div style={{ marginTop: 3, fontSize: 11.5 }}>{text(item.university || item.institution)}</div></article>)}</div></Section>}

    {skillGroups.length > 0 && <Section title="Technical Skills"><div style={{ display: "grid", gap: 7 }}>{skillGroups.map((group) => <div key={group.category} style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "2px 6px", fontSize: 11.5, lineHeight: 1.5 }}><strong style={{ whiteSpace: "nowrap" }}>{categoryLabel(group.category)}:</strong><span>{group.items.map((item) => item.name).join(" · ")}</span></div>)}</div></Section>}

    {projects.length > 0 && <Section title="Projects"><div style={{ display: "grid", gap: 12 }}>{projects.map((item, index) => <article key={item.id ?? index}><div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}><strong style={{ fontSize: 12 }}>{text(item.name || item.title || "Project")}</strong>{text(item.link) && <a href={/^https?:\/\//i.test(text(item.link)) ? text(item.link) : `https://${text(item.link)}`} target="_blank" rel="noreferrer" style={{ color: C.accentHover, fontSize: 10.5, textDecoration: "none" }}>{item.link}</a>}</div>{text(item.description || item.summary) && <p style={{ margin: "5px 0 0", fontSize: 11.5, lineHeight: 1.5 }}>{item.description || item.summary}</p>}</article>)}</div></Section>}

    {achievements.length > 0 && <Section title="Activities & Achievements"><div style={{ display: "grid", gap: 8 }}>{achievements.map((item, index) => <article key={item.id ?? index}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><strong style={{ fontSize: 10.5 }}>{text(item.title || "Achievement")}{text(item.organization) && ` — ${text(item.organization)}`}</strong>{text(item.year) && <strong style={{ fontSize: 9.5 }}>{item.year}</strong>}</div>{text(item.description) && <p style={{ margin: "3px 0 0", fontSize: 9.5, lineHeight: 1.4 }}>{item.description}</p>}</article>)}</div></Section>}

    {(languages.length > 0 || certificates.length > 0) && <Section title="Additional Information"><div style={{ display: "grid", gap: 7, fontSize: 11.5, lineHeight: 1.45 }}>
      {languages.length > 0 && <div>• <strong>Languages:</strong> {languages.map((item) => `${text(item.language || item.name || item)}${text(item.level || item.proficiency) ? ` (${text(item.level || item.proficiency)})` : ""}`).join(", ")}</div>}
      {certificates.length > 0 && <div>• <strong>Certificates:</strong> {certificates.map((item) => [text(item.name || item.title || item), text(item.issuer)].filter(Boolean).join(" — ")).join("; ")}</div>}
    </div></Section>}
  </div>;
}
