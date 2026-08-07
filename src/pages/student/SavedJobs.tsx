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
      const data = Array.isArray(res.data) ? res.data : res.data?.jobs || [];
      const formattedJobs = data.map((job: any) => ({ ...job, saved: true }));
      setJobs(formattedJobs);
    } catch {
      setError("Failed to load saved jobs");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleSave(jobId: string | number, isSavedNow: boolean) {
    if (!isSavedNow) {
      setJobs(prev => prev.filter(x => String(x.id) !== String(jobId)));
    }
  }

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Saved Jobs</h1>
        <p style={{ color: C.textSec, fontSize: 14, marginTop: 6 }}>{jobs.length} saved opportunities</p>
      </div>

      {loading ? (
        <div style={{ background: C.surface, borderRadius: 20, padding: 60, border: `1px solid ${C.border}`, textAlign: "center" }}>
          <p style={{ color: C.textMuted, fontSize: 15 }}>Loading...</p>
        </div>
      ) : error ? (
        <div style={{ background: C.surface, borderRadius: 20, padding: 60, border: `1px solid ${C.border}`, textAlign: "center" }}>
          <p style={{ color: C.textMuted, fontSize: 15 }}>{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ background: C.surface, borderRadius: 20, padding: 60, border: `1px solid ${C.border}`, textAlign: "center" }}>
          <p style={{ color: C.textMuted, fontSize: 15 }}>No saved jobs yet. Browse jobs and save ones you like!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onView={() => nav(`/student/jobs/${job.id}`)}
              onSave={(id, isSavedNow) => handleToggleSave(id, isSavedNow)}
            />
          ))}
        </div>
      )}
    </div>
  );
}