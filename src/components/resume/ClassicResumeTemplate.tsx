import { C } from "../../constants/tokens";
import { resolveExperienceYears } from "../../utils/experience";

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
const formatMonth = (value: unknown) => {
  const raw = text(value);
  if (!raw) return "";
  if (/^present$/i.test(raw)) return "Present";
  return raw;
};
const dateRange = (item: any) => [formatMonth(item?.start_date || item?.start_year), formatMonth(item?.end_date || item?.end_year)].filter(Boolean).join(" — ");

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return <section style={{ marginTop: 25 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, paddingBottom: 6, borderBottom: `1px solid #B27A0B` }}><h2 style={{ margin: 0, color: "#A66F00", fontSize: 12, fontWeight: 800, letterSpacing: "1.15px", textTransform: "uppercase" }}>{title}</h2>{aside}</div><div style={{ paddingTop: 13 }}>{children}</div></section>;
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
  const totalExperience = resolveExperienceYears(
    resume.total_years_of_experience ?? resume.total_years_experience,
    experience
  );
  const avatar = resume.avatar || resume.profile_image || resume.photo;
  const includeProfilePhoto = resume.include_profile_photo !== false && resume.include_profile_photo !== 0;
  const contact = [resume.email, resume.phone, resume.location].map(presentValue).filter(Boolean);
  const socialLinks = [["LinkedIn", resume.linkedin], ["GitHub", resume.github], ["Portfolio", resume.portfolio]].map(([label, value]) => ({ label, value: presentValue(value) })).filter((item) => item.value);

  return <div className="classic-resume-page" style={{ width: 794, maxWidth: "100%", minHeight: 1123, margin: "0 auto", padding: "15px 45px 42px", boxSizing: "border-box", background: "#fff", color: "#232936", borderTop: "2px solid #20242a", boxShadow: "0 8px 30px rgba(15,23,42,.12)", fontFamily: "Arial, Helvetica, sans-serif" }}>
    <style>{`@media (max-width:700px){.classic-resume-page{padding:20px 22px 32px!important;min-height:auto!important;border-top-width:2px!important}.classic-resume-header{gap:18px!important}.classic-resume-photo{width:82px!important;height:82px!important}.classic-skill-grid{grid-template-columns:130px minmax(0,1fr)!important}} @media (max-width:460px){.classic-resume-photo{width:68px!important;height:68px!important}.classic-skill-grid{grid-template-columns:105px minmax(0,1fr)!important}} @media print{.classic-resume-page{width:210mm!important;min-height:297mm!important;padding:5mm 12mm 11mm!important;box-shadow:none!important;margin:0!important;max-width:none!important}}`}</style>
    <header className="classic-resume-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 28, paddingBottom: 5 }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ margin: "0 0 13px", color: "#20252f", fontSize: 31, lineHeight: 1, fontWeight: 800, letterSpacing: ".1px" }}>{resume.full_name || "Your Name"}</h1>
        <div style={{ color: "#B17805", fontSize: 14, fontWeight: 800, marginBottom: 18 }}>{resume.professional_title || "Professional Title"}</div>
        {(contact.length > 0 || socialLinks.length > 0) && <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "3px 7px", fontSize: 8, fontWeight: 400, color: "#4b5260", lineHeight: 1.5 }}>
          {[...contact, ...socialLinks.map(({ value }) => value)].map((value, index, values) => <span key={`${value}-${index}`} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span>{value}</span>{index < values.length - 1 && <span style={{ color: C.accent }}>│</span>}</span>)}
        </div>}
      </div>
      {includeProfilePhoto && <div className="classic-resume-photo" style={{ width: 96, height: 96, background: C.accentLight, overflow: "hidden", flexShrink: 0, borderRadius: 2 }}><img src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(resume.full_name || "User")}&size=160&background=E8D8BC&color=654C27`} alt={resume.full_name || "Profile"} style={{ width: "100%", height: "100%", objectFit: "cover" }}/></div>}
    </header>

    {text(resume.summary) && <Section title="Summary"><p style={{ margin: 0, fontSize: 9.5, lineHeight: 1.75, color: "#2f3540" }}>{resume.summary}</p></Section>}

    {experience.length > 0 && <Section title="Professional Experience" aside={totalExperience != null ? <span style={{ color: "#A66F00", fontSize: 12, fontWeight: 800, letterSpacing: ".8px", textTransform: "uppercase" }}>Total Experience: {totalExperience} Years</span> : null}><div style={{ display: "grid", gap: 15 }}>{experience.map((item, index) => <article key={item.id ?? index}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 24, alignItems: "baseline" }}><strong style={{ fontSize: 10.5 }}>{text(item.title || item.position || "Experience")}</strong><span style={{ fontSize: 8, color: "#687080", whiteSpace: "nowrap" }}>{dateRange(item)}</span></div>
      {text(item.company) && <div style={{ marginTop: 8, color: "#A66F00", fontSize: 9.5, fontWeight: 800 }}>{text(item.company)}</div>}
      {text(item.description) && <div style={{ marginTop: 10, fontSize: 9.5, lineHeight: 1.7, color: "#303640", whiteSpace: "pre-line" }}>{text(item.description)}</div>}
    </article>)}</div></Section>}

    {education.length > 0 && <Section title="Education"><div style={{ display: "grid", gap: 12 }}>{education.map((item, index) => <article key={item.id ?? index}><div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 24 }}><strong style={{ fontSize: 10.5 }}>{[text(item.degree), text(item.field_of_study)].filter(Boolean).join(" in ")}</strong><span style={{ fontSize: 8, color: "#687080", whiteSpace: "nowrap" }}>{dateRange(item)}</span></div><div style={{ marginTop: 8, fontSize: 9.5, color: "#A66F00", fontWeight: 800 }}>{text(item.university || item.institution)}</div>{presentValue(item.gpa) && <div style={{ marginTop: 5, fontSize: 8, color: "#747b87" }}>GPA: {item.gpa}</div>}</article>)}</div></Section>}

    {skillGroups.length > 0 && <Section title="Technical Skills"><div className="classic-skill-grid" style={{ display: "grid", gridTemplateColumns: "190px minmax(0, 1fr)", gap: "13px 16px", fontSize: 9.5, lineHeight: 1.4 }}>{skillGroups.map((group) => <div key={group.category} style={{ display: "contents" }}><strong style={{ color: "#A66F00" }}>{categoryLabel(group.category)}</strong><span>{group.items.map((item) => item.name).join(" · ")}</span></div>)}</div></Section>}

    {projects.length > 0 && <Section title="Projects"><div style={{ display: "grid", gap: 12 }}>{projects.map((item, index) => <article key={item.id ?? index}><div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}><strong style={{ fontSize: 10.5 }}>{text(item.name || item.title || "Project")}</strong>{text(item.link) && <a href={/^https?:\/\//i.test(text(item.link)) ? text(item.link) : `https://${text(item.link)}`} target="_blank" rel="noreferrer" style={{ color: "#A66F00", fontSize: 8.5, textDecoration: "none" }}>{item.link}</a>}</div>{text(item.description || item.summary) && <p style={{ margin: "12px 0 0", fontSize: 9.5, lineHeight: 1.7 }}>{item.description || item.summary}</p>}</article>)}</div></Section>}

    {(languages.length > 0 || certificates.length > 0 || achievements.length > 0) && <Section title="Additional Information"><div style={{ display: "grid", gap: 14, fontSize: 9.5, lineHeight: 1.6 }}>
      {languages.length > 0 && <div><strong style={{ display: "block", marginBottom: 5, color: "#A66F00" }}>Languages</strong><div style={{ display: "grid", gap: 2 }}>{languages.map((item, index) => <div key={item.id ?? index}>{text(item.language || item.name || item)}{text(item.level || item.proficiency) ? ` - ${text(item.level || item.proficiency)}` : ""}</div>)}</div></div>}
      {certificates.length > 0 && <div><strong style={{ display: "block", marginBottom: 5, color: "#A66F00" }}>Certifications</strong>{certificates.map((item, index) => <div key={item.id ?? index}>{text(item.name || item.title || item)}{text(item.issuer) ? ` - ${text(item.issuer)}` : ""}{text(item.year || item.date) ? `, ${text(item.year || item.date)}` : ""}</div>)}</div>}
      {achievements.length > 0 && <div><strong style={{ display: "block", marginBottom: 5, color: "#A66F00" }}>Achievements</strong>{achievements.map((item, index) => <div key={item.id ?? index}><b>{text(item.title || "Achievement")}</b>{text(item.organization) ? ` — ${text(item.organization)}` : ""}{text(item.description) ? ` - ${text(item.description)}` : ""}</div>)}</div>}
    </div></Section>}
  </div>;
}
