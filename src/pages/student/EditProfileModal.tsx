import { useState, useEffect } from "react";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import { X, Upload, GraduationCap, MapPin, Link, Book, Briefcase, Calendar, Phone, Github, Linkedin, AlertCircle } from "lucide-react";

interface Skill {
  id: number;
  name: string;
}

interface StudentData {
  id?: number;
  name: string;
  email: string;
  headline?: string | null;
  bio?: string | null;
  univ?: string | null;
  major?: string | null;
  graduation?: string | null;
  gpa?: string | number | null;
  location?: string | null;
  portfolio?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  github?: string | null;
  avatar?: string | null;
  skills?: Skill[]; 
  completion?: number;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentData;
  save: (data: any) => Promise<void> | void;
  saving?: boolean;
}

const calculateCompletion = (data: StudentData): number => {
  const fieldsToTrack: (keyof StudentData)[] = [
    "name", "email", "headline", "bio", "univ",
    "major", "graduation", "gpa", "location",
    "portfolio", "phone", "linkedin", "github", "avatar",
  ];

  const filledFields = fieldsToTrack.filter((field) => {
    const value = data[field];
    return value !== undefined && value !== null && String(value).trim() !== "";
  });

  return Math.round((filledFields.length / fieldsToTrack.length) * 100);
};

