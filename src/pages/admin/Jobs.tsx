import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { C, F } from "../../constants/tokens";
import { Btn, SBadge } from "../../components/ui";
import {
  Search,
  CheckCircle,
  Flag,
  Trash2,
  Ban,
  X,
  XCircle,
  Briefcase,
  Users,
  RotateCcw,
  PlayCircle,
  AlertCircle,
} from "lucide-react";
import {
  getAdminJobsModeration,
  approveAdminJob,
  rejectAdminJob,
  requestChangesAdminJob,
  suspendAdminJob,
  getAdminJobModeration,
  deleteAdminJob,
  restoreAdminJobToReview,
  getAdminCategories,
} from "../../imports/api";
import { useSyncResourceVersion } from "../../sync/useSyncResourceVersion";
import { formatExperienceRange } from "../../utils/experience";
import { EnglishDatePicker } from "../../components/shared/EnglishDatePicker";

type AdminJob = {
  id: number;
  title?: string;
  company?: string;
  company_name?: string;
  company_profile?: { company_name?: string };
  type?: string;
  employment_type?: string;
  applicants?: number;
  applications_count?: number;
  status?: string;
  category?: string | { id?: number; name?: string };
  category_name?: string;
  shortlisted_count?: number;
  accepted_count?: number;
  rejected_count?: number;
  description?: string;
  moderation_note?: string | null;
  min_experience_years?: number | null;
  max_experience_years?: number | null;
  posted?: string;
  created_at?: string;
};

