import { useEffect } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { JobCard } from "../../components/cards/JobCard";
import { refreshSavedJobsCache, setSavedJobState, useSavedJobsCache } from "../../sync/savedJobsStore";

export default function SavedJobs() {
  const nav = useNavigate();
  const { jobs, loading, error, hydrated } = useSavedJobsCache();

  useEffect(() => {
    void refreshSavedJobsCache(hydrated);
  }, []);

  async function handleToggleSave(
    jobId: string | number,
    isSavedNow: boolean
  ) {
    if (!isSavedNow) {
      setSavedJobState(jobId, false);
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
              fontSize: 24,
              fontWeight: 900,
              color: C.text,
            }}
          >
            Saved Jobs
          </h1>

          {loading ? (
            <div
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 50,
                background: C.surface,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                textAlign: "center",
                marginTop: 24,
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
                width: "100%",
                boxSizing: "border-box",
                padding: 50,
                background: C.surface,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                textAlign: "center",
                marginTop: 24,
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
                width: "100%",
                boxSizing: "border-box",
                padding: 50,
                background: C.surface,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                textAlign: "center",
                marginTop: 24,
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
    maxWidth: 1000,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 18,
    marginTop: 24,
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
    </div>
  );
}