export default function EditProfileModal({
  isOpen,
  onClose,
  student,
  save,
  saving = false,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<StudentData>({
    name: "",
    email: "",
    headline: "",
    bio: "",
    univ: "",
    major: "",
    graduation: "",
    gpa: "",
    location: "",
    portfolio: "",
    phone: "",
    linkedin: "",
    github: "",
    avatar: "",
    skills: [],
  });

  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [localSaving, setLocalSaving] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && student) {
      setFormData({
        name: student.name || "",
        email: student.email || "",
        headline: student.headline || "",
        bio: student.bio || "",
        univ: student.univ || "",
        major: student.major || "",
        graduation: student.graduation || "",
        gpa: student.gpa || "",
        location: student.location || "",
        portfolio: student.portfolio || "",
        phone: student.phone || "",
        linkedin: student.linkedin || "",
        github: student.github || "",
        avatar: student.avatar || "",
        skills: student.skills ?? [], 
      });
      setAvatarPreview(student.avatar || "");
      setLocalError(null);
      setLocalSuccess(false);
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");

        const maxWidth = 400;
        const scale = maxWidth / img.width;

        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedImage = canvas.toDataURL("image/jpeg", 0.7);

          setAvatarPreview(compressedImage);

          setFormData((prev) => ({
            ...prev,
            avatar: compressedImage,
          }));
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalSaving(true);
    setLocalError(null);
    setLocalSuccess(false);

    try {
      const formattedSkills = formData.skills?.map((skill: any) => 
        typeof skill === "object" ? skill.name : skill
      ) || [];

      await save({ 
        ...formData, 
        skills: formattedSkills
      });

      setLocalSuccess(true);
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (error: any) {
      const message = error?.message || "Failed to save changes. Please try again.";
      setLocalError(message);
    } finally {
      setLocalSaving(false);
    }
  };

  const isButtonDisabled = saving || localSaving;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          animation: "fadeIn 0.2s ease"
        }}
        onClick={isButtonDisabled ? undefined : onClose}
      >
        <div
          style={{
            background: C.surface,
            borderRadius: 24,
            width: "100%",
            maxWidth: 720,
            maxHeight: "90vh",
            overflow: "hidden",
            border: `1px solid ${C.border}`,
            boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
            animation: "slideUp 0.3s ease"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            padding: "20px 28px",
            borderBottom: `1px solid ${C.divider}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: C.text }}>
                Edit Profile
              </h2>
              <p style={{ fontSize: 13, color: C.textSec, margin: "4px 0 0" }}>
                Update your personal and academic information
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isButtonDisabled}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `1px solid ${C.border}`,
                background: "transparent",
                cursor: isButtonDisabled ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.textSec,
                transition: "all 0.2s",
                opacity: isButtonDisabled ? 0.5 : 1
              }}
              onMouseEnter={(e) => !isButtonDisabled && (e.currentTarget.style.background = C.divider)}
              onMouseLeave={(e) => !isButtonDisabled && (e.currentTarget.style.background = "transparent")}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "24px 28px", overflowY: "auto", maxHeight: "calc(90vh - 180px)" }}>
            {localError && (
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 12,
                background: "rgba(220, 38, 38, 0.1)",
                border: "1px solid rgba(220, 38, 38, 0.35)",
                color: "#dc2626",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 20,
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{localError}</span>
              </div>
            )}

            {localSuccess && (
              <div style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: "rgba(22, 163, 74, 0.1)",
                border: "1px solid rgba(22, 163, 74, 0.35)",
                color: "#16a34a",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 20,
              }}>
                Profile updated successfully!
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
              <div style={{ position: "relative" }}>
                <img
                  src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || "User")}&background=6366f1&color=fff&size=80`}
                  alt="Avatar"
                  style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.accent}` }}
                />
                {!isButtonDisabled && (
                  <label
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: C.accent,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      border: `2px solid ${C.surface}`,
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = C.accentHover}
                    onMouseLeave={(e) => e.currentTarget.style.background = C.accent}
                  >
                    <Upload size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: C.text }}>{formData.name || "Your Name"}</p>
                <p style={{ fontSize: 13, color: C.textSec, margin: "4px 0 0" }}>Click the camera icon to upload</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  disabled={isButtonDisabled}
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: F,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = C.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  disabled={isButtonDisabled}
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: F,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = C.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  <Briefcase size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                  Headline / Title
                </label>
                <input
                  type="text"
                  name="headline"
                  disabled={isButtonDisabled}
                  value={formData.headline || ""}
                  onChange={handleChange}
                  placeholder="e.g. Product Designer"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: F,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = C.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  <GraduationCap size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                  University
                </label>
                <input
                  type="text"
                  name="univ"
                  disabled={isButtonDisabled}
                  value={formData.univ || ""}
                  onChange={handleChange}
                  placeholder="e.g. An-Najah National University"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: F,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = C.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  <Book size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                  Major
                </label>
                <input
                  type="text"
                  name="major"
                  disabled={isButtonDisabled}
                  value={formData.major || ""}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: F,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = C.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  <Calendar size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                  Graduation Year
                </label>
                <input
                  type="text"
                  name="graduation"
                  disabled={isButtonDisabled}
                  value={formData.graduation || ""}
                  onChange={handleChange}
                  placeholder="e.g. 2026"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: F,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = C.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  GPA
                </label>
                <input
                  type="text"
                  name="gpa"
                  disabled={isButtonDisabled}
                  value={formData.gpa || ""}
                  onChange={handleChange}
                  placeholder="e.g. 3.85"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: F,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = C.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  <MapPin size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  disabled={isButtonDisabled}
                  value={formData.location || ""}
                  onChange={handleChange}
                  placeholder="e.g. Nablus, Palestine"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: F,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = C.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  <Phone size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  disabled={isButtonDisabled}
                  value={formData.phone || ""}
                  onChange={handleChange}
                  placeholder="e.g. +970 59 000 0000"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: F,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = C.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  <Link size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                  Portfolio URL
                </label>
                <input
                  type="text"
                  name="portfolio"
                  disabled={isButtonDisabled}
                  value={formData.portfolio || ""}
                  onChange={handleChange}
                  placeholder="e.g. ahmad.design"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: F,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = C.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  <Linkedin size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                  LinkedIn
                </label>
                <input
                  type="text"
                  name="linkedin"
                  disabled={isButtonDisabled}
                  value={formData.linkedin || ""}
                  onChange={handleChange}
                  placeholder="linkedin.com/in/username"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: F,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = C.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  <Github size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                  GitHub
                </label>
                <input
                  type="text"
                  name="github"
                  disabled={isButtonDisabled}
                  value={formData.github || ""}
                  onChange={handleChange}
                  placeholder="github.com/username"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: F,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = C.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  Bio / About
                </label>
                <textarea
                  name="bio"
                  disabled={isButtonDisabled}
                  value={formData.bio || ""}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: F,
                    outline: "none",
                    resize: "vertical",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = C.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = C.border}
                />
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: 12,
              marginTop: 28,
              paddingTop: 20,
              borderTop: `1px solid ${C.divider}`
            }}>
              <Btn type="button" v="outline" size="md" style={{ flex: 1 }} onClick={onClose} disabled={isButtonDisabled}>
                Cancel
              </Btn>
              <Btn v="primary" size="md" style={{ flex: 1 }} type="submit" disabled={isButtonDisabled}>
                {isButtonDisabled ? "Saving..." : "Save Changes"}
              </Btn>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}