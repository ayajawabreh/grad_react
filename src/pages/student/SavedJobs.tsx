import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { JobCard } from "../../components/cards/JobCard";
import { API } from "../../imports/api";

export default function SavedJobs() {
  const nav = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await API.get("/student/saved-jobs");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.jobs || [];

      const formattedJobs = data.map((job: any) => ({
        ...job,
        saved: true,
      }));

      setJobs(formattedJobs);
    } catch {
      setError("Failed to load saved jobs");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleSave(
    jobId: string | number,
    isSavedNow: boolean
  ) {
    if (!isSavedNow) {
      setJobs((prev) =>
        prev.filter(
          (x) => String(x.id) !== String(jobId)
        )
      );
    }
  }

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
          maxWidth: 1180,
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
    fontSize: 26,
    fontWeight: 700,
    color: C.text,
  }}
>
  Saved Jobs
</h1>
          <p
            style={{
              margin: "7px 0 0",
              fontSize: 14,
              color: C.textSec,
            }}
          >
            {jobs.length} saved{" "}
            {jobs.length === 1 ? "opportunity" : "opportunities"}
          </p>
        </div>

        {loading ? (
          <div
            style={{
              maxWidth: 820,
              padding: 50,
              background: C.surface,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: C.textMuted,
                fontSize: 14,
                margin: 0,
              }}
            >
              Loading...
            </p>
          </div>
        ) : error ? (
          <div
            style={{
              maxWidth: 820,
              padding: 50,
              background: C.surface,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: C.error,
                fontSize: 14,
                margin: 0,
              }}
            >
              {error}
            </p>
          </div>
        ) : jobs.length === 0 ? (
          <div
            style={{
              maxWidth: 820,
              padding: 50,
              background: C.surface,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: C.textMuted,
                fontSize: 14,
                margin: 0,
              }}
            >
              No saved jobs yet. Browse jobs and save ones you like!
            </p>
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              maxWidth: 820,
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                showMatch={false}
                onView={() =>
                  nav(`/student/jobs/${job.id}`)
                }
                onSave={(id, isSavedNow) =>
                  handleToggleSave(id, isSavedNow)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}