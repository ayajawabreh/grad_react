import { useState, useEffect } from "react";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import { MapPin, ExternalLink, GraduationCap, Briefcase, CheckCircle, XCircle } from "lucide-react";
import { API } from "../../imports/api";
import EditProfileModal from "./EditProfileModal";

const TABS = ["Overview", "Experience", "Education", "Skills"] as const;

export default function StudentProfile() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [logo, setLogo] = useState<File | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await API.get("/student/profile");
      setStudent(response.data);
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Failed to load profile data" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    try {
      setSaving(true);
      const response = await API.put("/student/profile", formData);
      setStudent(response.data);
      setToast({ type: "success", message: "Changes saved successfully" });
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to save changes, please try again";
      setToast({ type: "error", message: msg });
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  };

  const skillsList: string[] = Array.isArray(student?.skills)
    ? student.skills.map((s: any) => (typeof s === "string" ? s : s?.name)).filter(Boolean)
    : typeof student?.skills === "string" && student.skills.trim() !== ""
      ? student.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

  if (loading) return <div style={{ padding: 24, textAlign: "center", fontFamily: F, color: C.text }}>Loading Profile...</div>;
  if (!student) return <div style={{ padding: 24, textAlign: "center", fontFamily: F, color: C.text }}>Profile not found.</div>;

  console.log(student);
  return (
    <div style={{ fontFamily: F, color: C.text, position: "relative" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            borderRadius: 12,
            background: toast.type === "success" ? "#16a34a" : "#dc2626",
            color: "#fff",
            fontFamily: F,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            animation: "toastIn 0.2s ease",
          }}
        >
          {toast.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.message}
        </div>
      )}

      <div style={{ background: C.surface, borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 24 }}>
       <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, marginBottom: 24, padding: 28, position: "relative" }}>
  <Btn
    v="outline"
    size="sm"
    style={{ position: "absolute", top: 24, right: 28 }}
    onClick={() => setShowEditModal(true)}
  >
    Edit Profile
  </Btn>
  
  <img
    src={student.avatar || "https://via.placeholder.com/88"}
    alt={student.name}
    style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", marginBottom: 16 }}
  />
  
  <div>
    <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>{student.name}</h1>
    <p style={{ color: C.textSec, margin: "0 0 8px", fontSize: 14 }}>{student.headline}</p>
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <span style={{ color: C.textSec, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
        <GraduationCap size={13} />
        {student.univ}
      </span>
      <span style={{ color: C.textSec, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
        <MapPin size={13} />
        {student.location}
      </span>
      {student.portfolio && (
        <a
          href={`https://${student.portfolio}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: C.accent, fontSize: 13, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}
        >
          <ExternalLink size={13} />
          {student.portfolio}
        </a>
      )}
    </div>
  </div>
</div>
      </div>

      <div style={{ background: C.surface, borderRadius: 16, padding: "16px 20px", border: `1px solid ${C.border}`, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Profile Completion</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{student.completion}%</span>
        </div>
        <div style={{ height: 6, background: C.divider, borderRadius: 99 }}>
          <div style={{ height: "100%", width: `${student.completion}%`, background: C.accent, borderRadius: 99 }} />
        </div>
      </div>

      <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 4, padding: "16px 20px", borderBottom: `1px solid ${C.divider}` }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 18px",
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: F,
                cursor: "pointer",
                border: "none",
                background: tab === t ? C.accent : "transparent",
                color: tab === t ? "#fff" : C.textSec,
                transition: "all 0.15s",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {tab === "Overview" && (
  <div>
    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>About</h3>
    <p style={{ color: C.textSec, fontSize: 14, lineHeight: 1.7, marginBottom: 0 }}>{student.bio || "No bio available."}</p>
  </div>
)}

        {tab === "Experience" && (
  <div>
    {Array.isArray(student.experiences) && student.experiences.length > 0 ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {student.experiences.map((exp: any) => (
          <div
            key={exp.id}
            style={{
              display: "flex",
              gap: 14,
              padding: 18,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: C.accentLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Briefcase size={18} color={C.accent} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
                {exp.position || exp.job_title || "Experience"}
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: C.textSec, fontWeight: 600 }}>
                {exp.company}
                {(exp.start_date || exp.end_date) && (
                  <span style={{ fontWeight: 400 }}>
                    {" · "}
                    {exp.start_date}
                    {exp.start_date && exp.end_date ? " - " : ""}
                    {exp.end_date}
                  </span>
                )}
              </p>
              {exp.description && (
                <p style={{ margin: "10px 0 0", fontSize: 13.5, color: C.textSec, lineHeight: 1.7 }}>
                  {exp.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p style={{ color: C.textSec, fontSize: 14 }}>No experiences listed.</p>
    )}
  </div>
)}

          {tab === "Education" && (
            <div style={{ padding: 20, border: `1px solid ${C.border}`, borderRadius: 14 }}>
              {student.univ || student.major || student.gpa || student.graduation ? (
                <div style={{ display: "flex", gap: 14 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: C.infoBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <GraduationCap size={18} color={C.info} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{student.univ || "—"}</p>
                    {student.major && <p style={{ margin: "3px 0", fontSize: 13, color: C.textSec }}>B.S. {student.major}</p>}
                    {(student.gpa || student.graduation) && (
                      <p style={{ margin: "3px 0", fontSize: 13, color: C.textSec }}>
                        {student.gpa ? `GPA: ${student.gpa}` : ""}
                        {student.gpa && student.graduation ? " · " : ""}
                        {student.graduation ? `Graduating ${student.graduation}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ color: C.textSec, fontSize: 14 }}>No education info listed.</p>
              )}
            </div>
          )}

          {tab === "Skills" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {skillsList.length > 0 ? (
                skillsList.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "6px 14px",
                      background: C.accentLight,
                      color: C.accentHover,
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {s}
                  </span>
                ))
              ) : (
                <p style={{ color: C.textSec, fontSize: 14 }}>No skills listed.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <EditProfileModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} student={student} save={handleSave} saving={saving} />

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}