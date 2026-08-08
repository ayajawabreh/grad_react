import { useState, useEffect } from "react";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import {
  X,
  Upload,
  GraduationCap,
  MapPin,
  Link,
  Book,
  Briefcase,
  Calendar,
  Phone,
  Github,
  Linkedin,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";

interface Skill {
  id: number;
  name: string;
}

interface Experience {
  id?: number | string;
 position: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string;
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
  experiences?: Experience[];
  completion?: number;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentData;
  save: (data: any) => Promise<void> | void;
  saving?: boolean;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  student,
  save,
  saving = false,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
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
    skills: [] as Skill[],
    experiences: [] as Experience[],
  });

  const [avatarPreview, setAvatarPreview] = useState("");
  const [localSaving, setLocalSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState(false);

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
        gpa: student.gpa !== null && student.gpa !== undefined ? String(student.gpa) : "",
        location: student.location || "",
        portfolio: student.portfolio || "",
        phone: student.phone || "",
        linkedin: student.linkedin || "",
        github: student.github || "",
        avatar: student.avatar || "",
        skills: student.skills ?? [],
        experiences: student.experiences ?? [],
      });

      setAvatarPreview(student.avatar || "");
      setLocalError(null);
      setLocalSuccess(false);
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");

        const maxWidth = 400;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
          );

          const compressedImage = canvas.toDataURL(
            "image/jpeg",
            0.7
          );

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

  const addSkill = () => {
    setFormData((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        {
          id: Date.now(),
          name: "",
        },
      ],
    }));
  };

  const updateSkill = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.map((skill, i) =>
        i === index
          ? {
              ...skill,
              name: value,
            }
          : skill
      ),
    }));
  };

  const removeSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: Date.now(),
            position: "",
          company: "",
          start_date: "",
          end_date: "",
          description: "",
        },
      ],
    }));
  };

  const updateExperience = (
    index: number,
    field: keyof Experience,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((experience, i) =>
        i === index
          ? {
              ...experience,
              [field]: value,
            }
          : experience
      ),
    }));
  };

  const removeExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLocalSaving(true);
    setLocalError(null);
    setLocalSuccess(false);

    try {
      const formattedSkills = formData.skills
        .map((skill) => skill.name.trim())
        .filter(Boolean);

      const formattedExperiences = formData.experiences
        .filter(
          (experience) =>
           experience.position.trim() ||
            experience.company.trim() ||
            experience.description.trim()
        )
        .map((experience) => ({
          id: experience.id,
          position: experience.position.trim(),
          company: experience.company.trim(),
          start_date: experience.start_date.trim(),
          end_date: experience.end_date.trim(),
          description: experience.description.trim(),
        }));

      await save({
        ...formData,
        gpa: formData.gpa === "" ? null : Number(formData.gpa),
        skills: formattedSkills,
        experiences: formattedExperiences,
      });

      setLocalSuccess(true);

      setTimeout(() => {
        onClose();
      }, 600);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.email?.[0] ||
        error?.message ||
        "Failed to save changes. Please try again.";

      setLocalError(message);
    } finally {
      setLocalSaving(false);
    }
  };

  const isButtonDisabled = saving || localSaving;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: 14,
    fontFamily: F,
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: C.text,
    display: "block",
    marginBottom: 6,
  };

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
          animation: "fadeIn 0.2s ease",
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
            animation: "slideUp 0.3s ease",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: "20px 28px",
              borderBottom: `1px solid ${C.divider}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                  color: C.text,
                }}
              >
                Edit Profile
              </h2>

              <p
                style={{
                  fontSize: 13,
                  color: C.textSec,
                  margin: "4px 0 0",
                }}
              >
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
                cursor: isButtonDisabled
                  ? "not-allowed"
                  : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.textSec,
                transition: "all 0.2s",
                opacity: isButtonDisabled ? 0.5 : 1,
              }}
            >
              <X size={18} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              padding: "24px 28px",
              overflowY: "auto",
              maxHeight: "calc(90vh - 180px)",
            }}
          >
            {localError && (
              <div
                style={{
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
                }}
              >
                <AlertCircle
                  size={16}
                  style={{
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                />

                <span>{localError}</span>
              </div>
            )}

            {localSuccess && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "rgba(22, 163, 74, 0.1)",
                  border: "1px solid rgba(22, 163, 74, 0.35)",
                  color: "#16a34a",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 20,
                }}
              >
                Profile updated successfully!
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                marginBottom: 28,
              }}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={
                    avatarPreview ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      formData.name || "User"
                    )}&background=6366f1&color=fff&size=80`
                  }
                  alt="Avatar"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: `3px solid ${C.accent}`,
                  }}
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
                    }}
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
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    margin: 0,
                    color: C.text,
                  }}
                >
                  {formData.name || "Your Name"}
                </p>

                <p
                  style={{
                    fontSize: 13,
                    color: C.textSec,
                    margin: "4px 0 0",
                  }}
                >
                  Click the camera icon to upload
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Full Name</label>

                <input
                  type="text"
                  name="name"
                  disabled={isButtonDisabled}
                  value={formData.name}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Email</label>

                <input
                  type="email"
                  name="email"
                  disabled={isButtonDisabled}
                  value={formData.email}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>
                  <Briefcase
                    size={14}
                    style={{
                      display: "inline",
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                  Headline / Title
                </label>

                <input
                  type="text"
                  name="headline"
                  disabled={isButtonDisabled}
                  value={formData.headline}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineering Student"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <GraduationCap
                    size={14}
                    style={{
                      display: "inline",
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                  University
                </label>

                <input
                  type="text"
                  name="univ"
                  disabled={isButtonDisabled}
                  value={formData.univ}
                  onChange={handleChange}
                  placeholder="e.g. An-Najah National University"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <Book
                    size={14}
                    style={{
                      display: "inline",
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                  Major
                </label>

                <input
                  type="text"
                  name="major"
                  disabled={isButtonDisabled}
                  value={formData.major}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineering"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <Calendar
                    size={14}
                    style={{
                      display: "inline",
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                  Graduation Year
                </label>

                <input
                  type="text"
                  name="graduation"
                  disabled={isButtonDisabled}
                  value={formData.graduation}
                  onChange={handleChange}
                  placeholder="e.g. 2027"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>GPA</label>

                <input
                  type="text"
                  name="gpa"
                  disabled={isButtonDisabled}
                  value={formData.gpa}
                  onChange={handleChange}
                  placeholder="e.g. 4.00"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <MapPin
                    size={14}
                    style={{
                      display: "inline",
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  disabled={isButtonDisabled}
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Nablus"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <Phone
                    size={14}
                    style={{
                      display: "inline",
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                  Phone
                </label>

                <input
                  type="text"
                  name="phone"
                  disabled={isButtonDisabled}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 0594061600"
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>
                  <Link
                    size={14}
                    style={{
                      display: "inline",
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                  Portfolio URL
                </label>

                <input
                  type="text"
                  name="portfolio"
                  disabled={isButtonDisabled}
                  value={formData.portfolio}
                  onChange={handleChange}
                  placeholder="e.g. myportfolio.com"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <Linkedin
                    size={14}
                    style={{
                      display: "inline",
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                  LinkedIn
                </label>

                <input
                  type="text"
                  name="linkedin"
                  disabled={isButtonDisabled}
                  value={formData.linkedin}
                  onChange={handleChange}
                  placeholder="linkedin.com/in/username"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <Github
                    size={14}
                    style={{
                      display: "inline",
                      marginRight: 6,
                      verticalAlign: "middle",
                    }}
                  />
                  GitHub
                </label>

                <input
                  type="text"
                  name="github"
                  disabled={isButtonDisabled}
                  value={formData.github}
                  onChange={handleChange}
                  placeholder="github.com/username"
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Bio / About</label>

                <textarea
                  name="bio"
                  disabled={isButtonDisabled}
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 32,
                paddingTop: 24,
                borderTop: `1px solid ${C.divider}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 700,
                      color: C.text,
                    }}
                  >
                    Skills
                  </h3>

                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: C.textSec,
                    }}
                  >
                    Add your professional and technical skills
                  </p>
                </div>

                <Btn
                  type="button"
                  v="outline"
                  size="sm"
                  onClick={addSkill}
                  disabled={isButtonDisabled}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Plus size={15} />
                  Add Skill
                </Btn>
              </div>

              {formData.skills.length === 0 ? (
                <div
                  style={{
                    padding: 20,
                    borderRadius: 14,
                    border: `1px dashed ${C.border}`,
                    textAlign: "center",
                    color: C.textSec,
                    fontSize: 13,
                  }}
                >
                  No skills added yet.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {formData.skills.map((skill, index) => (
                    <div
                      key={skill.id ?? index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <input
                        type="text"
                        value={skill.name}
                        disabled={isButtonDisabled}
                        onChange={(e) =>
                          updateSkill(index, e.target.value)
                        }
                        placeholder="e.g. React"
                        style={{
                          ...inputStyle,
                          flex: 1,
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        disabled={isButtonDisabled}
                        style={{
                          width: 40,
                          height: 40,
                          flexShrink: 0,
                          borderRadius: 10,
                          border: `1px solid ${C.border}`,
                          background: "transparent",
                          color: "#dc2626",
                          cursor: isButtonDisabled
                            ? "not-allowed"
                            : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 32,
                paddingTop: 24,
                borderTop: `1px solid ${C.divider}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 700,
                      color: C.text,
                    }}
                  >
                    Experience
                  </h3>

                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: C.textSec,
                    }}
                  >
                    Add your work and practical experience
                  </p>
                </div>

                <Btn
                  type="button"
                  v="outline"
                  size="sm"
                  onClick={addExperience}
                  disabled={isButtonDisabled}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Plus size={15} />
                  Add Experience
                </Btn>
              </div>

              {formData.experiences.length === 0 ? (
                <div
                  style={{
                    padding: 20,
                    borderRadius: 14,
                    border: `1px dashed ${C.border}`,
                    textAlign: "center",
                    color: C.textSec,
                    fontSize: 13,
                  }}
                >
                  No experience added yet.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 18,
                  }}
                >
                  {formData.experiences.map(
                    (experience, index) => (
                      <div
                        key={experience.id ?? index}
                        style={{
                          padding: 18,
                          borderRadius: 16,
                          border: `1px solid ${C.border}`,
                          background: C.surface,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 16,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Briefcase
                              size={17}
                              color={C.accent}
                            />

                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: C.text,
                              }}
                            >
                              Experience {index + 1}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeExperience(index)
                            }
                            disabled={isButtonDisabled}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              border: `1px solid ${C.border}`,
                              background: "transparent",
                              color: "#dc2626",
                              cursor: isButtonDisabled
                                ? "not-allowed"
                                : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 14,
                          }}
                        >
                          <div>
                            <label style={labelStyle}>
                              Job Title
                            </label>

                            <input
                              type="text"
                             value={experience.position}
                              disabled={isButtonDisabled}
                              onChange={(e) =>
                                updateExperience(
                                  index,
                                  "position",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. Frontend Developer"
                              style={inputStyle}
                            />
                          </div>

                          <div>
                            <label style={labelStyle}>
                              Company
                            </label>

                            <input
                              type="text"
                              value={experience.company}
                              disabled={isButtonDisabled}
                              onChange={(e) =>
                                updateExperience(
                                  index,
                                  "company",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. ABC Company"
                              style={inputStyle}
                            />
                          </div>

                          <div>
                            <label style={labelStyle}>
                              Start Date
                            </label>

                            <input
                              type="text"
                              value={experience.start_date}
                              disabled={isButtonDisabled}
                              onChange={(e) =>
                                updateExperience(
                                  index,
                                  "start_date",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. Jan 2025"
                              style={inputStyle}
                            />
                          </div>

                          <div>
                            <label style={labelStyle}>
                              End Date
                            </label>

                            <input
                              type="text"
                              value={experience.end_date}
                              disabled={isButtonDisabled}
                              onChange={(e) =>
                                updateExperience(
                                  index,
                                  "end_date",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. Jan 2026 or Present"
                              style={inputStyle}
                            />
                          </div>

                          <div
                            style={{
                              gridColumn: "span 2",
                            }}
                          >
                            <label style={labelStyle}>
                              Description
                            </label>

                            <textarea
                              value={experience.description}
                              disabled={isButtonDisabled}
                              onChange={(e) =>
                                updateExperience(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              rows={4}
                              placeholder="Describe your responsibilities, achievements, and technologies used..."
                              style={{
                                ...inputStyle,
                                resize: "vertical",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 32,
                paddingTop: 20,
                borderTop: `1px solid ${C.divider}`,
              }}
            >
              <Btn
                type="button"
                v="outline"
                size="md"
                style={{ flex: 1 }}
                onClick={onClose}
                disabled={isButtonDisabled}
              >
                Cancel
              </Btn>

              <Btn
                v="primary"
                size="md"
                style={{ flex: 1 }}
                type="submit"
                disabled={isButtonDisabled}
              >
                {isButtonDisabled
                  ? "Saving..."
                  : "Save Changes"}
              </Btn>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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