
import { useState, useEffect } from "react";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import {
  MapPin,
  ExternalLink,
  GraduationCap,
  Briefcase,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Edit3,
  Globe,
  Linkedin,
  Github,
  Sparkles,
} from "lucide-react";
import { API } from "../../imports/api";
import EditProfileModal from "./EditProfileModal";
import { useSyncResourceVersion } from "../../sync/useSyncResourceVersion";

const TABS = ["Overview", "Experience", "Education", "Skills"] as const;

type Toast = {
  type: "success" | "error";
  message: string;
};

type ExperienceItem = {
  id?: number | string;
  position?: string;
  company?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
};

type Student = {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  headline?: string;
  location?: string;
  bio?: string;
  univ?: string;
  major?: string;
  gpa?: string | number;
  graduation?: string | number;
  skills?: string | string[] | { id?: number; name: string }[];
  experiences?: ExperienceItem[];
  completion?: number;
  portfolio?: string;
  linkedin?: string;
  github?: string;
};

const normalizeSkills = (skills: Student["skills"]): string[] => {
  if (!skills) return [];

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  if (Array.isArray(skills)) {
    return skills
      .map((skill) => {
        if (typeof skill === "string") return skill.trim();
        return skill?.name?.trim() || "";
      })
      .filter(Boolean);
  }

  return [];
};

const normalizeExperiences = (
  experiences: Student["experiences"]
): ExperienceItem[] => {
  if (!experiences) return [];

  if (Array.isArray(experiences)) {
    return experiences.filter(
      (experience) =>
        experience && typeof experience === "object"
    );
  }

  return [];
};

const normalizeStudent = (data: any): Student => {
  const source = data?.data ?? data?.student ?? data;

  return {
    id: source?.id,
    name: source?.name ?? "",
    email: source?.email ?? "",
    phone: source?.phone ?? "",
    avatar: source?.avatar ?? "",
    headline: source?.headline ?? "",
    location: source?.location ?? "",
    bio: source?.bio ?? "",
    univ: source?.univ ?? source?.university ?? "",
    major: source?.major ?? "",
    gpa: source?.gpa ?? "",
    graduation:
      source?.graduation ?? source?.graduation_year ?? "",
    skills: source?.skills ?? [],
    experiences: normalizeExperiences(
      source?.experiences ?? source?.experience
    ),
    completion: Number(source?.completion ?? 0),
    portfolio: source?.portfolio ?? "",
    linkedin: source?.linkedin ?? "",
    github: source?.github ?? "",
  };
};

