import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import {
  fetchJobs,
  UiJob,
} from "../../imports/jobs";
import { JobCard } from "../../components/cards/JobCard";
import { Search, SlidersHorizontal } from "lucide-react";
import { useSavedJobsCache } from "../../sync/savedJobsStore";
import { useApplicationsCache } from "../../sync/applicationsStore";
import { useSyncResourceVersion } from "../../sync/useSyncResourceVersion";
import { getJobCategories } from "../../imports/api";

const JOB_TYPES = [
  "Full-Time",
  "Part-Time",
  "Internship",
  "Contract",
];

const WORK_MODES = [
  "Remote",
  "Hybrid",
  "On-site",
];

export default function JobDiscovery() {
  const nav = useNavigate();

  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [jobs, setJobs] = useState<UiJob[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { ids: savedJobIds, hydrated: savedJobsHydrated } = useSavedJobsCache();
  const { jobIds: applicationJobIds, hydrated: applicationsHydrated } = useApplicationsCache();
  const jobsSyncVersion = useSyncResourceVersion("jobs");

  useEffect(() => {
    void getJobCategories().then((response: any) => {
      const data = response?.data ?? response;
      setCategories(Array.isArray(data) ? data : data?.categories ?? data?.data ?? []);
    }).catch((error) => console.error("Failed to load job categories:", error));
  }, []);

  useEffect(() => {
    if (!savedJobsHydrated) return;
    setJobs((current) => current.map((job) => ({
      ...job,
      saved: savedJobIds.has(String(job.id)),
    })));
  }, [savedJobIds, savedJobsHydrated]);

  useEffect(() => {
    if (!applicationsHydrated) return;
    setJobs((current) => current.map((job) => ({
      ...job,
      applied: applicationJobIds.has(String(job.id)),
    })));
  }, [applicationJobIds, applicationsHydrated]);

  const toggle = (
    arr: string[],
    setArr: (value: string[]) => void,
    value: string
  ) => {
    setArr(
      arr.includes(value)
        ? arr.filter((item) => item !== value)
        : [...arr, value]
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs();
    }, 400);

    return () => clearTimeout(timer);
  }, [query, types, modes, categoryId]);

  useEffect(() => {
    if (jobsSyncVersion > 0) void loadJobs(false);
  }, [jobsSyncVersion]);

  async function loadJobs(showLoading = true) {
    if (showLoading) setLoading(true);
    setError("");

    try {
      const res = await fetchJobs({
        search: query || undefined,
        types: types.length ? types : undefined,
        modes: modes.length ? modes : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
      });

      setJobs(res.jobs ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load jobs, please try again");
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  function handleToggleSave(jobId: string | number, isSavedNow: boolean) {
    setJobs((prev) =>
      prev.map((item) =>
        String(item.id) === String(jobId)
          ? { ...item, saved: isSavedNow }
          : item
      )
    );
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
            Find Jobs
          </h1>

          <p
            style={{
              margin: "7px 0 0",
              fontSize: 14,
              color: C.textSec,
            }}
          >
            Discover opportunities that match your career goals
          </p>

          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: C.textMuted,
            }}
          >
            {total}{" "}
            {total === 1 ? "opportunity" : "opportunities"} available
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            width: "100%",
          }}
        >
          <div
            style={{
              flex: 1,
              position: "relative",
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 15,
                top: "50%",
                transform: "translateY(-50%)",
                color: C.textMuted,
              }}
            />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs or companies..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px 12px 42px",
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.text,
                fontFamily: F,
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 16px",
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              cursor: "pointer",
              fontFamily: F,
              fontSize: 13,
            }}
          >
            <SlidersHorizontal size={15} />
            Filters
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "180px minmax(0, 1fr)",
            gap: 28,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: C.surface,
              borderRadius: 16,
              padding: 18,
              border: `1px solid ${C.border}`,
              position: "sticky",
              top: 20,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 18,
              }}
            >
              Filters
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 12,
                color: C.text,
              }}
            >
              Job Type
            </div>

            {JOB_TYPES.map((type) => (
              <label
                key={type}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={types.includes(type)}
                  onChange={() =>
                    toggle(types, setTypes, type)
                  }
                />

                <span
                  style={{
                    fontSize: 12.5,
                    color: C.textSec,
                  }}
                >
                  {type}
                </span>
              </label>
            ))}

            <div
              style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: C.text }}
            >
              Category
            </div>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              style={{ width: "100%", padding: "9px 10px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontFamily: F, fontSize: 12.5 }}
            >
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>

            <div
              style={{
                height: 1,
                background: C.divider,
                margin: "18px 0",
              }}
            />

            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 12,
                color: C.text,
              }}
            >
              Work Mode
            </div>

            {WORK_MODES.map((mode) => (
              <label
                key={mode}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={modes.includes(mode)}
                  onChange={() =>
                    toggle(modes, setModes, mode)
                  }
                />

                <span
                  style={{
                    fontSize: 12.5,
                    color: C.textSec,
                  }}
                >
                  {mode}
                </span>
              </label>
            ))}
          </div>

          <div
            style={{
              width: "100%",
              minWidth: 0,
            }}
          >
            {loading ? (
              <div
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 50,
                  textAlign: "center",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  color: C.textSec,
                  fontSize: 14,
                }}
              >
                Loading jobs...
              </div>
            ) : error ? (
              <div
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 50,
                  textAlign: "center",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  color: C.error,
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            ) : jobs.length === 0 ? (
              <div
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 50,
                  textAlign: "center",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  color: C.textSec,
                  fontSize: 14,
                }}
              >
                No jobs match your filters
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: 18,
                  width: "100%",
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
                    onSave={handleToggleSave}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
