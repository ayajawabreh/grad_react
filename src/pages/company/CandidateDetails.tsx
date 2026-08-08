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
  Download
} from "lucide-react";

import {
  fetchApplicantDetails,
  fetchApplicantNotes,
  addApplicantNote,
  deleteApplicantNote,
  type ApplicantDetails,
  type CompanyNote
} from "../../imports/applicants";
import { API } from "../../imports/api";

const TABS = ["Profile", "Resume", "Notes"] as const;
const STATUS_OPTIONS = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"] as const;

export default function CandidateDetails() {
  const nav = useNavigate();
  const { id } = useParams();

  const [candidate, setCandidate] = useState<ApplicantDetails | null>(null);
  const [notes, setNotes] = useState<CompanyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");
  const [newNote, setNewNote] = useState("");
  const [status, setStatus] = useState<string>("Applied");

  useEffect(() => {
    if (!id) return;

    Promise.all([
      fetchApplicantDetails(Number(id)),
      fetchApplicantNotes(Number(id))
    ])
      .then(([applicant, notesData]) => {
        setCandidate(applicant);
        setNotes(Array.isArray(notesData) ? notesData : notesData ? [notesData] : []);
        if (applicant?.status) {
          setStatus(applicant.status);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const matchPercentage = candidate?.match?.percentage ?? 0;
  const matchReasons = candidate?.match?.reasons ?? [];

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
          status: newStatus,
        }
      );

      setStatus(newStatus);

      setCandidate((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
            }
          : prev
      );

      const timeline = await fetchApplicantDetails(candidate.application_id);
      setCandidate(timeline);

    } catch (error) {
      console.error(error);
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
          style={{ animation: "spin 1s linear infinite", marginBottom: 8 }}
        />
        <p style={{ margin: 0, fontSize: 14 }}>Loading candidate profile...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div style={{ fontFamily: F, color: C.text, padding: 24, maxWidth: 600 }}>
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
          <UserCheck size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ margin: "0 0 8px" }}>Candidate Not Found</h3>
          <p style={{ color: C.textSec, fontSize: 14, margin: 0 }}>
            The applicant profile you are looking for does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const resumeFilePath =
    (candidate as any)?.resume?.file_path ||
    (candidate as any)?.resume_url ||
    (candidate?.student as any)?.resume_url ||
    (candidate?.student as any)?.resume;

  const resumeUrl = resumeFilePath
    ? resumeFilePath.startsWith("http")
      ? resumeFilePath
      : `http://127.0.0.1:8000/storage/${resumeFilePath}`
    : null;

  const experiencesList = Array.isArray(candidate.experience)
    ? candidate.experience
    : Array.isArray((candidate as any).experiences)
    ? (candidate as any).experiences
    : [];

  return (
    <div style={{ fontFamily: F, color: C.text, maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>
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
          <ArrowLeft size={14} /> Back to Applicants
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
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: C.surface,
              borderRadius: 24,
              padding: "28px 20px 24px",
              border: `1px solid ${C.border}`,
              textAlign: "center"
            }}
          >
            <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
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
              {candidate.student.headline || "No headline provided"}
            </p>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <MatchRing v={matchPercentage} />
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.textSec }}>
                <Mail size={14} style={{ flexShrink: 0 }} />
                <span style={{ color: C.textSec, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {candidate.student.email}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.textSec }}>
                <MapPin size={14} style={{ flexShrink: 0 }} />
                <span>{candidate.student.location || "Not specified"}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.textSec }}>
                <Briefcase size={14} style={{ flexShrink: 0 }} />
                <span>
                  {typeof candidate.experience === "string"
                    ? candidate.experience
                    : experiencesList.length > 0
                    ? `${experiencesList.length} experience record(s)`
                    : "Not specified"}
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
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                        {new Date(item.changed_at).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: C.textSec }}>
                No timeline data available yet.
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
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

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {tab === "Profile" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div
                  style={{
                    background: "#F0EBF8",
                    padding: "16px 20px",
                    borderRadius: 16,
                    border: "1px solid rgba(147, 51, 234, 0.08)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#6B46C1",
                      marginBottom: 8
                    }}
                  >
                    <Sparkles size={14} /> AI Summary
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: "#4A5568"
                    }}
                  >
                    {candidate.ai_summary || "No AI summary available yet."}
                  </p>
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
                    Skills
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(candidate.match?.matching_skills?.length
                      ? candidate.match.matching_skills
                      : candidate.skills || []
                    ).map((skill) => (
                      <span
                        key={skill}
                        style={{
                          background: "#F2EBE1",
                          color: "#524538",
                          padding: "5px 14px",
                          borderRadius: 16,
                          fontSize: 12,
                          fontWeight: 500
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {(candidate.match?.missing_skills ?? []).length > 0 && (
                    <>
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
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {(candidate.match?.missing_skills || []).map((skill) => (
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
                        ))}
                      </div>
                    </>
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
                    Why This Match
                  </h3>
                  {matchReasons.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                    <div style={{ fontSize: 12.5, color: C.textSec }}>
                      No match details available.
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "Resume" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                        <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>
                          Resume Document (PDF)
                        </div>
                        <div style={{ fontSize: 12, color: C.textSec }}>
                          Click to open or download official CV
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: "none" }}
                      >
                        <Btn v="primary" size="sm" icon={ExternalLink}>
                          View Resume
                        </Btn>
                      </a>
                      <a
                        href={resumeUrl}
                        download
                        style={{ textDecoration: "none" }}
                      >
                        <Btn v="ghost" size="sm" icon={Download}>
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

                <div style={{ padding: 16, border: `1px solid ${C.border}`, borderRadius: 16, background: C.surface }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.textSec, marginBottom: 8, fontSize: 12 }}>
                    <GraduationCap size={16} /> Education
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>
                    {candidate?.student?.university || "Not specified"}
                  </div>
                  {candidate?.student?.major && (
                    <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>
                      {candidate.student.major}
                    </div>
                  )}
                </div>

                <div style={{ padding: 20, border: `1px solid ${C.border}`, borderRadius: 16, background: C.surface }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.text, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
                    <Briefcase size={16} /> Work Experience
                  </div>
                  {experiencesList.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {experiencesList.map((exp: any, i: number) => (
                        <div key={i} style={{ borderBottom: i !== experiencesList.length - 1 ? `1px solid ${C.border}` : "none", paddingBottom: 10 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{exp.title || exp.role || "Position"}</div>
                          <div style={{ fontSize: 12, color: C.textSec }}>
                            {exp.company || ""} {exp.duration || exp.dates ? `• ${exp.duration || exp.dates}` : ""}
                          </div>
                          {exp.description && <p style={{ fontSize: 12, color: C.textSec, margin: "4px 0 0" }}>{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : typeof candidate?.experience === "string" && candidate.experience.trim() !== "" ? (
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                      {candidate.experience}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12.5, color: C.textSec }}>
                      No work experience provided.
                    </div>
                  )}
                </div>

                <div style={{ padding: 20, border: `1px solid ${C.border}`, borderRadius: 16, background: C.surface }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.text, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
                    <FileText size={16} /> Projects
                  </div>
                  {((candidate as any).projects && (candidate as any).projects.length > 0) ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {(candidate as any).projects.map((proj: any, i: number) => (
                        <div key={i} style={{ borderBottom: i !== (candidate as any).projects.length - 1 ? `1px solid ${C.border}` : "none", paddingBottom: 10 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{proj.title || proj.name}</div>
                          {proj.description && <p style={{ fontSize: 12, color: C.textSec, margin: "4px 0 0" }}>{proj.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12.5, color: C.textSec }}>
                      No projects provided.
                    </div>
                  )}
                </div>

                <div style={{ padding: 20, border: `1px solid ${C.border}`, borderRadius: 16, background: C.surface }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.text, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
                    <Award size={16} /> Certificates
                  </div>
                  {((candidate as any).certificates && (candidate as any).certificates.length > 0) ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {(candidate as any).certificates.map((cert: any, i: number) => (
                        <div key={i} style={{ borderBottom: i !== (candidate as any).certificates.length - 1 ? `1px solid ${C.border}` : "none", paddingBottom: 10 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{cert.title || cert.name}</div>
                          <div style={{ fontSize: 12, color: C.textSec }}>{cert.issuer} {cert.date ? `• ${cert.date}` : ""}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12.5, color: C.textSec }}>
                      No certificates listed.
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "Notes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                    onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
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
                  <Btn v="primary" icon={Plus} onClick={handleAddNote} style={{ height: 34, padding: "0 14px" }}>
                    Add
                  </Btn>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                        <p style={{ margin: 0, fontSize: 13, color: C.text }}>{note.note}</p>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textSec }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: "center", padding: "24px 0", color: C.textSec, fontSize: 13 }}>
                      No notes created for this candidate yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}