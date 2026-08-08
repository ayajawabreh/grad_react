import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { fetchJobs, saveJob, unsaveJob, UiJob } from "../../imports/jobs";
import { getJobRecommendations } from "../../imports/api";
import { JobCard } from "../../components/cards/JobCard";
import { Search, SlidersHorizontal } from "lucide-react";

const JOB_TYPES = [
  "Full-Time",
  "Part-Time",
  "Internship",
  "Contract"
];

const WORK_MODES = [
  "Remote",
  "Hybrid",
  "On-site"
];

/* =========================================================
   TYPES
========================================================= */

interface AIRecommendation {
  job_id: number;
  match: number;
  matching_skills?: string[];
  why_it_fits?: string;
}

interface JobWithMatch extends UiJob {
  aiMatch?: number;
  match?: number; // إضافة match عشان JobCard يستقبلها
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function JobDiscovery() {
  const nav = useNavigate();

  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);
  const [jobs, setJobs] = useState<JobWithMatch[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const toggle = (
    arr: string[],
    setArr: (v: string[]) => void,
    value: string
  ) => {
    setArr(
      arr.includes(value)
        ? arr.filter(x => x !== value)
        : [...arr, value]
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs();
    }, 400);

    return () => clearTimeout(timer);
  }, [query, types, modes]);

  async function loadJobs() {
    setLoading(true);
    setError("");

    try {
      const res = await fetchJobs({
        search: query || undefined,
        types: types.length ? types : undefined,
        modes: modes.length ? modes : undefined,
      });

      // جلب التوصيات من الـ AI
      let aiRecommendations: AIRecommendation[] = [];
      try {
        const aiResponse: any = await getJobRecommendations();
        aiRecommendations = Array.isArray(aiResponse)
          ? aiResponse
          : aiResponse?.recommendations ?? aiResponse?.jobs ?? [];
        
        console.log("AI Recommendations:", aiRecommendations); // للتأكد
      } catch (aiError) {
        console.log("AI recommendations failed:", aiError);
      }

      // عمل Map للـ recommendations
      const aiMap = new Map<number, AIRecommendation>();
      aiRecommendations.forEach((rec) => {
        aiMap.set(Number(rec.job_id), rec);
      });

      // دمج البيانات مع النسبة
      const mergedJobs: JobWithMatch[] = (res.jobs ?? []).map((job: UiJob) => {
        const ai = aiMap.get(Number(job.id));
        const matchScore = ai?.match ?? 0;
        
        return {
          ...job,
          aiMatch: matchScore,
          match: matchScore, // إضافة match عشان JobCard يستقبلها
        };
      });

      console.log("Merged Jobs:", mergedJobs); // للتأكد

      setJobs(mergedJobs);
      setTotal(res.total);

    } catch (err) {
      console.log(err);
      setError("Failed to load jobs, please try again");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleSave(job: JobWithMatch) {
    setJobs(prev =>
      prev.map(j =>
        j.id === job.id
          ? { ...j, saved: !j.saved }
          : j
      )
    );

    try {
      if (job.saved)
        await unsaveJob(job.id);
      else
        await saveJob(job.id);
    } catch {
      setJobs(prev =>
        prev.map(j =>
          j.id === job.id
            ? { ...j, saved: job.saved }
            : j
        )
      );
    }
  }

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 24,
          fontWeight: 700,
          margin: 0
        }}>
          Find Jobs
        </h1>

        <p style={{
          color: C.textSec,
          fontSize: 14,
          marginTop: 6
        }}>
          {total} opportunities available
        </p>
      </div>

      {/* Search */}
      <div style={{
        display: "flex",
        gap: 12,
        marginBottom: 24
      }}>
        <div style={{
          flex: 1,
          position: "relative"
        }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.textMuted
            }}
          />

          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search jobs, companies..."
            style={{
              width: "100%",
              padding: "11px 14px 11px 40px",
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              fontFamily: F,
              fontSize: 13,
              background: C.surface,
              boxSizing: "border-box"
            }}
          />
        </div>

        <button style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "11px 18px",
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          background: C.surface,
          cursor: "pointer",
          fontFamily: F
        }}>
          <SlidersHorizontal size={14} />
          Filters
        </button>
      </div>

      {/* Main */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr",
        gap: 20
      }}>
        {/* Filters */}
        <div style={{
          background: C.surface,
          borderRadius: 16,
          padding: 20,
          border: `1px solid ${C.border}`
        }}>
          <p style={{
            fontSize: 13,
            fontWeight: 700
          }}>
            Job Type
          </p>

          {JOB_TYPES.map(type => (
            <label key={type}
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 10
              }}
            >
              <input
                type="checkbox"
                checked={types.includes(type)}
                onChange={() =>
                  toggle(types, setTypes, type)
                }
              />
              <span style={{
                fontSize: 13,
                color: C.textSec
              }}>
                {type}
              </span>
            </label>
          ))}

          <hr style={{
            border: 0,
            borderTop: `1px solid ${C.divider}`,
            margin: "16px 0"
          }} />

          <p style={{
            fontSize: 13,
            fontWeight: 700
          }}>
            Work Mode
          </p>

          {WORK_MODES.map(mode => (
            <label key={mode}
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 10
              }}
            >
              <input
                type="checkbox"
                checked={modes.includes(mode)}
                onChange={() =>
                  toggle(modes, setModes, mode)
                }
              />
              <span style={{
                fontSize: 13,
                color: C.textSec
              }}>
                {mode}
              </span>
            </label>
          ))}
        </div>

        {/* Jobs */}
        <div>
          {loading ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              Loading jobs...
            </div>
          ) : error ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              {error}
            </div>
          ) : jobs.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              No jobs match your filters
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,1fr)",
              gap: 16
            }}>
              {jobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onView={() =>
                    nav(`/student/jobs/${job.id}`)
                  }
                  onSave={() =>
                    handleToggleSave(job)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}