export default function Profile() {
  const profileSyncVersion = useSyncResourceVersion("student");
  const resumeSyncVersion = useSyncResourceVersion("resume");
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] =
    useState<(typeof TABS)[number]>("Overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    fetchProfile(profileSyncVersion === 0 && resumeSyncVersion === 0);
  }, [profileSyncVersion, resumeSyncVersion]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  const fetchProfile = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const response = await API.get("/student/profile");

      const profileData = normalizeStudent(response.data);

      setStudent(profileData);
    } catch (error: any) {
      console.error("PROFILE GET ERROR:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to load profile data";

      setToast({
        type: "error",
        message,
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    try {
      setSaving(true);

      const payload = {
        ...formData,
        skills: normalizeSkills(formData?.skills),
        experiences: normalizeExperiences(
          formData?.experiences
        ),
      };

      const response = await API.put(
        "/student/profile",
        payload
      );

      const updatedProfile = normalizeStudent(
        response.data
      );

      setStudent(updatedProfile);

      setToast({
        type: "success",
        message: "Changes saved successfully",
      });

      setShowEditModal(false);
    } catch (error: any) {
      console.error("PROFILE UPDATE ERROR:", error);

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.errors;

      let message =
        "Failed to save changes, please try again";

      if (typeof backendMessage === "string") {
        message = backendMessage;
      } else if (
        backendMessage &&
        typeof backendMessage === "object"
      ) {
        const firstError =
          Object.values(backendMessage)[0];

        if (Array.isArray(firstError)) {
          message = String(firstError[0]);
        } else if (firstError) {
          message = String(firstError);
        }
      }

      setToast({
        type: "error",
        message,
      });

      throw new Error(message);
    } finally {
      setSaving(false);
    }
  };

  const skillsList = normalizeSkills(student?.skills);
  const experiencesList = normalizeExperiences(
    student?.experiences
  );

  if (loading) {
    return (
      <div
        style={{
          padding: "80px 20px",
          textAlign: "center",
          fontFamily: F,
          color: C.textSec,
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        <div
          className="spinner"
          style={{ margin: "0 auto 16px" }}
        />
        Loading Profile...
      </div>
    );
  }

  if (!student) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          fontFamily: F,
          color: C.text,
          background: C.surface,
          borderRadius: 24,
          border: `1px solid ${C.border}`,
          maxWidth: 420,
          margin: "60px auto",
          boxShadow:
            "0 20px 40px -15px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            margin: "0 auto 20px",
            borderRadius: "50%",
            background: "rgba(220, 38, 38, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <XCircle size={28} color="#dc2626" />
        </div>

        <h3
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          Profile not found
        </h3>

        <p
          style={{
            marginTop: 8,
            color: C.textSec,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          We couldn't retrieve your profile information at
          this time.
        </p>

        <Btn
          v="primary"
          size="sm"
          onClick={() => fetchProfile()}
          style={{
            marginTop: 20,
            width: "100%",
            justifyContent: "center",
          }}
        >
          Try Again
        </Btn>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: F,
        color: C.text,
        position: "relative",
        maxWidth: 960,
        margin: "0 auto",
        padding: "0 16px 40px",
      }}
    >
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 20px",
            borderRadius: 14,
            background:
              toast.type === "success"
                ? "#15803d"
                : "#b91c1c",
            color: "#fff",
            fontFamily: F,
            fontSize: 14,
            fontWeight: 600,
            boxShadow:
              "0 12px 28px -6px rgba(0,0,0,0.25)",
            animation:
              "toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <XCircle size={18} />
          )}

          {toast.message}
        </div>
      )}

      <div
        style={{
          background: C.surface,
          borderRadius: 24,
          border: `1px solid ${C.border}`,
          marginBottom: 20,
          padding: 28,
          boxShadow:
            "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 20,
              alignItems: "center",
            }}
          >
            <img
              src={
                student.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  student.name || "Student"
                )}&background=6366f1&color=fff&size=176`
              }
              alt={student.name || "Student"}
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                objectFit: "cover",
                border: `1px solid ${C.border}`,
                backgroundColor: C.surface,
              }}
            />

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {student.name || "Student"}
              </h2>

              {student.headline && (
                <p
                  style={{
                    margin: "4px 0 0",
                    color: C.accent,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {student.headline}
                </p>
              )}

              {student.location && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 6,
                    color: C.textSec,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  <MapPin size={14} color={C.textSec} />
                  {student.location}
                </div>
              )}
            </div>
          </div>

          <Btn
            v="outline"
            size="sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 12,
              padding: "8px 16px",
              fontWeight: 600,
            }}
            onClick={() => setShowEditModal(true)}
          >
            <Edit3 size={15} />
            Edit Profile
          </Btn>
        </div>

        {student.bio && (
          <p
            style={{
              margin: "0 0 20px",
              color: C.text,
              fontSize: 14,
              lineHeight: 1.6,
              opacity: 0.9,
            }}
          >
            {student.bio}
          </p>
        )}

        {(student.portfolio ||
          student.linkedin ||
          student.github) && (
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              borderTop: `1px solid ${C.border}`,
              paddingTop: 16,
            }}
          >
            {student.portfolio && (
              <a
                href={
                  student.portfolio.startsWith("http")
                    ? student.portfolio
                    : `https://${student.portfolio}`
                }
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 10,
                  background: `${C.accent}0A`,
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Globe size={14} color={C.accent} />
                Portfolio
                <ExternalLink
                  size={12}
                  style={{ opacity: 0.5 }}
                />
              </a>
            )}

            {student.linkedin && (
              <a
                href={
                  student.linkedin.startsWith("http")
                    ? student.linkedin
                    : `https://${student.linkedin}`
                }
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 10,
                  background: `${C.accent}0A`,
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Linkedin size={14} color="#0a66c2" />
                LinkedIn
                <ExternalLink
                  size={12}
                  style={{ opacity: 0.5 }}
                />
              </a>
            )}

            {student.github && (
              <a
                href={
                  student.github.startsWith("http")
                    ? student.github
                    : `https://${student.github}`
                }
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 10,
                  background: `${C.accent}0A`,
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Github size={14} />
                GitHub
                <ExternalLink
                  size={12}
                  style={{ opacity: 0.5 }}
                />
              </a>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          background: C.surface,
          borderRadius: 18,
          padding: "18px 24px",
          border: `1px solid ${C.border}`,
          marginBottom: 20,
          boxShadow:
            "0 2px 10px -2px rgba(0,0,0,0.02)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Sparkles size={16} color={C.accent} />
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Profile Completion Status
            </span>
          </div>

          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.accent,
            }}
          >
            {student.completion ?? 0}%
          </span>
        </div>

        <div
          style={{
            height: 8,
            background: `${C.accent}15`,
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(
                100,
                Math.max(
                  0,
                  Number(student.completion ?? 0)
                )
              )}%`,
              background: C.accent,
              borderRadius: 99,
              transition:
                "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </div>
      </div>

      <div
        style={{
          background: C.surface,
          borderRadius: 24,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
          boxShadow:
            "0 4px 20px -2px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 16px",
            borderBottom: `1px solid ${C.border}`,
            overflowX: "auto",
            background: C.surface,
          }}
        >
          {TABS.map((t) => {
            const active = tab === t;

            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: F,
                  cursor: "pointer",
                  border: "none",
                  background: active
                    ? `${C.accent}15`
                    : "transparent",
                  color: active
                    ? C.accent
                    : C.textSec,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 28 }}>
          {tab === "Overview" && (
            <div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginTop: 0,
                  marginBottom: 16,
                  letterSpacing: "-0.01em",
                }}
              >
                Contact Details
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    padding: 18,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    background: C.surface,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: `${C.accent}12`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Mail
                      size={20}
                      color={C.accent}
                    />
                  </div>

                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: C.textSec,
                        fontWeight: 500,
                      }}
                    >
                      Email Address
                    </p>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 14,
                        fontWeight: 600,
                        wordBreak: "break-word",
                      }}
                    >
                      {student.email || "—"}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    padding: 18,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    background: C.surface,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: `${C.accent}12`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Phone
                      size={20}
                      color={C.accent}
                    />
                  </div>

                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: C.textSec,
                        fontWeight: 500,
                      }}
                    >
                      Phone Number
                    </p>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {student.phone || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "Experience" && (
            <div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginTop: 0,
                  marginBottom: 16,
                  letterSpacing: "-0.01em",
                }}
              >
                Work Experience
              </h3>

              {experiencesList.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  {experiencesList.map(
                    (experience, index) => (
                      <div
                        key={
                          experience.id ?? index
                        }
                        style={{
                          display: "flex",
                          gap: 16,
                          padding: 20,
                          borderRadius: 16,
                          border: `1px solid ${C.border}`,
                          background: C.surface,
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: `${C.accent}12`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Briefcase
                            size={20}
                            color={C.accent}
                          />
                        </div>

                        <div
                          style={{ flex: 1 }}
                        >
                          <h4
                            style={{
                              margin:
                                "0 0 4px 0",
                              fontSize: 16,
                              fontWeight: 700,
                              color: C.text,
                            }}
                          >
                            {experience.position || "Experience"}
                          </h4>

                          {experience.company && (
                            <p
                              style={{
                                margin:
                                  "0 0 6px 0",
                                fontSize: 13,
                                fontWeight: 600,
                                color: C.accent,
                              }}
                            >
                              {
                                experience.company
                              }
                            </p>
                          )}

                          {(
                            experience.start_date ||
                            experience.end_date
                          ) && (
                            <p
                              style={{
                                margin:
                                  "0 0 12px 0",
                                fontSize: 12,
                                color: C.textSec,
                                fontWeight: 500,
                              }}
                            >
                              {experience.start_date ||
                                ""}
                              {experience.start_date &&
                              experience.end_date
                                ? " – "
                                : ""}
                              {experience.end_date ||
                                "Present"}
                            </p>
                          )}

                          {experience.description && (
                            <p
                              style={{
                                margin: 0,
                                color: C.textSec,
                                fontSize: 14,
                                lineHeight: 1.6,
                                whiteSpace:
                                  "pre-line",
                              }}
                            >
                              {
                                experience.description
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p
                  style={{
                    color: C.textSec,
                    fontSize: 14,
                    margin: 0,
                  }}
                >
                  No experiences listed yet.
                </p>
              )}
            </div>
          )}

          {tab === "Education" && (
            <div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginTop: 0,
                  marginBottom: 16,
                  letterSpacing: "-0.01em",
                }}
              >
                Education History
              </h3>

              {student.univ ||
              student.major ||
              student.gpa ||
              student.graduation ? (
                <div
                  style={{
                    padding: 20,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    display: "flex",
                    gap: 16,
                    background: C.surface,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: `${C.accent}12`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <GraduationCap
                      size={24}
                      color={C.accent}
                    />
                  </div>

                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {student.univ ||
                        "University"}
                    </h4>

                    {student.major && (
                      <p
                        style={{
                          margin: "4px 0",
                          fontSize: 14,
                          color: C.textSec,
                          fontWeight: 500,
                        }}
                      >
                        B.S. in {student.major}
                      </p>
                    )}

                    {(student.gpa ||
                      student.graduation) && (
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: 13,
                          color: C.textSec,
                          fontWeight: 500,
                        }}
                      >
                        {student.gpa
                          ? `GPA: ${student.gpa}`
                          : ""}
                        {student.gpa &&
                        student.graduation
                          ? " • "
                          : ""}
                        {student.graduation
                          ? `Class of ${student.graduation}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p
                  style={{
                    color: C.textSec,
                    fontSize: 14,
                    margin: 0,
                  }}
                >
                  No education info listed yet.
                </p>
              )}
            </div>
          )}

          {tab === "Skills" && (
            <div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginTop: 0,
                  marginBottom: 16,
                  letterSpacing: "-0.01em",
                }}
              >
                Skills & Technologies
              </h3>

              {skillsList.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {skillsList.map(
                    (skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        style={{
                          padding: "8px 18px",
                          background: `${C.accent}12`,
                          color: C.accent,
                          borderRadius: 12,
                          fontSize: 13,
                          fontWeight: 600,
                          border: `1px solid ${C.accent}20`,
                        }}
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p
                  style={{
                    color: C.textSec,
                    fontSize: 14,
                    margin: 0,
                  }}
                >
                  No skills listed yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() =>
          setShowEditModal(false)
        }
        student={{
          id: student.id ?? 0,
          name: student.name ?? "",
          email: student.email ?? "",
          phone: student.phone ?? "",
          avatar: student.avatar ?? "",
          headline: student.headline ?? "",
          location: student.location ?? "",
          bio: student.bio ?? "",
          univ: student.univ ?? "",
          major: student.major ?? "",
          gpa: student.gpa ?? "",
          graduation: String(
            student.graduation ?? ""
          ),
          skills: normalizeSkills(
            student.skills
          ).map((name, index) => ({
            id: index,
            name,
          })),
          experiences: normalizeExperiences(
  student.experiences
).map((experience, index) => ({
  id: experience.id ?? index,
  position: experience.position || "",
  company: experience.company || "",
  start_date: experience.start_date || "",
  end_date: experience.end_date || "",
  description: experience.description || "",
})),
          completion:
            student.completion ?? 0,
          portfolio:
            student.portfolio ?? "",
          linkedin:
            student.linkedin ?? "",
          github:
            student.github ?? "",
        }}
        save={handleSave}
        saving={saving}
      />

      <style>{`
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

