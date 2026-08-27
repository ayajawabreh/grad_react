import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Save,
  Eye,
  Download,
  Sparkles,
  Trash2,
  GraduationCap,
  Code2,
  Briefcase,
  FolderGit2,
  Award,
  Languages as LanguagesIcon,
  Check,
  X,
  AlertTriangle,
  Trophy,
} from "lucide-react";

import { C, F } from "../../constants/tokens";
import { API } from "../../imports/api";
import { useSyncResourceVersion } from "../../sync/useSyncResourceVersion";
import { Btn } from "../../components/ui";
import ClassicResumeTemplate from "../../components/resume/ClassicResumeTemplate";

interface ToastState {
  show: boolean;
  type: "success" | "error" | "warning";
  message: string;
}

interface EducationItem {
  id: string;
  degree: string;
  university: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
}

interface SkillItem {
  id: string;
  name: string;
  category?: string;
}

interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface ProjectItem {
  id: string;
  name: string;
  link: string;
  description: string;
}

interface CertificateItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

interface LanguageItem {
  id: string;
  language: string;
  level: string;
}

const genId = () => Math.random().toString(36).slice(2, 9);

function useListState<T extends { id: string }>(initial: T[] = []) {
  const [items, setItems] = useState<T[]>(initial);

  const add = (empty: Omit<T, "id">) => {
    setItems((prev) => [
      ...prev,
      {
        ...(empty as object),
        id: genId(),
      } as T,
    ]);
  };

  const update = (
    id: string,
    field: keyof T,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const remove = (id: string) => {
    setItems((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  return {
    items,
    setItems,
    add,
    update,
    remove,
  };
}

const smallInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: `1px solid ${C.border || "#e2e8f0"}`,
  fontFamily: F,
  fontSize: 13.5,
  color: C.text,
  background: "#fff",
  outline: "none",
  transition: "all 0.2s ease",
};

const smallLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: C.textSec,
  display: "block",
  marginBottom: 4,
};

const addBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "transparent",
  border: `1px dashed ${C.accent || "#3b82f6"}`,
  color: C.accent || "#3b82f6",
  padding: "7px 12px",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: F,
  fontSize: 12.5,
  fontWeight: 600,
};

const removeBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: 10,
  right: 10,
  background: "#fee2e2",
  border: "1px solid #fca5a5",
  color: "#ef4444",
  width: 26,
  height: 26,
  borderRadius: 8,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={smallLabelStyle}>{label}{required && <span style={{ color: C.error }}> *</span>}</label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{ ...smallInputStyle, borderColor: error ? C.error : smallInputStyle.borderColor }}
      />
      {error && <div style={{ marginTop: 4, fontSize: 11, color: C.error }}>{error}</div>}
    </div>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={smallLabelStyle}>{label}</label>

      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{
          ...smallInputStyle,
          resize: "vertical",
          lineHeight: 1.5,
        }}
      />
    </div>
  );
}

