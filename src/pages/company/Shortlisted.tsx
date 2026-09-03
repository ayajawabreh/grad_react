import { useEffect, useState } from "react";
import { useSyncResourceVersion } from "../../sync/useSyncResourceVersion";
import { useNavigate, useParams } from "react-router";
import { C, F } from "../../constants/tokens";
import { API } from "../../imports/api";

interface Skill {
  id?: number;
  name: string;
}

interface ShortlistedApplicant {
  id: number;
  status: string;
  student: {
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    headline?: string;
    university?: string;
    major?: string;
    gpa?: number;
    location?: string;
  };
  skills: (string | Skill)[];
  job?: { id: number; title: string };
  job_id?: number;
  job_title?: string;
}

export default function Shortlisted() {
  const applicationsSyncVersion = useSyncResourceVersion("applications");
  const { id } = useParams();
  const nav = useNavigate();
  const [applicants, setApplicants] = useState<ShortlistedApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const removeFromShortlist = async (applicationId: number) => {
    try {
      setRemovingId(applicationId);
      await API.delete(`/company/applications/${applicationId}/shortlist`);
      setApplicants((current) =>
        current.filter(
          (candidate) => String(candidate.id) !== String(applicationId)
        )
      );
    } catch (error: any) {
      window.alert(
        error?.response?.data?.message ||
        "Failed to remove candidate from shortlist."
      );
    } finally {
      setRemovingId(null);
    }
  };

  const loadShortlisted = (showLoading = true) => {
    if (showLoading) setLoading(true);
    API.get(id ? `/company/jobs/${id}/shortlisted` : "/company/shortlisted")
      .then((res) => {
        setApplicants(Array.isArray(res.data) ? res.data : res.data?.applications ?? []);
      })
      .catch((err) => {
        console.error("Error fetching shortlisted applicants:", err);
        setApplicants([]);
      })
      .finally(() => {
        if (showLoading) setLoading(false);
      });
  };

  useEffect(() => {
    loadShortlisted();
    const refresh = () => loadShortlisted(false);
    const interval = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [id]);

  useEffect(() => {
    if (applicationsSyncVersion > 0) loadShortlisted(false);
  }, [applicationsSyncVersion]);

  if (loading) {
    return (
      <div
        style={{
          fontFamily: F,
          color: C.text,
          padding: 40,
          textAlign: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <h1
          style={{
            fontSize: 30,
            fontWeight: 700,
            margin: 0,
          }}
        >
          Shortlisted Candidates
        </h1>
        <p style={{ margin: "6px 0 0", color: C.textSec, fontSize: 13 }}>
          {id ? "Candidates shortlisted for this job" : "All shortlisted candidates across your jobs"}
        </p>
      </div>

      {applicants.length === 0 ? (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 35,
            color: C.textSec,
            textAlign: "center",
          }}
        >
          No shortlisted candidates yet.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(350px,1fr))",
            gap: 24,
            alignItems: "stretch",
          }}
        >
          {applicants.map((applicant) => (
            <div
              key={applicant.id}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 22,
                padding: 24,
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 65,
                    height: 65,
                    borderRadius: "50%",
                    background: C.accentLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 700,
                    color: C.accentHover,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {applicant.student.avatar ? (
                    <img
                      src={applicant.student.avatar}
                      alt={applicant.student.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    applicant.student.name?.charAt(0).toUpperCase()
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 20,
                      fontWeight: 700,
                    }}
                  >
                    {applicant.student.name}
                  </h3>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: C.textSec,
                      fontSize: 14,
                    }}
                  >
                    {applicant.student.headline || "Software Developer"}
                  </p>
                  {!id && (applicant.job?.title || applicant.job_title) && (
                    <p style={{ margin: "6px 0 0", color: C.accentHover, fontSize: 12, fontWeight: 700 }}>
                      {applicant.job?.title || applicant.job_title}
                    </p>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 20,
                  color: C.textSec,
                  fontSize: 14,
                }}
              >
                <div>✉ {applicant.student.email}</div>

                {applicant.student.major && (
                  <div>🎓 {applicant.student.major}</div>
                )}

                {applicant.student.university && (
                  <div>🏫 {applicant.student.university}</div>
                )}

                {applicant.student.location && (
                  <div>📍 {applicant.student.location}</div>
                )}

                {applicant.student.gpa !== undefined &&
                  applicant.student.gpa !== null && (
                    <div>⭐ GPA: {applicant.student.gpa}</div>
                  )}
              </div>

              {applicant.skills?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Skills
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {applicant.skills.map((skill, index) => {
                      const skillName =
                        typeof skill === "string" ? skill : skill?.name;

                      return (
                        <span
                          key={skillName || index}
                          style={{
                            background: C.accentLight,
                            color: C.accentHover,
                            padding: "6px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {skillName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: "auto",
                  paddingTop: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => void removeFromShortlist(applicant.id)}
                  disabled={removingId === applicant.id}
                  style={{
                    background: "#DCFCE7",
                    color: "#15803D",
                    border: "none",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: removingId === applicant.id ? "not-allowed" : "pointer",
                    flex: 1,
                    fontFamily: F,
                    opacity: removingId === applicant.id ? 0.65 : 1,
                  }}
                >
                  {removingId === applicant.id
                    ? "Removing..."
                    : "Remove from Shortlist"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    nav(`/company/applicants/${applicant.id}`)
                  }
                  style={{
                    background: C.accent,
                    color: "white",
                    border: "none",
                    padding: "10px 22px",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontWeight: 600,
                    flex: 1,
                    fontFamily: F,
                  }}
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
