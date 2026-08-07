import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { MatchRing, Btn } from "../../components/ui";
import { MapPin, DollarSign, Heart } from "lucide-react";
import { API } from "../../imports/api";

export default function Recommended() {
  const nav = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/student/recommended-jobs")
      .then(async res => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.jobs || [];

        const sortedJobs = [...data].sort(
          (a, b) => (b.match || 0) - (a.match || 0)
        );

        const jobsWithSaveStatus = await Promise.all(
          sortedJobs.map(async (job) => {
            try {
              const savedRes = await API.get(`/jobs/${job.job_id}/saved`);
              return {
                ...job,
                is_saved: savedRes.data.saved
              };
            } catch {
              return {
                ...job,
                is_saved: false
              };
            }
          })
        );

        setJobs(jobsWithSaveStatus);
      })
      .catch(err => {
        console.error("Error fetching recommended jobs:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async (jobId: number, isSaved: boolean) => {
    try {
      if (isSaved) {
        await API.delete(`/jobs/${jobId}/save`);
      } else {
        await API.post(`/jobs/${jobId}/save`);
      }

      setJobs(prev =>
        prev.map(job =>
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
      <div style={{
        fontFamily: F,
        color: C.textSec,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "40vh",
        fontSize: 14,
        fontWeight: 600
      }}>
        Analyzing your profile for personalized matches...
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: F,
      color: C.text
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 28
      }}>
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4
          }}>
            <h1 style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0
            }}>
              Recommended for You
            </h1>
          </div>
          <p style={{
            color: C.textSec,
            fontSize: 14,
            margin: 0
          }}>
            Personalized matches based on your profile, skills, and preferences
          </p>
        </div>
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}>
        {jobs.length === 0 ? (
          <div style={{
            background: C.surface,
            borderRadius: 16,
            padding: 48,
            textAlign: "center",
            border: `1px solid ${C.border}`,
            color: C.textSec
          }}>
            No recommendations found at the moment.
          </div>
        ) : (
          jobs.map((job, idx) => {
            const companyName =
              job.company?.company_name ||
              job.company?.name ||
              "Tech Solutions Co.";

            const initialLetter = companyName[0] || "J";
            const jobColor = job.color || C.accent;
            const matchScore = job.match ?? 0;
            const salary =
              job.salary && !isNaN(Number(job.salary))
                ? `$${Number(job.salary).toLocaleString()}`
                : "Competitive";

            const whyMatches = [
              "Matches your educational background and field of interest",
              `Aligns with your preferences for ${job.location || "this location"}`,
              `Work type (${job.employment_type || "Full-Time"}) fits your current profile`
            ];

            return (
              <div
                key={job.job_id || idx}
                style={{
                  background: C.surface,
                  borderRadius: 20,
                  padding: 24,
                  border: `1px solid ${C.border}`
                }}
              >
                <div style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start"
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${jobColor}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <span style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: jobColor
                    }}>
                      {initialLetter}
                    </span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: "0 0 3px",
                      fontSize: 16,
                      fontWeight: 700
                    }}>
                      {job.title}
                    </h3>

                    <p style={{
                      margin: "0 0 10px",
                      fontSize: 13,
                      color: C.textSec
                    }}>
                      {companyName} · {job.employment_type || "Engineering"}
                    </p>

                    <div style={{
                      display: "flex",
                      gap: 14,
                      marginBottom: 14
                    }}>
                      <span style={{
                        fontSize: 12,
                        color: C.textSec,
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}>
                        <MapPin size={12} />
                        {job.location}
                      </span>

                      <span style={{
                        fontSize: 12,
                        color: C.textSec,
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}>
                        <DollarSign size={12} />
                        {salary}
                      </span>

                      <span style={{
                        padding: "2px 8px",
                        background: C.divider,
                        borderRadius: 99,
                        fontSize: 11,
                        color: C.textSec
                      }}>
                        {job.employment_type || "Full-Time"}
                      </span>
                    </div>

                    <div style={{
                      background: C.bg,
                      borderRadius: 12,
                      padding: "12px 16px"
                    }}>
                      <p style={{
                        margin: "0 0 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.textSec,
                        textTransform: "uppercase"
                      }}>
                        Why this matches
                      </p>

                      <ul style={{
                        margin: 0,
                        paddingLeft: 16
                      }}>
                        {whyMatches.map(item => (
                          <li
                            key={item}
                            style={{
                              fontSize: 12,
                              color: C.textSec,
                              marginBottom: 3
                            }}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12
                  }}>
                    <MatchRing v={matchScore} />
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {/* الزر باستخدام ألوان المتغيرات C الخاصة بـ Tokens */}
                      <button
                        onClick={() => handleSave(job.job_id, job.is_saved)}
                        style={{
                          background: C.surface || "#FFFFFF",
                          border: `1px solid ${job.is_saved ? C.accent : C.border}`,
                          borderRadius: 8,
                          padding: "4px 10px",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          color: job.is_saved ? C.accent : C.textSec, // اللون السكني الناعم للخط
                          transition: "all 0.15s ease"
                        }}
                      >
                        <Heart
                          size={13}
                          fill={job.is_saved ? C.accent : "none"}
                          color={job.is_saved ? C.accent : C.textSec} // لون الأيقونة السكني
                          strokeWidth={1.75}
                        />
                        {job.is_saved ? "Saved" : "Save"}
                      </button>

                      <Btn
                        v="primary"
                        size="sm"
                        onClick={() => nav(`/student/jobs/${job.job_id}`)}
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
  );
}