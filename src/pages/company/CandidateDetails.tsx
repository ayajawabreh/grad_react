import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { C, F } from "../../constants/tokens";
import { Btn, MatchRing } from "../../components/ui";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Briefcase,
  Sparkles,
  Trash2,
  Plus,
  GraduationCap,
  Clock,
  UserCheck,
  FileText,
  Award,
  ExternalLink,
  Download,
  Loader2,
  Languages,
  X
} from "lucide-react";

import {
  fetchApplicantDetails,
  fetchApplicantAISummary,
  fetchApplicantNotes,
  addApplicantNote,
  deleteApplicantNote,
  type ApplicantDetails,
  type CompanyNote
} from "../../imports/applicants";
import { API } from "../../imports/api";
import { useSyncResourceVersion } from "../../sync/useSyncResourceVersion";

const TABS = ["Profile", "Resume", "Notes"] as const;
const STATUS_OPTIONS = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected"
] as const;

const formatExperienceMonth = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw || /^present$/i.test(raw)) return raw;
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(raw);
  return match
    ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)))
    : raw;
};

export default function CandidateDetails() {
  const profileSyncVersion = useSyncResourceVersion("student");
  const resumeSyncVersion = useSyncResourceVersion("resume");
  const jobsSyncVersion = useSyncResourceVersion("jobs");
  const applicationsSyncVersion = useSyncResourceVersion("applications");
  const nav = useNavigate();
  const { id } = useParams();

  const [candidate, setCandidate] = useState<ApplicantDetails | null>(null);
  const [notes, setNotes] = useState<CompanyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");
  const [newNote, setNewNote] = useState("");
  const [status, setStatus] = useState("Applied");

  const [showAISummary, setShowAISummary] = useState(false);
  const [loadingAISummary, setLoadingAISummary] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
  const [showMatchDetails, setShowMatchDetails] = useState(false);

  useEffect(() => {
    if (!id) return;

    const applicantId = Number(id);

    Promise.all([
      fetchApplicantDetails(applicantId),
      fetchApplicantNotes(applicantId).catch(() => [])
    ])
      .then(([applicant, notesData]) => {
        setCandidate(applicant);

        setNotes(
          Array.isArray(notesData)
            ? notesData
            : notesData
            ? [notesData]
            : []
        );

        if (applicant?.status) {
          setStatus(applicant.status);
        }
      })
      .catch((err) => {
        console.error("Failed to load applicant details:", err);
      })
      .finally(() => setLoading(false));
  }, [id, profileSyncVersion, resumeSyncVersion, jobsSyncVersion, applicationsSyncVersion]);

  const resume = (candidate as any)?.resume || null;

  const parseResumeField = <T,>(value: any, fallback: T): T => {
    if (Array.isArray(value)) {
      return value as T;
    }

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
      } catch {
        return fallback;
      }
    }

    return value ?? fallback;
  };

  const resumeSkills = parseResumeField<any[]>(resume?.skills, []);
  const resumeExperience = parseResumeField<any[]>(resume?.experience, []);
  const resumeEducation = parseResumeField<any[]>(resume?.education, []);
  const resumeProjects = parseResumeField<any[]>(resume?.projects, []);
  const resumeCertificates = parseResumeField<any[]>(resume?.certificates, []);
  const resumeLanguages = parseResumeField<any[]>(resume?.languages, []);

  const matchPercentage = candidate?.match?.percentage ?? null;
  const matchReasons = candidate?.match?.reasons ?? [];
  const matchWarnings = candidate?.match?.warnings ?? [];
  const incompleteDataWarning = matchWarnings.some((warning) =>
    /missing|not specified|not defined|no required|does not contain|incomplete|unavailable/i.test(warning)
  );
  const matchUnavailable = candidate?.match?.available === false || matchPercentage == null || (matchPercentage === 0 && incompleteDataWarning);
  const applicableMatchItems = Object.entries(candidate?.match?.breakdown ?? {})
    .filter(([, item]: [string, any]) => item?.applicable === true)
    .map(([key, item]: [string, any]) => ({
      key,
      label: key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      score: Number(item?.score ?? 0),
      maxWeight: Number(item?.max_weight ?? 0),
    }));
  const earnedMatchPoints = applicableMatchItems.reduce((total, item) => total + item.score, 0);
  const applicableMatchWeight = applicableMatchItems.reduce((total, item) => total + item.maxWeight, 0);
  const explainedMatchPercentage = applicableMatchWeight ? (earnedMatchPoints / applicableMatchWeight) * 100 : 0;
  const summaryUnavailable = !candidate?.ai_summary || /^ai summary unavailable$/i.test(candidate.ai_summary.trim());

  const loadAISummary = async () => {
    if (!id || loadingAISummary) return;

    setLoadingAISummary(true);
    setAiSummaryError(null);

    try {
      const summaryText = await fetchApplicantAISummary(Number(id));
      if (!summaryText?.trim() || /^ai summary unavailable$/i.test(summaryText.trim())) {
        setAiSummaryError("AI summary is temporarily unavailable. Please try again.");
        return;
      }
      setCandidate((prev) => prev ? { ...prev, ai_summary: summaryText } : prev);
    } catch (err: any) {
      console.error("Failed to fetch AI summary:", err);
      setAiSummaryError(
        err?.response?.status === 503
          ? "AI summary is temporarily unavailable. Please try again."
          : "Failed to generate AI summary. Please try again."
      );
    } finally {
      setLoadingAISummary(false);
    }
  };

  const handleToggleAISummary = async () => {
    if (showAISummary) {
      setShowAISummary(false);
      return;
    }

    setShowAISummary(true);

    if (summaryUnavailable || aiSummaryError) await loadAISummary();
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;

    try {
      const added = await addApplicantNote(Number(id), newNote.trim());
      setNotes((prev) => [added, ...prev]);
      setNewNote("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await deleteApplicantNote(noteId);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!candidate?.application_id) return;

    try {
      await API.put(
        `/company/applicants/${candidate.application_id}/status`,
        {
          status: newStatus
        }
      );

      setStatus(newStatus);

      setCandidate((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus
            }
          : prev
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          fontFamily: F,
          color: C.text,
          padding: "40px 20px",
          textAlign: "center",
          opacity: 0.7
        }}
      >
        <Clock
          size={24}
          style={{
            animation: "spin 1s linear infinite",
            marginBottom: 8
          }}
        />
        <p style={{ margin: 0, fontSize: 14 }}>
          Loading candidate profile...
        </p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div
        style={{
          fontFamily: F,
          color: C.text,
          padding: 24,
          maxWidth: 600
        }}
      >
        <Btn
          v="ghost"
          icon={ArrowLeft}
          onClick={() => nav("/company/applicants")}
          style={{ marginBottom: 20 }}
        >
          Back to Applicants
        </Btn>

        <div
          style={{
            background: C.surface,
            borderRadius: 16,
            padding: 32,
            border: `1px solid ${C.border}`,
            textAlign: "center"
          }}
        >
          <UserCheck
            size={40}
            style={{
              opacity: 0.3,
              marginBottom: 12
            }}
          />

          <h3 style={{ margin: "0 0 8px" }}>
            Candidate Not Found
          </h3>

          <p
            style={{
              color: C.textSec,
              fontSize: 14,
              margin: 0
            }}
          >
            The applicant profile you are looking for does not exist or has
            been removed.
          </p>
        </div>
      </div>
    );
  }

  const resumeFilePath =
    resume?.file_path ||
    resume?.resume_url ||
    (candidate as any)?.resume_url ||
    (candidate.student as any)?.resume_url ||
    (candidate.student as any)?.resume;

  const resumeUrl = resumeFilePath
    ? resumeFilePath.startsWith("http")
      ? resumeFilePath
      : `http://127.0.0.1:8000/storage/${resumeFilePath}`
    : null;

  const studentSkills = Array.isArray((candidate as any)?.skills)
    ? (candidate as any).skills
    : [];

  const matchingSkills = Array.isArray(candidate.match?.matching_skills) ? candidate.match.matching_skills : [];
  const missingSkills = Array.isArray(candidate.match?.missing_skills) ? candidate.match.missing_skills : [];
  const displaySkills = studentSkills;
  const jobTitle = candidate.job_title || (typeof candidate.job === "object" ? candidate.job?.title : candidate.job) || "Job title unavailable";
  const totalExperience = candidate.total_years_of_experience ?? candidate.total_years_experience ?? resume?.total_years_of_experience ?? resume?.total_years_experience ?? null;

  const experiencesList =
    resumeExperience.length > 0
      ? resumeExperience
      : Array.isArray((candidate as any)?.experience)
      ? (candidate as any).experience
      : Array.isArray((candidate as any)?.experiences)
      ? (candidate as any).experiences
      : [];

  return (
    <div
      style={{
        fontFamily: F,
        color: C.text,
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 16px"
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => nav("/company/applicants")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            color: C.textSec,
            padding: 0
          }}
        >
          <ArrowLeft size={15} />
          Back to Applicants
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 24,
          alignItems: "start"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}
        >
          <div
            style={{
              background: C.surface,
              borderRadius: 24,
              padding: "28px 20px 24px",
              border: `1px solid ${C.border}`,
              textAlign: "center"
            }}
          >
            <div
              style={{
                position: "relative",
                display: "inline-block",
                marginBottom: 12
              }}
            >
              <img
                src={
                  candidate.student.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${candidate.student.name}`
                }
                alt={candidate.student.name}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  objectFit: "cover"
                }}
              />
            </div>

            <h2
              style={{
                fontSize: 17,
                fontWeight: 700,
                margin: "0 0 4px",
                letterSpacing: "-0.01em"
              }}
            >
              {candidate.student.name}
            </h2>

            <p
              style={{
                fontSize: 13,
                color: C.textSec,
                margin: "0 0 16px"
              }}
            >
              {jobTitle}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 20
              }}
            >
              {!matchUnavailable && matchPercentage != null ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                  <button
                    type="button"
                    onClick={() => setShowMatchDetails(true)}
                    aria-label="View match score details"
                    title="View match score details"
                    style={{ border: 0, padding: 0, borderRadius: "50%", background: "transparent", cursor: "pointer" }}
                  >
                    <MatchRing v={matchPercentage} />
                  </button>
                  {candidate.match.recommendation_level && <strong style={{ fontSize: 12, color: C.textSec }}>{candidate.match.recommendation_level}</strong>}
                  {candidate.match.source && <span style={{ fontSize: 10.5, color: C.textMuted }}>Source: {candidate.match.source}</span>}
                </div>
              ) : (
                <div style={{ padding: "12px 14px", borderRadius: 12, background: C.warningBg, color: C.warning, fontSize: 12, fontWeight: 700 }}>
                  Match unavailable — incomplete job or resume data
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                justifyContent: "center"
              }}
            >
              {STATUS_OPTIONS.map((st) => {
                const isActive = status === st;

                return (
                  <Btn
                    key={st}
                    v={isActive ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => updateStatus(st)}
                    style={{
                      fontSize: 11,
                      padding: "4px 10px",
                      borderRadius: 8,
                      opacity: isActive ? 1 : 0.7
                    }}
                  >
                    {st}
                  </Btn>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                fontSize: 12,
                textAlign: "left",
                marginTop: 16
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: C.textSec
                }}
              >
                <Mail size={14} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    color: C.textSec,
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {candidate.student.email}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: C.textSec
                }}
              >
                <MapPin size={14} style={{ flexShrink: 0 }} />
                <span>
                  {candidate.student.location || "Not specified"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.textSec }}>
                <GraduationCap size={14} style={{ flexShrink: 0 }} />
                <span>{candidate.student.university || "University not specified"}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.textSec }}>
                <Award size={14} style={{ flexShrink: 0 }} />
                <span>{candidate.student.major || "Major not specified"}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: C.textSec
                }}
              >
                <Briefcase size={14} style={{ flexShrink: 0 }} />
                <span>
                  {totalExperience != null
                    ? `${totalExperience} years of experience`
                    : "Total years of experience not specified"}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: C.surface,
              borderRadius: 24,
              padding: 20,
              border: `1px solid ${C.border}`
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                margin: "0 0 18px",
                color: C.text
              }}
            >
              Application Timeline
            </h3>

            {candidate.timeline && candidate.timeline.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16
                }}
              >
                {candidate.timeline.map((item, idx, arr) => (
                  <div
                    key={item.id ?? idx}
                    style={{
                      display: "flex",
                      gap: 12,
                      position: "relative"
                    }}
                  >
                    {idx !== arr.length - 1 && (
                      <div
                        style={{
                          position: "absolute",
                          left: 6,
                          top: 14,
                          bottom: -16,
                          width: 1.5,
                          background: "#2D6A4F"
                        }}
                      />
                    )}

                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: "#2D6A4F",
                        marginTop: 2,
                        flexShrink: 0,
                        zIndex: 1
                      }}
                    />

                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.text,
                          lineHeight: 1.2
                        }}
                      >
                        {item.status}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: C.textSec,
                          marginTop: 2
                        }}
                      >
                        {new Date(item.changed_at).toLocaleDateString(
                          "en-US",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          }
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  fontSize: 12,
                  color: C.textSec
                }}
              >
                No timeline data available yet.
              </div>
            )}
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 20
            }}
          >
            {TABS.map((t) => {
              const active = tab === t;

              return (
                <Btn
                  key={t}
                  v={active ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setTab(t)}
                >
                  {t}
                </Btn>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20
            }}
          >
            {tab === "Profile" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 20
                }}
              >
                <div
                  onClick={handleToggleAISummary}
                  style={{
                    background: "#F0EBF8",
                    padding: "16px 20px",
                    borderRadius: 16,
                    border: "1px solid rgba(147, 51, 234, 0.08)",
                    cursor: "pointer",
                    userSelect: "none"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#6B46C1"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <Sparkles size={14} />
                      AI Summary
                    </div>

                    <span style={{ fontSize: 11 }}>
                      {showAISummary
                        ? "Hide"
                        : !summaryUnavailable
                        ? "View"
                        : "Generate Summary"}
                    </span>
                  </div>

                  {showAISummary && (
                    <div style={{ marginTop: 10 }}>
                      {loadingAISummary ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            color: "#6B46C1",
                            fontSize: 12.5
                          }}
                        >
                          <Loader2
                            size={14}
                            style={{
                              animation: "spin 1s linear infinite"
                            }}
                          />
                          Generating AI summary...
                        </div>
                      ) : aiSummaryError ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <p style={{ margin: 0, fontSize: 12.5, color: "#E53E3E" }}>{aiSummaryError}</p>
                          <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); void loadAISummary(); }}
                            disabled={loadingAISummary}
                            style={{ border: "1px solid #D6BCFA", background: "#fff", color: "#6B46C1", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12.5,
                            lineHeight: 1.6,
                            color: "#4A5568"
                          }}
                        >
                          {candidate.ai_summary}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      margin: "0 0 10px",
                      color: C.text
                    }}
                  >
                    Student Skills
                  </h3>

                  {displaySkills.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8
                      }}
                    >
                      {displaySkills.map((skill: any, index: number) => {
                        const skillName =
                          typeof skill === "string"
                            ? skill
                            : skill?.name;

                        return (
                          <span
                            key={`${skillName}-${index}`}
                            style={{
                              background: "#F2EBE1",
                              color: "#524538",
                              padding: "5px 14px",
                              borderRadius: 16,
                              fontSize: 12,
                              fontWeight: 500
                            }}
                          >
                            {skillName}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: C.textSec
                      }}
                    >
                      No skills provided.
                    </div>
                  )}

                  <>
                      <h3 style={{ fontSize: 13, fontWeight: 600, margin: "20px 0 10px", color: C.text }}>
                        Matching Skills
                      </h3>
                      {matchingSkills.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {matchingSkills.map((skill) => <span key={skill} style={{ background: C.successBg, color: C.success, padding: "5px 14px", borderRadius: 16, fontSize: 12, fontWeight: 500 }}>{skill}</span>)}
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: 12.5, color: C.textSec }}>No matching skills identified</p>
                      )}

                      <h3
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          margin: "20px 0 10px",
                          color: C.text
                        }}
                      >
                        Missing Skills
                      </h3>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8
                        }}
                      >
                        {missingSkills.length > 0 ? missingSkills.map(
                          (skill) => (
                            <span
                              key={skill}
                              style={{
                                background: "#FEE2E2",
                                color: "#991B1B",
                                padding: "5px 14px",
                                borderRadius: 16,
                                fontSize: 12,
                                fontWeight: 500
                              }}
                            >
                              {skill}
                            </span>
                          )
                        ) : <p style={{ margin: 0, fontSize: 12.5, color: C.textSec }}>No missing skills identified</p>}
                      </div>
                    </>
                </div>

                <div>
                  <h3
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      margin: "0 0 10px",
                      color: C.text
                    }}
                  >
                    Why This Match
                  </h3>

                  {matchReasons.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8
                      }}
                    >
                      {matchReasons.map((reason, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: 12.5,
                            color: C.textSec,
                            lineHeight: 1.4
                          }}
                        >
                          {reason}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: C.textSec
                      }}
                    >
                      No match explanation is available.
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px", color: C.text }}>Warnings</h3>
                  {matchWarnings.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {matchWarnings.map((warning, index) => <div key={index} style={{ padding: "8px 10px", borderRadius: 9, background: C.warningBg, color: C.warning, fontSize: 12 }}>{warning}</div>)}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12.5, color: C.textSec }}>No match warnings.</p>
                  )}
                </div>

              </div>
            )}

            {tab === "Resume" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 20
                }}
              >
                {resumeUrl ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 16,
                      background: C.surface,
                      borderRadius: 16,
                      border: `1px solid ${C.border}`
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: "#F2EBE1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#524538"
                        }}
                      >
                        <FileText size={20} />
                      </div>

                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: C.text
                          }}
                        >
                          {resume?.title || "Resume Document"}
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: C.textSec
                          }}
                        >
                          Official CV PDF
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8
                      }}
                    >
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: "none" }}
                      >
                        <Btn
                          v="primary"
                          size="sm"
                          icon={ExternalLink}
                        >
                          View Resume
                        </Btn>
                      </a>

                      <a
                        href={resumeUrl}
                        download
                        style={{ textDecoration: "none" }}
                      >
                        <Btn
                          v="ghost"
                          size="sm"
                          icon={Download}
                        >
                          Download
                        </Btn>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 16,
                      background: C.surface,
                      borderRadius: 16,
                      border: `1px solid ${C.border}`,
                      fontSize: 12.5,
                      color: C.textSec
                    }}
                  >
                    No uploaded resume document available.
                  </div>
                )}

                <div
                  style={{
                    padding: 20,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    background: C.surface
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: C.text,
                      marginBottom: 14,
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    <GraduationCap size={17} />
                    Education
                  </div>

                  {resumeEducation.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14
                      }}
                    >
                      {resumeEducation.map(
                        (education: any, index: number) => (
                          <div key={index}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 14,
                                color: C.text
                              }}
                            >
                              {education.degree || "Education"}
                            </div>

                            {education.university && (
                              <div
                                style={{
                                  fontSize: 12.5,
                                  color: C.textSec,
                                  marginTop: 3
                                }}
                              >
                                {education.university}
                              </div>
                            )}

                            {education.field_of_study && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: C.textSec,
                                  marginTop: 2
                                }}
                              >
                                {education.field_of_study}
                              </div>
                            )}

                            {(education.start_date ||
                              education.end_date) && (
                              <div
                                style={{
                                  fontSize: 11.5,
                                  color: C.textSec,
                                  marginTop: 4
                                }}
                              >
                                {education.start_date || ""}
                                {education.start_date &&
                                education.end_date
                                  ? " - "
                                  : ""}
                                {education.end_date || ""}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: C.textSec
                      }}
                    >
                      No education information provided.
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: 20,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    background: C.surface
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: C.text,
                      marginBottom: 14,
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    <Briefcase size={16} />
                    Work Experience
                  </div>

                  {experiencesList.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14
                      }}
                    >
                      {experiencesList.map(
                        (exp: any, index: number) => (
                          <div
                            key={index}
                            style={{
                              borderBottom:
                                index !== experiencesList.length - 1
                                  ? `1px solid ${C.border}`
                                  : "none",
                              paddingBottom: 12
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: C.text
                              }}
                            >
                              {exp.position ||
                                exp.title ||
                                exp.role ||
                                "Position"}
                            </div>

                            {exp.company && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: C.textSec,
                                  marginTop: 2
                                }}
                              >
                                {exp.company}
                              </div>
                            )}

                            {(exp.start_date ||
                              exp.end_date) && (
                              <div
                                style={{
                                  fontSize: 11.5,
                                  color: C.textSec,
                                  marginTop: 3
                                }}
                              >
                                {formatExperienceMonth(exp.start_date)}
                                {exp.start_date &&
                                exp.end_date
                                  ? " - "
                                  : ""}
                                {formatExperienceMonth(exp.end_date)}
                              </div>
                            )}

                            {exp.description && (
                              <p
                                style={{
                                  fontSize: 12,
                                  color: C.textSec,
                                  margin: "5px 0 0",
                                  lineHeight: 1.5
                                }}
                              >
                                {exp.description}
                              </p>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: C.textSec
                      }}
                    >
                      No work experience provided.
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: 20,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    background: C.surface
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: C.text,
                      marginBottom: 14,
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    <FileText size={16} />
                    Skills
                  </div>

                  {resumeSkills.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8
                      }}
                    >
                      {resumeSkills.map(
                        (skill: any, index: number) => {
                          const skillName =
                            typeof skill === "string"
                              ? skill
                              : skill?.name;

                          return (
                            <span
                              key={`${skillName}-${index}`}
                              style={{
                                background: "#F2EBE1",
                                color: "#524538",
                                padding: "6px 14px",
                                borderRadius: 16,
                                fontSize: 12,
                                fontWeight: 500
                              }}
                            >
                              {skillName}
                            </span>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: C.textSec
                      }}
                    >
                      No skills listed in this resume.
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: 20,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    background: C.surface
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: C.text,
                      marginBottom: 14,
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    <FileText size={16} />
                    Projects
                  </div>

                  {resumeProjects.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14
                      }}
                    >
                      {resumeProjects.map(
                        (project: any, index: number) => (
                          <div
                            key={index}
                            style={{
                              borderBottom:
                                index !== resumeProjects.length - 1
                                  ? `1px solid ${C.border}`
                                  : "none",
                              paddingBottom: 12
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: C.text
                              }}
                            >
                              {project.name ||
                                project.title ||
                                "Project"}
                            </div>

                            {project.description && (
                              <p
                                style={{
                                  fontSize: 12,
                                  color: C.textSec,
                                  margin: "5px 0 0",
                                  lineHeight: 1.5
                                }}
                              >
                                {project.description}
                              </p>
                            )}

                            {project.link && (
                              <a
                                href={project.link}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  marginTop: 6,
                                  fontSize: 11.5,
                                  color: "#6B46C1",
                                  textDecoration: "none"
                                }}
                              >
                                <ExternalLink size={12} />
                                Project Link
                              </a>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: C.textSec
                      }}
                    >
                      No projects provided.
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: 20,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    background: C.surface
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: C.text,
                      marginBottom: 14,
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    <Award size={16} />
                    Certificates
                  </div>

                  {resumeCertificates.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14
                      }}
                    >
                      {resumeCertificates.map(
                        (certificate: any, index: number) => (
                          <div
                            key={index}
                            style={{
                              borderBottom:
                                index !==
                                resumeCertificates.length - 1
                                  ? `1px solid ${C.border}`
                                  : "none",
                              paddingBottom: 12
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: C.text
                              }}
                            >
                              {certificate.name ||
                                certificate.title ||
                                "Certificate"}
                            </div>

                            {certificate.issuer && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: C.textSec,
                                  marginTop: 3
                                }}
                              >
                                {certificate.issuer}
                              </div>
                            )}

                            {(certificate.year ||
                              certificate.date) && (
                              <div
                                style={{
                                  fontSize: 11.5,
                                  color: C.textSec,
                                  marginTop: 3
                                }}
                              >
                                {certificate.year ||
                                  certificate.date}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: C.textSec
                      }}
                    >
                      No certificates listed.
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: 20,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    background: C.surface
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: C.text,
                      marginBottom: 14,
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    <Languages size={16} />
                    Languages
                  </div>

                  {resumeLanguages.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8
                      }}
                    >
                      {resumeLanguages.map(
                        (language: any, index: number) => (
                          <div
                            key={index}
                            style={{
                              background: "#F7F3EE",
                              border: `1px solid ${C.border}`,
                              borderRadius: 12,
                              padding: "8px 12px"
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: C.text
                              }}
                            >
                              {language.language ||
                                language.name ||
                                "Language"}
                            </div>

                            {language.level && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: C.textSec,
                                  marginTop: 2
                                }}
                              >
                                {language.level}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: C.textSec
                      }}
                    >
                      No languages listed.
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "Notes" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    background: C.surface,
                    padding: 6,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`
                  }}
                >
                  <input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an internal note about this applicant..."
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddNote()
                    }
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      padding: "8px 12px",
                      outline: "none",
                      fontFamily: F,
                      fontSize: 13,
                      color: C.text
                    }}
                  />

                  <Btn
                    v="primary"
                    icon={Plus}
                    onClick={handleAddNote}
                    style={{
                      height: 34,
                      padding: "0 14px"
                    }}
                  >
                    Add
                  </Btn>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8
                  }}
                >
                  {notes.length > 0 ? (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: 12,
                          borderRadius: 10,
                          border: `1px solid ${C.border}`,
                          background: C.surface
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: C.text
                          }}
                        >
                          {note.note}
                        </p>

                        <button
                          onClick={() =>
                            handleDeleteNote(note.id)
                          }
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: C.textSec
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "24px 0",
                        color: C.textSec,
                        fontSize: 13
                      }}
                    >
                      No notes created for this candidate yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showMatchDetails && matchPercentage != null && (
        <div
          role="presentation"
          onClick={() => setShowMatchDetails(false)}
          style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(15,23,42,.48)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}
        >
          <style>{`@media(max-width:640px){.match-details-sheet{align-self:flex-end;width:100%!important;max-width:none!important;border-radius:20px 20px 0 0!important;margin:-18px!important;padding-bottom:calc(24px + env(safe-area-inset-bottom))!important}}`}</style>
          <div
            className="match-details-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-details-title"
            onClick={(event) => event.stopPropagation()}
            style={{ width: "min(480px, 100%)", maxHeight: "82vh", overflowY: "auto", background: C.surface, borderRadius: 20, padding: 24, boxShadow: "0 24px 70px rgba(15,23,42,.24)" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h2 id="match-details-title" style={{ margin: 0, fontSize: 18, color: C.text }}>How the match score was calculated</h2>
                <p style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.5, color: C.textSec }}>The official score is provided by the matching service. This breakdown explains the applicable criteria.</p>
              </div>
              <button type="button" onClick={() => setShowMatchDetails(false)} aria-label="Close" style={{ border: 0, background: C.bg, color: C.textSec, borderRadius: 9, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><X size={17} /></button>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "22px 0 18px", padding: "14px 16px", borderRadius: 14, background: C.bg }}>
              <strong style={{ fontSize: 14, color: C.text }}>Official match</strong>
              <strong style={{ fontSize: 24, color: C.info }}>{matchPercentage}%</strong>
            </div>

            {applicableMatchItems.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {applicableMatchItems.map((item) => {
                  const progress = item.maxWeight > 0 ? Math.max(0, Math.min(100, (item.score / item.maxWeight) * 100)) : 0;
                  return (
                    <div key={item.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 7, fontSize: 12.5 }}>
                        <strong style={{ color: C.text }}>{item.label}</strong>
                        <span style={{ color: C.textSec }}>{item.score}/{item.maxWeight}</span>
                      </div>
                      <div style={{ height: 9, borderRadius: 99, background: C.divider, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${progress}%`, borderRadius: 99, background: C.info, transition: "width .25s ease" }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 4, paddingTop: 16, borderTop: `1px solid ${C.border}`, fontSize: 12.5, color: C.textSec, lineHeight: 1.6 }}>
                  <div>{earnedMatchPoints} earned points ÷ {applicableMatchWeight} applicable points × 100</div>
                  <strong style={{ color: C.text }}>Explanation result: {explainedMatchPercentage.toFixed(1)}%</strong>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, color: C.textSec, fontSize: 13 }}>No applicable criteria breakdown is available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