const filterStyle: React.CSSProperties = { padding: "9px 11px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.textSec, fontFamily: F, fontSize: 12, minWidth: 145 };

export default function AdminJobs() {
  const jobsSyncVersion = useSyncResourceVersion("jobs");
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [rejectJobId, setRejectJobId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [deleteJobTarget, setDeleteJobTarget] = useState<AdminJob | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const loadJobs = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const response = await getAdminJobsModeration();

      const data = response?.data ?? response;

      setJobs(
        Array.isArray(data)
          ? data
          : data?.jobs ?? data?.data ?? []
      );
    } catch (error) {
      console.error("Failed to load admin jobs:", error);
      setJobs([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    void getAdminCategories().then((response: any) => {
      const data = response?.data ?? response;
      setCategoryOptions(Array.isArray(data) ? data : data?.categories ?? data?.data ?? []);
    }).catch((error) => console.error("Failed to load admin categories:", error));
  }, []);

  useEffect(() => {
    if (jobsSyncVersion > 0) void loadJobs(false);
  }, [jobsSyncVersion]);

  useEffect(() => {
    const refresh = () => loadJobs(false);
    const interval = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const companyName = (job: AdminJob) => job.company ?? job.company_name ?? job.company_profile?.company_name ?? "Unknown Company";
  const categoryName = (job: AdminJob) => typeof job.category === "string" ? job.category : job.category?.name ?? "Uncategorized";
  const companies = useMemo(() => [...new Set(jobs.map(companyName))].sort(), [jobs]);
  const filtered = jobs.filter((job) => {
    const search = query.toLowerCase();
    const matchesSearch = (
      !search ||
      job.title?.toLowerCase().includes(search) ||
      companyName(job).toLowerCase().includes(search) ||
      categoryName(job).toLowerCase().includes(search)
    );
    const matchesDate = !dateFilter || (job.created_at && job.created_at.slice(0, 10) === dateFilter);
    return matchesSearch && (!statusFilter || (job.status ?? "Pending").toLowerCase() === statusFilter.toLowerCase()) && (!companyFilter || companyName(job) === companyFilter) && (!categoryFilter || categoryName(job) === categoryFilter) && matchesDate;
  });

  const handleApprove = async (id: number) => {
    try {
      setActionLoading(id);

      await approveAdminJob(id);

      setJobs((current) => current.map((job) => job.id === id ? { ...job, status: "Open" } : job));
      toast.success("Job approved successfully");
    } catch (error) {
      console.error("Failed to approve job:", error); toast.error("Could not approve job");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestChanges = async (id: number) => {
    try {
      setActionLoading(id);

      await requestChangesAdminJob(id);

      setJobs((current) => current.map((job) => job.id === id ? { ...job, status: "Changes Requested" } : job));
      toast.success("Changes requested from the company");
    } catch (error) {
      console.error("Failed to request changes:", error); toast.error("Could not request changes");
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (id: number) => {
    setRejectJobId(id);
    setRejectNote("");
    setRejectError("");
  };

  const handleReject = async () => {
    if (!rejectJobId) return;
    if (rejectNote.trim().length < 10) {
      setRejectError("Please provide a clear reason of at least 10 characters.");
      return;
    }
    try {
      setActionLoading(rejectJobId);

      await rejectAdminJob(rejectJobId, rejectNote.trim());

      setJobs((current) => current.map((job) => job.id === rejectJobId ? { ...job, status: "Rejected", moderation_note: rejectNote.trim() } : job));
      setRejectJobId(null);
      setRejectNote("");
      toast.success("Job rejected");
    } catch (error: any) {
      console.error("Failed to reject job:", error);
      setRejectError(error?.response?.data?.message || "Could not reject job.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (id: number) => {
    try {
      setActionLoading(id);

      await suspendAdminJob(id);

      setJobs((current) => current.map((job) => job.id === id ? { ...job, status: "Suspended" } : job));
      toast.success("Job suspended successfully");
    } catch (error) {
      console.error("Failed to suspend job:", error); toast.error("Could not suspend job");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreToReview = async (id: number) => {
    try {
      setActionLoading(id);
      await restoreAdminJobToReview(id);
      setJobs((current) => current.map((job) =>
        job.id === id ? { ...job, status: "Pending Review" } : job
      ));
      toast.success("Job restored to pending review");
    } catch (error: any) {
      console.error("Failed to restore job:", error);
      toast.error("Could not restore job", {
        description: error?.response?.data?.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (job: AdminJob) => {
    if (!window.confirm(`Delete “${job.title ?? "this job"}” permanently?`)) return;
    try { setActionLoading(job.id); await deleteAdminJob(job.id); setJobs((current) => current.filter((item) => item.id !== job.id)); toast.success("Job deleted successfully"); }
    catch (error: any) { console.error(error); toast.error("Could not delete job", { description: error?.response?.data?.message }); }
    finally { setActionLoading(null); }
  };

  const handleView = async (id: number) => {
    try {
      const response = await getAdminJobModeration(id);
      const data = response?.data ?? response;
      setSelectedJob(data?.job ?? data);
    } catch (error) {
      console.error("Failed to load job details:", error);
    }
  };

  const confirmDeleteJob = async () => {
    if (!deleteJobTarget) return;
    try {
      setActionLoading(deleteJobTarget.id);
      setDeleteError("");
      await deleteAdminJob(deleteJobTarget.id);
      setJobs((current) => current.filter((item) => item.id !== deleteJobTarget.id));
      setDeleteJobTarget(null);
      toast.success("Job deleted successfully", { description: "The listing was permanently removed from the platform." });
    } catch (error: any) {
      setDeleteError(error?.response?.data?.message || "The job could not be deleted. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            margin: 0,
          }}
        >
          Job Moderation
        </h1>

        <p
          style={{
            color: C.textSec,
            fontSize: 14,
            marginTop: 6,
          }}
        >
          Review and moderate job listings across the platform
        </p>
      </div>

      {rejectJobId && (
        <div onClick={() => actionLoading === null && setRejectJobId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: 440, maxWidth: "100%", padding: 24, borderRadius: 18, background: C.surface, border: `1px solid ${C.border}` }}>
            <h2 style={{ margin: "0 0 7px", fontSize: 18 }}>Reject Job</h2>
            <p style={{ margin: "0 0 17px", color: C.textSec, fontSize: 13 }}>Explain why this job was rejected. The company will see this note in Manage Jobs.</p>
            <label style={{ display: "block", marginBottom: 7, fontSize: 12, fontWeight: 700 }}>Rejection reason</label>
            <textarea autoFocus rows={5} value={rejectNote} onChange={(event) => { setRejectNote(event.target.value); setRejectError(""); }} placeholder="Example: The job description is incomplete and the requirements need more detail." style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 11, border: `1px solid ${rejectError ? C.error : C.border}`, resize: "vertical", outline: 0, fontFamily: F, color: C.text, fontSize: 13 }} />
            {rejectError && <div style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 9, color: C.error, fontSize: 12 }}><AlertCircle size={15} />{rejectError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 18 }}><Btn v="outline" size="sm" disabled={actionLoading !== null} onClick={() => setRejectJobId(null)}>Cancel</Btn><Btn v="danger" size="sm" disabled={actionLoading !== null} onClick={handleReject}>{actionLoading !== null ? "Rejecting..." : "Reject Job"}</Btn></div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Jobs", value: jobs.length, icon: Briefcase, color: C.accent, bg: C.accentLight },
          { label: "Active", value: jobs.filter((job) => ["open", "active", "approved", "published"].includes((job.status ?? "").toLowerCase())).length, icon: CheckCircle, color: C.success, bg: C.successBg },
          { label: "Pending Review", value: jobs.filter((job) => ["pending", "pending review"].includes((job.status ?? "Pending").toLowerCase())).length, icon: Flag, color: C.warning, bg: C.warningBg },
          { label: "Total Applicants", value: jobs.reduce((sum, job) => sum + Number(job.applicants ?? job.applications_count ?? 0), 0), icon: Users, color: C.info, bg: C.infoBg },
        ].map(({ label, value, icon: Icon, color, bg }) => <div key={label} style={{ padding: 17, borderRadius: 18, border: `1px solid ${C.border}`, background: C.surface, display: "flex", gap: 12, alignItems: "center" }}><div style={{ width: 40, height: 40, borderRadius: 12, background: bg, color, display: "grid", placeItems: "center" }}><Icon size={18}/></div><div><div style={{ fontSize: 21, fontWeight: 800 }}>{loading ? "—" : value}</div><div style={{ fontSize: 12, color: C.textSec }}>{label}</div></div></div>)}
      </div>

      <div
        style={{
          position: "relative",
          marginBottom: 20,
        }}
      >
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: C.textMuted,
          }}
        />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search jobs…"
          style={{
            width: "100%",
            padding: "10px 12px 10px 36px",
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            fontFamily: F,
            fontSize: 13,
            background: C.surface,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, margin: "-10px 0 20px", flexWrap: "wrap" }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={filterStyle}><option value="">All statuses</option>{["Open", "Pending Review", "Closed", "Suspended", "Rejected", "Changes Requested"].map((status) => <option key={status}>{status}</option>)}</select>
        <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} style={filterStyle}><option value="">All companies</option>{companies.map((company) => <option key={company}>{company}</option>)}</select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={filterStyle}><option value="">All categories</option>{categoryOptions.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select>
        <div style={{ width: 170 }}>
          <EnglishDatePicker
            value={dateFilter}
            onChange={setDateFilter}
            minDate={null}
          />
        </div>
        {(query || statusFilter || companyFilter || categoryFilter || dateFilter) && <Btn v="ghost" size="sm" onClick={() => { setQuery(""); setStatusFilter(""); setCompanyFilter(""); setCategoryFilter(""); setDateFilter(""); }}>Clear filters</Btn>}
      </div>

      <div
        style={{
          background: C.surface,
          borderRadius: 20,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "2fr 1.5fr 80px 110px 110px 210px",
            gap: 16,
            padding: "12px 20px",
            background: C.bg,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          {[
            "Title",
            "Company",
            "Applicants",
            "Status",
            "Posted",
            "Actions",
          ].map((h) => (
            <span
              key={h}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: C.textSec,
              fontSize: 13,
            }}
          >
            Loading jobs...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: C.textSec,
              fontSize: 13,
            }}
          >
            No jobs found.
          </div>
        ) : (
          filtered.map((job, i) => {
            const isLoading = actionLoading === job.id;
            const normalizedStatus = (job.status ?? "Pending Review").toLowerCase();
            const isOpen = ["open", "active", "approved", "published"].includes(normalizedStatus);
            const isPending = ["pending", "pending review"].includes(normalizedStatus);
            const isChangesRequested = normalizedStatus === "changes requested";
            const isRejected = normalizedStatus === "rejected";
            const isSuspended = normalizedStatus === "suspended";
            const isClosed = normalizedStatus === "closed";

            const title = job.title ?? "Untitled Job";
            const company =
              job.company ??
              job.company_name ??
              job.company_profile?.company_name ??
              "Unknown Company";

            const category = categoryName(job);

            const type =
              job.type ??
              job.employment_type ??
              "-";

            const applicants =
              job.applicants ??
              job.applications_count ??
              0;

            const posted =
              job.posted ??
              (job.created_at
                ? new Date(job.created_at).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )
                : "-");

            return (
              <div
                key={job.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "2fr 1.5fr 80px 110px 110px 210px",
                  gap: 16,
                  padding: "14px 20px",
                  borderBottom:
                    i < filtered.length - 1
                      ? `1px solid ${C.divider}`
                      : "none",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "transparent";
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {title}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: C.textSec,
                    }}
                  >
                    {category} · {type}
                  </p>
                </div>

                <span
                  style={{
                    fontSize: 13,
                    color: C.textSec,
                  }}
                >
                  {company}
                </span>

                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  {applicants}
                </span>

                <SBadge s={job.status ?? "Pending"} />

                <span
                  style={{
                    fontSize: 12,
                    color: C.textSec,
                  }}
                >
                  {posted}
                </span>

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                  }}
                >
                  {(isPending || isChangesRequested) && <button
                    title="Approve"
                    disabled={isLoading}
                    onClick={() => handleApprove(job.id)}
                    style={{
                      padding: "6px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.successBg,
                      cursor: isLoading
                        ? "not-allowed"
                        : "pointer",
                      display: "flex",
                      alignItems: "center",
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    <CheckCircle
                      size={13}
                      color={C.success}
                    />
                  </button>}

                  {isOpen && <button title="Suspend" disabled={isLoading} onClick={() => handleSuspend(job.id)} style={{ padding: "6px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.errorBg, cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", opacity: isLoading ? 0.5 : 1 }}>
                    <Ban size={13} color={C.error} />
                  </button>}

                  {isPending && <button
                    title="Request Changes"
                    disabled={isLoading}
                    onClick={() =>
                      handleRequestChanges(job.id)
                    }
                    style={{
                      padding: "6px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.warningBg,
                      cursor: isLoading
                        ? "not-allowed"
                        : "pointer",
                      display: "flex",
                      alignItems: "center",
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    <Flag
                      size={13}
                      color={C.warning}
                    />
                  </button>}

                  {(isPending || isChangesRequested) && <button
                    title="Reject"
                    disabled={isLoading}
                    onClick={() =>
                      openRejectModal(job.id)
                    }
                    style={{
                      padding: "6px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.errorBg,
                      cursor: isLoading
                        ? "not-allowed"
                        : "pointer",
                      display: "flex",
                      alignItems: "center",
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    <XCircle
                      size={13}
                      color={C.error}
                    />
                  </button>}

                  {isRejected && <button
                    title="Restore to Review"
                    disabled={isLoading}
                    onClick={() => handleRestoreToReview(job.id)}
                    style={{ padding: "6px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.warningBg, cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", opacity: isLoading ? 0.5 : 1 }}
                  >
                    <RotateCcw size={13} color={C.warning} />
                  </button>}

                  {(isSuspended || isClosed) && <button
                    title={isSuspended ? "Restore & Publish" : "Reopen Job"}
                    disabled={isLoading}
                    onClick={() => handleApprove(job.id)}
                    style={{ padding: "6px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.successBg, cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", opacity: isLoading ? 0.5 : 1 }}
                  >
                    <PlayCircle size={13} color={C.success} />
                  </button>}

                  <Btn
                    v="outline"
                    size="sm"
                    onClick={() => handleView(job.id)}
                  >
                    View
                  </Btn>
                  <button title="Delete permanently" disabled={isLoading} onClick={() => { setDeleteJobTarget(job); setDeleteError(""); }} style={{ padding: "6px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.errorBg, cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", opacity: isLoading ? .5 : 1 }}><Trash2 size={13} color={C.error}/></button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {deleteJobTarget && <div onClick={() => actionLoading === null && setDeleteJobTarget(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(2px)", zIndex: 85, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}><div role="alertdialog" aria-modal="true" onClick={(event) => event.stopPropagation()} style={{ width: 430, maxWidth: "100%", padding: 24, borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 24px 70px rgba(15,23,42,.22)" }}><div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}><div style={{ width: 42, height: 42, borderRadius: 12, background: C.errorBg, color: C.error, display: "grid", placeItems: "center", flexShrink: 0 }}><Trash2 size={19}/></div><div><h2 style={{ margin: "1px 0 6px", fontSize: 18 }}>Delete job listing?</h2><p style={{ margin: 0, color: C.textSec, fontSize: 13, lineHeight: 1.55 }}>You are about to permanently delete <b style={{ color: C.text }}>{deleteJobTarget.title ?? "this job"}</b> from {companyName(deleteJobTarget)}. This action cannot be undone.</p></div></div>{deleteError && <div style={{ display: "flex", gap: 8, marginTop: 16, padding: "10px 12px", borderRadius: 10, background: C.errorBg, color: C.error, fontSize: 12 }}><AlertCircle size={15}/>{deleteError}</div>}<div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 22 }}><Btn v="outline" size="sm" disabled={actionLoading !== null} onClick={() => setDeleteJobTarget(null)}>Cancel</Btn><Btn v="danger" size="sm" disabled={actionLoading !== null} onClick={confirmDeleteJob}>{actionLoading !== null ? "Deleting..." : "Delete permanently"}</Btn></div></div></div>}

      {selectedJob && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSelectedJob(null)}><div style={{ width: 560, maxWidth: "100%", background: C.surface, borderRadius: 16, padding: 24 }} onClick={(event) => event.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 }}><div><h2 style={{ margin: 0, fontSize: 18 }}>{selectedJob.title ?? "Job details"}</h2><p style={{ margin: "5px 0 0", color: C.textSec, fontSize: 13 }}>{selectedJob.company_name ?? selectedJob.company_profile?.company_name ?? selectedJob.company ?? "—"}</p></div><button type="button" onClick={() => setSelectedJob(null)} style={{ background: "none", border: 0, cursor: "pointer", color: C.textSec }}><X size={20} /></button></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}><div><b>Status</b><p>{selectedJob.status ?? "Pending"}</p></div><div><b>Applicants</b><p>{selectedJob.applicants ?? selectedJob.applications_count ?? 0}</p></div><div><b>Category</b><p>{categoryName(selectedJob)}</p></div><div><b>Employment type</b><p>{selectedJob.type ?? selectedJob.employment_type ?? "—"}</p></div><div style={{ gridColumn: "1 / -1" }}><b>Experience requirement</b><p>{formatExperienceRange(selectedJob.min_experience_years, selectedJob.max_experience_years)}</p></div></div></div></div>}
    </div>
  );
}
