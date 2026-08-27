import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { MatchRing, Btn } from "../../components/ui";
import { MapPin, DollarSign, Heart } from "lucide-react";
import { API } from "../../imports/api";
import { useSyncResourceVersion } from "../../sync/useSyncResourceVersion";
import { formatExperienceRange } from "../../utils/experience";

const asTextList = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [])
    .map((item) => typeof item === "string" ? item.trim() : "")
    .filter(Boolean);

export default function Recommended() {
  const nav = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const jobsSyncVersion = useSyncResourceVersion("jobs");
  const resumeSyncVersion = useSyncResourceVersion("resume");
  const studentSyncVersion = useSyncResourceVersion("student");

  useEffect(() => {
    setError("");
    API.get("/student/recommended-jobs", { timeout: 15000 })
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.jobs || [];

        const sortedJobs = [...data].sort(
          (a, b) => (b.match || 0) - (a.match || 0)
        );

        setJobs(sortedJobs.map((job) => ({ ...job, is_saved: Boolean(job.is_saved) })));
        setLoading(false);

        void Promise.all(
          sortedJobs.map(async (job) => {
            try {
              const savedRes = await API.get(`/jobs/${job.job_id}/saved`);
              return {
                ...job,
                is_saved: savedRes.data.saved,
              };
            } catch {
              return {
                ...job,
                is_saved: false,
              };
            }
          })
        ).then((jobsWithSaveStatus) => setJobs(jobsWithSaveStatus));
      })
      .catch((err) => {
        console.error("Error fetching recommended jobs:", err);
        setError(err?.response?.data?.message || "Could not load recommended jobs.");
      })
      .finally(() => setLoading(false));
  }, [jobsSyncVersion, resumeSyncVersion, studentSyncVersion]);

  const handleSave = async (jobId: number, isSaved: boolean) => {
    try {
      if (isSaved) {
        await API.delete(`/jobs/${jobId}/save`);
      } else {
        await API.post(`/jobs/${jobId}/save`);
      }

      setJobs((prev) =>
        prev.map((job) =>
          job.job_id === jobId
            ? { ...job, is_saved: !isSaved }
            : job
        )
      );
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          fontFamily: F,
          color: C.textSec,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "40vh",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Analyzing your profile for personalized matches...
      </div>
    );
  }

  if (error) return <div style={{ fontFamily: F, color: C.error, padding: 24, background: C.errorBg, borderRadius: 14 }}>{error}</div>;

  return (
    <div
      style={{
        fontFamily: F,
        color: C.text,
        paddingBottom: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: 26,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 900,
              color: C.text,
            }}
          >
            Recommended for You
          </h1>

          <p
            style={{
              margin: "7px 0 0",
              fontSize: 14,
              color: C.textSec,
            }}
          >
            Personalized matches based on your profile, skills, and preferences
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            maxWidth: 1000,
          }}
        >
          {jobs.length === 0 ? (
            <div
              style={{
                background: C.surface,
                borderRadius: 16,
                padding: 48,
                textAlign: "center",
                border: `1px solid ${C.border}`,
                color: C.textSec,
              }}
            >
              No recommendations found at the moment.
            </div>
          ) : (
            jobs.map((job, idx) => {
              const companyName =
                (typeof job.company === "string" ? job.company : job.company?.company_name || job.company?.name) ||
                "Tech Solutions Co.";

              const initialLetter = companyName[0] || "J";
              const jobColor = job.color || C.accent;
              const matchScore = job.match ?? 0;

              const salary =
                job.salary && !isNaN(Number(job.salary))
                  ? `$${Number(job.salary).toLocaleString()}`
                  : "Competitive";

              const matchingSkills = asTextList(job.matching_skills);
              const missingSkills = asTextList(job.missing_skills);
              const whyMatches = asTextList(job.reasons);
              const warnings = asTextList(job.warnings);
              const recommendationLevel = job.recommendation_level ?? "Not rated";

              return (
                <div
                  key={job.job_id || idx}
                  style={{
                    background: C.surface,
                    borderRadius: 18,
                    padding: 20,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 11,
                        background: `${jobColor}18`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          color: jobColor,
                        }}
                      >
                        {initialLetter}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          margin: "0 0 3px",
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                      >
                        {job.title}
                      </h3>

                      <p
                        style={{
                          margin: "0 0 9px",
                          fontSize: 12.5,
                          color: C.textSec,
                        }}
                      >
                        {companyName} ·{" "}
                        {job.employment_type || "Engineering"}
                      </p>
                      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}><span style={{ padding: "3px 8px", borderRadius: 99, background: matchScore >= 90 ? C.successBg : matchScore >= 75 ? C.infoBg : matchScore >= 60 ? C.warningBg : C.divider, fontSize: 11, fontWeight: 700 }}>{recommendationLevel}</span><span style={{ fontSize: 11, color: C.textSec }}>{formatExperienceRange(job.min_experience_years, job.max_experience_years)}</span></div>
                      {matchingSkills.length > 0 && <div style={{ marginBottom: 8, fontSize: 11, color: C.success }}>Matching skills: {matchingSkills.join(", ")}</div>}
                      {missingSkills.length > 0 && <div style={{ marginBottom: 8, fontSize: 11, color: C.warning }}>Missing skills: {missingSkills.join(", ")}</div>}

                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          marginBottom: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11.5,
                            color: C.textSec,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <MapPin size={11} />
                          {job.location}
                        </span>

                        <span
                          style={{
                            fontSize: 11.5,
                            color: C.textSec,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <DollarSign size={11} />
                          {salary}
                        </span>

                        <span
                          style={{
                            padding: "2px 7px",
                            background: C.divider,
                            borderRadius: 99,
                            fontSize: 10.5,
                            color: C.textSec,
                          }}
                        >
                          {job.employment_type || "Full-Time"}
                        </span>
                      </div>

                      <div
                        style={{
                          background: C.bg,
                          borderRadius: 10,
                          padding: "10px 13px",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 6px",
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: C.textSec,
                            textTransform: "uppercase",
                          }}
                        >
                          Why this matches
                        </p>

                        {whyMatches.length > 0 ? <ul
                          style={{
                            margin: 0,
                            paddingLeft: 15,
                          }}
                        >
                          {whyMatches.map((item) => (
                            <li
                              key={item}
                              style={{
                                fontSize: 11.5,
                                color: C.textSec,
                                marginBottom: 2,
                              }}
                            >
                              {item}
                            </li>
                          ))}
                        </ul> : <span style={{ fontSize: 11.5, color: C.textMuted }}>{matchScore > 0 ? "This recommendation is based on your current profile." : "No strong match found with your current profile yet."}</span>}
                        {warnings.length > 0 && <div style={{ marginTop: 7, color: C.warning, fontSize: 11 }}>{warnings.join(" · ")}</div>}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <MatchRing v={matchScore} />

                      <div
                        style={{
                          display: "flex",
                          gap: 7,
                          alignItems: "center",
                        }}
                      >
                        <button
                          onClick={() =>
                            handleSave(job.job_id, job.is_saved)
                          }
                          style={{
                            background: C.surface,
                            border: `1px solid ${
                              job.is_saved ? C.accent : C.border
                            }`,
                            borderRadius: 8,
                            padding: "4px 9px",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "pointer",
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: job.is_saved
                              ? C.accent
                              : C.textSec,
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Heart
                            size={12}
                            fill={
                              job.is_saved ? C.accent : "none"
                            }
                            color={
                              job.is_saved
                                ? C.accent
                                : C.textSec
                            }
                            strokeWidth={1.75}
                          />
                          {job.is_saved ? "Saved" : "Save"}
                        </button>

                        <Btn
                          v="primary"
                          size="sm"
                          onClick={() =>
                            nav(`/student/jobs/${job.job_id}`)
                          }
                        >
                          View
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