function DynamicSection({
  title,
  Icon,
  items,
  onAdd,
  onRemove,
  addLabel,
  renderItem,
}: {
  title: string;
  Icon: any;
  items: { id: string }[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  addLabel: string;
  renderItem: (item: any) => React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: 32,
        border: `1px solid ${C.border || "#e2e8f0"}`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon size={18} color={C.accent || "#3b82f6"} />

          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              margin: 0,
              color: C.text,
            }}
          >
            {title}
          </h3>
        </div>

        <button
          type="button"
          onClick={onAdd}
          style={addBtnStyle}
        >
          + {addLabel}
        </button>
      </div>

      {items.length === 0 && (
        <p
          style={{
            fontSize: 13,
            color: C.textSec,
            margin: 0,
          }}
        >
          No {title.toLowerCase()} added yet.
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              position: "relative",
              padding: "16px 44px 8px 16px",
              borderRadius: 12,
              border: `1px solid ${C.divider || "#f1f5f9"}`,
              background: "#fafafa",
            }}
          >
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              style={removeBtnStyle}
            >
              <Trash2 size={14} />
            </button>

            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResumeBuilder() {
  const resumeSyncVersion = useSyncResourceVersion("resume");
  const studentSyncVersion = useSyncResourceVersion("student");
  const nav = useNavigate();
  const location = useLocation();
  const resumeReturnTo =
    (location.state as { returnTo?: string } | null)?.returnTo ||
    sessionStorage.getItem("cb_resume_return_to");
  const uploadedResume = (location.state as { uploadedResume?: any } | null)?.uploadedResume;
  const uploadedResumeRef = useRef(uploadedResume);

  const handleResumeBack = () => {
    if (resumeReturnTo) {
      sessionStorage.removeItem("cb_resume_return_to");
      nav(resumeReturnTo);
      return;
    }
    nav("/student/resume");
  };

  const [tpl, setTpl] = useState("executive");
  const [resumeId, setResumeId] = useState<number | null>(null);

  const [fullName, setFullName] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [includeProfilePhoto, setIncludeProfilePhoto] = useState(true);

  const [aiLoading, setAiLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [resumeMetadata, setResumeMetadata] = useState<any>({});

  const education = useListState<EducationItem>([]);
  const skills = useListState<SkillItem>([]);
  const experience = useListState<ExperienceItem>([]);
  const projects = useListState<ProjectItem>([]);
  const certificates = useListState<CertificateItem>([]);
  const languages = useListState<LanguageItem>([]);
  const achievements = useListState<AchievementItem>([]);

  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: "success",
    message: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [experienceDateErrors, setExperienceDateErrors] = useState<Record<string, { start?: string; end?: string }>>({});

  const showToast = (
    type: "success" | "error" | "warning",
    message: string
  ) => {
    setToast({
      show: true,
      type,
      message,
    });

    if (type !== "warning") {
      setTimeout(() => {
        setToast((prev) => ({
          ...prev,
          show: false,
        }));
      }, 4000);
    }
  };

  useEffect(() => {
    loadResume();
  }, [resumeSyncVersion, studentSyncVersion]);

  const withLocalIds = <T,>(
    arr: any[]
  ): (T & { id: string })[] =>
    (Array.isArray(arr) ? arr : []).map((item) => ({
      ...item,
      id: item?.id ? String(item.id) : genId(),
    }));

  const loadResume = async () => {
    try {
      const response = await API.get("/student/resume");
      const loadedResume = uploadedResumeRef.current ?? response.data ?? {};
      uploadedResumeRef.current = null;

      console.log("Loaded Resume:", loadedResume);
      setResumeMetadata(loadedResume);

      setResumeId(loadedResume?.id ?? response.data?.id ?? null);
      setFullName(loadedResume?.full_name ?? "");
      setProfessionalTitle(
        loadedResume?.professional_title ?? ""
      );
      setSummary(loadedResume?.summary ?? "");
      setTpl(loadedResume?.template ?? "executive");
      setIncludeProfilePhoto(loadedResume?.include_profile_photo !== false && loadedResume?.include_profile_photo !== 0);

      education.setItems(
        withLocalIds<EducationItem>(
          loadedResume?.education ?? []
        )
      );

      skills.setItems(withLocalIds<SkillItem>(loadedResume?.skills ?? []).map((item: any) => ({ ...item, category: item.category ?? item.type ?? item.group ?? "Programming" })));

      experience.setItems(withLocalIds<ExperienceItem>(loadedResume?.experience ?? []).map((item: any) => ({ ...item, title: item.title ?? item.position ?? "" })));

      projects.setItems(
        withLocalIds<ProjectItem>(
          loadedResume?.projects ?? []
        )
      );

      certificates.setItems(
        withLocalIds<CertificateItem>(
          loadedResume?.certificates ?? []
        )
      );

      languages.setItems(
        withLocalIds<LanguageItem>(
          loadedResume?.languages ?? []
        )
      );
      achievements.setItems(withLocalIds<AchievementItem>(loadedResume?.achievements ?? []));
    } catch (error) {
      console.error("Load resume error:", error);
    }
  };

  const saveResume = async (showSuccessToast = true): Promise<number | null> => {
    const dateErrors: Record<string, { start?: string; end?: string }> = {};
    experience.items.forEach((item) => {
      const startValid = /^\d{4}-(0[1-9]|1[0-2])$/.test(item.start_date.trim());
      const end = item.end_date.trim();
      const endValid = /^\d{4}-(0[1-9]|1[0-2])$/.test(end) || /^present$/i.test(end);
      if (!startValid) dateErrors[item.id] = { ...dateErrors[item.id], start: "Enter the start date in YYYY-MM format." };
      if (!endValid) dateErrors[item.id] = { ...dateErrors[item.id], end: "Enter YYYY-MM, or Present for a current role." };
      else if (startValid && !/^present$/i.test(end) && end < item.start_date.trim()) dateErrors[item.id] = { ...dateErrors[item.id], end: "End date cannot be earlier than the start date." };
    });
    setExperienceDateErrors(dateErrors);
    if (Object.keys(dateErrors).length > 0) {
      return null;
    }
    const data = {
      title: "My Resume",
      template: tpl || "executive",
      full_name: fullName || "",
      professional_title: professionalTitle || "",
      include_profile_photo: includeProfilePhoto,
      summary: summary || "",
      education: education.items,
      skills: skills.items,
      experience: experience.items,
      projects: projects.items,
      certificates: certificates.items,
      languages: languages.items,
      achievements: achievements.items,
      is_public: false,
    };

    setIsSaving(true);
    try {
      console.log("Sending data:", data);

      let savedId: number;

      if (resumeId) {
        const response = await API.put(
          `/student/resume/${resumeId}`,
          data
        );

        savedId = response.data.resume.id;
      } else {
        const response = await API.post(
          "/student/resume",
          data
        );

        savedId = response.data.resume.id;
      }

      setResumeId(savedId);

      await Promise.allSettled([
        API.get("/student/profile"),
        API.get("/student/resume"),
      ]);

      if (showSuccessToast) {
        showToast(
          "success",
          "Resume saved successfully 🎉"
        );
      }

      return savedId;
    } catch (error: any) {
      console.log("========== REQUEST ==========");
      console.log(data);

      console.log("========== STATUS ==========");
      console.log(error.response?.status);

      console.log("========== RESPONSE ==========");
      console.log(error.response?.data);

      console.log("========== ERRORS ==========");
      console.log(error.response?.data?.errors);

      showToast(
        "error",
        "Error saving resume."
      );

      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);

    try {
      const id = await saveResume(false);

      if (!id) {
        return;
      }

      const response = await API.get(
        `/student/resume/${id}/pdf`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `${(
        fullName || "resume"
      ).replace(/\s+/g, "_")}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      showToast(
        "success",
        "PDF downloaded successfully."
      );
    } catch (error: any) {
      console.error(
        "PDF download error:",
        error.response?.data || error
      );

      showToast(
        "error",
        "Failed to download PDF. Please try again."
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePreview = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsPreviewOpen(true);
  };

  const previewResume = {
    ...resumeMetadata,
    full_name: fullName,
    professional_title: professionalTitle,
    include_profile_photo: includeProfilePhoto,
    summary,
    education: education.items,
    skills: skills.items,
    experience: experience.items,
    projects: projects.items,
    certificates: certificates.items,
    achievements: achievements.items,
    languages: languages.items,
  };

  const deleteResume = async () => {
    if (!resumeId) {
      return;
    }

    try {
      await API.delete(
        `/student/resume/${resumeId}`
      );

      setResumeId(null);
      setFullName("");
      setProfessionalTitle("");
      setSummary("");
      setIncludeProfilePhoto(true);
      setTpl("executive");

      education.setItems([]);
      skills.setItems([]);
      experience.setItems([]);
      projects.setItems([]);
      certificates.setItems([]);
      languages.setItems([]);
      achievements.setItems([]);

      showToast(
        "success",
        "Resume deleted successfully"
      );

      setShowDeleteModal(false);
    } catch (error: any) {
      console.error(
        "Delete error:",
        error.response?.data || error
      );

      showToast(
        "error",
        "Delete failed"
      );
    }
  };

  const handleAIImprove = async () => {
    if (!summary.trim()) {
      showToast(
        "warning",
        "Please write your professional summary first."
      );

      return;
    }

    if (summary.trim().length < 10) {
      showToast(
        "warning",
        "Professional summary must be at least 10 characters."
      );

      return;
    }

    setAiLoading(true);

    try {
      const response = await API.post(
        "/student/resume/ai-improve",
        {
          text: summary.trim(),
        }
      );

      console.log(
        "AI Improve Response:",
        response.data
      );

      const improvedText =
        response.data?.improved_text;

      if (!improvedText) {
        showToast(
          "error",
          "AI did not return an improved summary."
        );

        return;
      }

      setSummary(improvedText);

      showToast(
        "success",
        "Summary enhanced using AI ✨"
      );
    } catch (error: any) {
      console.error(
        "AI Improve Error:",
        error.response?.data || error
      );

      if (error.response?.status === 422) {
        showToast(
          "warning",
          error.response?.data?.errors?.text?.[0] ||
            "Please enter a valid professional summary."
        );
      } else if (error.response?.status === 401) {
        showToast(
          "error",
          "Your session has expired. Please login again."
        );
      } else {
        showToast(
          "error",
          "Failed to improve your summary. Please try again."
        );
      }
    } finally {
      setAiLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: `1px solid ${C.border || "#e2e8f0"}`,
    fontFamily: F,
    fontSize: "14px",
    color: C.text,
    background: "#fff",
    outline: "none",
    transition: "all 0.2s ease",
    marginTop: "8px",
  };

  const labelStyle = {
    fontSize: "13px",
    fontWeight: 600,
    color: C.text,
    display: "block",
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: "#f0fdf4",
          border: "#bbf7d0",
          text: "#166534",
          icon: Check,
        };

      case "error":
        return {
          bg: "#fef2f2",
          border: "#fca5a5",
          text: "#991b1b",
          icon: X,
        };

      case "warning":
        return {
          bg: "#fffbeb",
          border: "#fde68a",
          text: "#92400e",
          icon: AlertTriangle,
        };
    }
  };

  const toastStyle = getToastStyles();

  return (
    <div
      style={{
        fontFamily: F,
        color: C.text,
        padding: "24px",
        maxWidth: "1200px",
        margin: "0 auto",
        position: "relative",
      }}
    >
      {toast.show && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor: toastStyle.bg,
            border: `1px solid ${toastStyle.border}`,
            color: toastStyle.text,
            padding: "14px 20px",
            borderRadius: "12px",
            boxShadow:
              "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
            maxWidth: "400px",
          }}
        >
          <toastStyle.icon size={18} />

          <span
            style={{
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {toast.message}
          </span>

          <button
            onClick={() =>
              setToast((prev) => ({
                ...prev,
                show: false,
              }))
            }
            style={{
              background: "none",
              border: "none",
              color: toastStyle.text,
              cursor: "pointer",
              marginLeft: "8px",
              padding: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {isPreviewOpen && (
        <div onClick={() => setIsPreviewOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10000, overflowY: "auto", padding: "24px", background: "rgba(20,24,31,.72)", backdropFilter: "blur(4px)" }}>
          <div style={{ maxWidth: 850, margin: "0 auto 12px", display: "flex", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setIsPreviewOpen(false)} aria-label="Close preview" style={{ width: 38, height: 38, borderRadius: 10, border: 0, background: C.surface, color: C.text, display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 6px 20px rgba(0,0,0,.2)" }}><X size={19} /></button>
          </div>
          <div onClick={(event) => event.stopPropagation()}><ClassicResumeTemplate resume={previewResume} /></div>
        </div>
      )}

      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor:
              "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "440px",
              width: "90%",
              boxShadow:
                "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: "#92400e",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#fffbeb",
                  padding: "8px",
                  borderRadius: "50%",
                  border: "1px solid #fde68a",
                }}
              >
                <AlertTriangle size={20} />
              </div>

              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                Confirm Deletion
              </h3>
            </div>

            <p
              style={{
                color: C.textSec,
                fontSize: "14px",
                margin: "0 0 24px 0",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to delete your resume?
              This action cannot be undone and will
              completely wipe it from our servers.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={() =>
                  setShowDeleteModal(false)
                }
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Cancel
              </button>

              <button
                onClick={deleteResume}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Yes, Delete It
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleResumeBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "none",
          background: "transparent",
          color: C.textSec,
          cursor: "pointer",
          fontFamily: F,
          fontSize: 13,
          fontWeight: 600,
          padding: 0,
          marginBottom: 16,
        }}
      >
        ← Back to My Resume
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Resume Builder
          </h1>

          <p
            style={{
              color: C.textSec,
              fontSize: 14,
              margin: "4px 0 0 0",
            }}
          >
            Craft your perfect resume with AI assistance
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
          }}
        >
          <Btn
            v="outline"
            icon={Save}
            onClick={() => void saveResume()}
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </Btn>

          <Btn
            v="dark"
            icon={Eye}
            onClick={handlePreview}
            type="button"
          >
            Preview
          </Btn>

          <Btn
            v="primary"
            icon={Download}
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            {downloadingPdf
              ? "Preparing..."
              : "Download PDF"}
          </Btn>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto 16px", padding: "14px 18px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.surface, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div><div style={{ fontSize: 13.5, fontWeight: 700 }}>Include Profile Photo</div><div style={{ marginTop: 3, fontSize: 11.5, color: C.textMuted }}>Use the avatar from your student profile in this CV.</div></div>
        <button type="button" role="switch" aria-checked={includeProfilePhoto} onClick={() => setIncludeProfilePhoto((current) => !current)} style={{ width: 54, height: 29, padding: 3, border: 0, borderRadius: 99, background: includeProfilePhoto ? C.accent : C.border, cursor: "pointer", transition: "background .2s", flexShrink: 0 }}>
          <span style={{ display: "block", width: 23, height: 23, borderRadius: "50%", background: C.surface, transform: `translateX(${includeProfilePhoto ? 25 : 0}px)`, transition: "transform .2s", boxShadow: "0 2px 5px rgba(0,0,0,.2)" }} />
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 32,
            border: `1px solid ${C.border || "#e2e8f0"}`,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
            <div>
              <label style={labelStyle}>
                Full Name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                placeholder="John Doe"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Professional Title
              </label>

              <input
                type="text"
                value={professionalTitle}
                onChange={(e) =>
                  setProfessionalTitle(
                    e.target.value
                  )
                }
                placeholder="Software Engineer"
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <label style={labelStyle}>
                Professional Summary
              </label>

              <Btn
                v="ghost"
                size="sm"
                icon={Sparkles}
                onClick={handleAIImprove}
                disabled={aiLoading}
                style={{
                  color:
                    C.accent || "#3b82f6",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {aiLoading
                  ? "Improving..."
                  : "AI Improve"}
              </Btn>
            </div>

            <textarea
              value={summary}
              onChange={(e) =>
                setSummary(e.target.value)
              }
              placeholder="Briefly describe your career background and key milestones..."
              rows={5}
              style={{
                ...inputStyle,
                resize: "vertical",
                lineHeight: "1.5",
              }}
            />
          </div>
        </div>

        <DynamicSection
          title="Education"
          Icon={GraduationCap}
          items={education.items}
          addLabel="Add Education"
          onAdd={() =>
            education.add({
              degree: "",
              university: "",
              field_of_study: "",
              start_date: "",
              end_date: "",
            })
          }
          onRemove={education.remove}
          renderItem={(item: EducationItem) => (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <FieldInput
                  label="Degree"
                  value={item.degree}
                  onChange={(e) =>
                    education.update(
                      item.id,
                      "degree",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Bachelor of Science"
                />

                <FieldInput
                  label="University"
                  value={item.university}
                  onChange={(e) =>
                    education.update(
                      item.id,
                      "university",
                      e.target.value
                    )
                  }
                  placeholder="e.g. An-Najah National University"
                />
              </div>

              <FieldInput
                label="Field of Study"
                value={item.field_of_study}
                onChange={(e) =>
                  education.update(
                    item.id,
                    "field_of_study",
                    e.target.value
                  )
                }
                placeholder="e.g. Computer Science"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <FieldInput
                  label="Start Year"
                  value={item.start_date}
                  onChange={(e) =>
                    education.update(
                      item.id,
                      "start_date",
                      e.target.value
                    )
                  }
                  placeholder="2022"
                />

                <FieldInput
                  label="End Year"
                  value={item.end_date}
                  onChange={(e) =>
                    education.update(
                      item.id,
                      "end_date",
                      e.target.value
                    )
                  }
                  placeholder="2026"
                />
              </div>

            </>
          )}
        />

        <DynamicSection
          title="Skills"
          Icon={Code2}
          items={skills.items}
          addLabel="Add Skill"
          onAdd={() =>
            skills.add({
              name: "",
              category: "Programming",
            })
          }
          onRemove={skills.remove}
          renderItem={(item: SkillItem) => (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <FieldInput label="Skill" value={item.name} onChange={(e) => skills.update(item.id, "name", e.target.value)} placeholder="e.g. React" />
              <div><label style={smallLabelStyle}>Category</label><select value={item.category ?? "Programming"} onChange={(e) => skills.update(item.id, "category", e.target.value)} style={smallInputStyle}><option>Programming</option><option>Frameworks</option><option>Databases</option><option>Tools</option><option>Soft Skills</option><option>Concepts</option><option>Other</option></select></div>
            </div>
          )}
        />

        <DynamicSection
          title="Work Experience"
          Icon={Briefcase}
          items={experience.items}
          addLabel="Add Experience"
          onAdd={() =>
            experience.add({
              title: "",
              company: "",
              start_date: "",
              end_date: "",
              description: "",
            })
          }
          onRemove={experience.remove}
          renderItem={(item: ExperienceItem) => (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <FieldInput
                  label="Job Title"
                  value={item.title}
                  onChange={(e) =>
                    experience.update(
                      item.id,
                      "title",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Frontend Developer Intern"
                />

                <FieldInput
                  label="Company"
                  value={item.company}
                  onChange={(e) =>
                    experience.update(
                      item.id,
                      "company",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Company X"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <FieldInput
                  label="Start Date (YYYY-MM)"
                  required
                  value={item.start_date}
                  onChange={(e) => {
                    experience.update(
                      item.id,
                      "start_date",
                      e.target.value
                    );
                    setExperienceDateErrors((current) => ({ ...current, [item.id]: { ...current[item.id], start: undefined } }));
                  }}
                  placeholder="e.g. 2023-01"
                  error={experienceDateErrors[item.id]?.start}
                />

                <FieldInput
                  label="End Date (YYYY-MM or Present)"
                  required
                  value={item.end_date}
                  onChange={(e) => {
                    experience.update(
                      item.id,
                      "end_date",
                      e.target.value
                    );
                    setExperienceDateErrors((current) => ({ ...current, [item.id]: { ...current[item.id], end: undefined } }));
                  }}
                  placeholder="e.g. 2024-06 or Present"
                  error={experienceDateErrors[item.id]?.end}
                />
              </div>

              <FieldTextarea
                label="Description"
                value={item.description}
                onChange={(e) =>
                  experience.update(
                    item.id,
                    "description",
                    e.target.value
                  )
                }
                placeholder="What did you do in this role?"
              />
            </>
          )}
        />

        <DynamicSection
          title="Projects"
          Icon={FolderGit2}
          items={projects.items}
          addLabel="Add Project"
          onAdd={() =>
            projects.add({
              name: "",
              link: "",
              description: "",
            })
          }
          onRemove={projects.remove}
          renderItem={(item: ProjectItem) => (
            <>
              <FieldInput
                label="Project Name"
                value={item.name}
                onChange={(e) =>
                  projects.update(
                    item.id,
                    "name",
                    e.target.value
                  )
                }
                placeholder="e.g. HireMatch Platform"
              />

              <FieldInput
                label="Link (GitHub / Live Demo)"
                value={item.link}
                onChange={(e) =>
                  projects.update(
                    item.id,
                    "link",
                    e.target.value
                  )
                }
                placeholder="e.g. github.com/username/project"
              />

              <FieldTextarea
                label="Description"
                value={item.description}
                onChange={(e) =>
                  projects.update(
                    item.id,
                    "description",
                    e.target.value
                  )
                }
                placeholder="Briefly describe the project and your role in it..."
              />
            </>
          )}
        />

        <DynamicSection
          title="Certificates"
          Icon={Award}
          items={certificates.items}
          addLabel="Add Certificate"
          onAdd={() =>
            certificates.add({
              name: "",
              issuer: "",
              year: "",
            })
          }
          onRemove={certificates.remove}
          renderItem={(item: CertificateItem) => (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10,
              }}
            >
              <FieldInput
                label="Certificate Name"
                value={item.name}
                onChange={(e) =>
                  certificates.update(
                    item.id,
                    "name",
                    e.target.value
                  )
                }
                placeholder="e.g. React Course Certificate"
              />

              <FieldInput
                label="Issuer"
                value={item.issuer}
                onChange={(e) =>
                  certificates.update(
                    item.id,
                    "issuer",
                    e.target.value
                  )
                }
                placeholder="e.g. Coursera"
              />

              <FieldInput
                label="Year"
                value={item.year}
                onChange={(e) =>
                  certificates.update(
                    item.id,
                    "year",
                    e.target.value
                  )
                }
                placeholder="e.g. 2025"
              />
            </div>
          )}
        />

        <DynamicSection
          title="Activities & Achievements"
          Icon={Trophy}
          items={achievements.items}
          addLabel="Add Achievement"
          onAdd={() => achievements.add({ title: "", organization: "", year: "", description: "" })}
          onRemove={achievements.remove}
          renderItem={(item: AchievementItem) => (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
                <FieldInput label="Activity or Achievement" value={item.title} onChange={(e) => achievements.update(item.id, "title", e.target.value)} placeholder="e.g. Hackathon Finalist" />
                <FieldInput label="Organization" value={item.organization} onChange={(e) => achievements.update(item.id, "organization", e.target.value)} placeholder="e.g. IEEE" />
                <FieldInput label="Year" value={item.year} onChange={(e) => achievements.update(item.id, "year", e.target.value)} placeholder="2026" />
              </div>
              <FieldTextarea label="Description (Optional)" value={item.description} onChange={(e) => achievements.update(item.id, "description", e.target.value)} placeholder="Briefly describe the activity, award, or impact..." />
            </>
          )}
        />

        <DynamicSection
          title="Languages"
          Icon={LanguagesIcon}
          items={languages.items}
          addLabel="Add Language"
          onAdd={() =>
            languages.add({
              language: "",
              level: "Fluent",
            })
          }
          onRemove={languages.remove}
          renderItem={(item: LanguageItem) => (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <FieldInput
                label="Language"
                value={item.language}
                onChange={(e) =>
                  languages.update(
                    item.id,
                    "language",
                    e.target.value
                  )
                }
                placeholder="e.g. English"
              />

              <div
                style={{
                  marginBottom: 10,
                }}
              >
                <label style={smallLabelStyle}>
                  Proficiency
                </label>

                <select
                  value={item.level}
                  onChange={(e) =>
                    languages.update(
                      item.id,
                      "level",
                      e.target.value
                    )
                  }
                  style={{
                    ...smallInputStyle,
                    marginTop: 0,
                  }}
                >
                  <option value="Native">
                    Native
                  </option>

                  <option value="Fluent">
                    Fluent
                  </option>

                  <option value="Intermediate">
                    Intermediate
                  </option>

                  <option value="Basic">
                    Basic
                  </option>
                </select>
              </div>
            </div>
          )}
        />

        {resumeId && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "0 8px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setShowDeleteModal(true)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#fee2e2",
                color: "#ef4444",
                border: "1px solid #fca5a5",
                padding: "10px 16px",
                borderRadius: "10px",
                cursor: "pointer",
                fontFamily: F,
                fontSize: "13px",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "#fca5a5";
                e.currentTarget.style.color =
                  "#b91c1c";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "#fee2e2";
                e.currentTarget.style.color =
                  "#ef4444";
              }}
            >
              <Trash2 size={15} />
              Delete Resume
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface AchievementItem {
  id: string;
  title: string;
  organization: string;
  year: string;
  description: string;
}
