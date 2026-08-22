import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { Btn, SBadge } from "../../components/ui";
import { Search, Plus, Edit2, Trash2, Briefcase, AlertTriangle, X, AlertCircle } from "lucide-react";
import { getCompanyJobs, deleteJob } from "../../imports/api";

const STATUSES = ["All", "Published", "Draft", "Closed"];

export default function ManageJobs() {
  const nav = useNavigate();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; jobId: number | null }>({
    open: false,
    jobId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadJobs = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setLoadError("");
      const data = await getCompanyJobs();
      const list = Array.isArray(data)
        ? data
        : data?.jobs ?? data?.data ?? [];
      setJobs(list);
    } catch (e: any) {
      console.error(e);
      setLoadError(
        e?.response?.data?.message ||
        "Failed to load your job listings."
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    const refresh = () => loadJobs(false);
    const interval = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const openDeleteModal = (id: number) => {
    setErrorMessage(null);
    setDeleteModal({ open: true, jobId: id });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, jobId: null });
    setIsDeleting(false);
    setErrorMessage(null);
  };

  const confirmDelete = async () => {
    if (!deleteModal.jobId) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await deleteJob(deleteModal.jobId);

      setJobs((prev) => prev.filter((job) => job.id !== deleteModal.jobId));
      closeDeleteModal();
    } catch (e: any) {
      setIsDeleting(false);
      const msg = e.response?.data?.message || "Failed to delete job listing.";
      setErrorMessage(msg);
    }
  };

  const filtered = jobs.filter((j) => {
    const q = query.trim().toLowerCase();

    const title = String(j.title || "").toLowerCase();
    const dept = String(j.dept || "").toLowerCase();
    const type = String(j.type || "").toLowerCase();

    const matchQ =
      q === "" ||
      title.includes(q) ||
      dept.includes(q) ||
      type.includes(q);

    const matchS =
      filter === "All" ||
      filter === j.status ||
      (filter === "Published" && j.status === "Open");

    return matchQ && matchS;
  });

  return (
    <div style={{ fontFamily: F, color: C.text, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Manage Jobs</h1>
          <p style={{ color: C.textSec, fontSize: 14, marginTop: 6 }}>View and manage your job listings</p>
        </div>
        <Btn v="primary" icon={Plus} onClick={() => nav("/company/jobs/create")}>Post New Job</Btn>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total", val: jobs.length },
          { label: "Published", val: jobs.filter(j => j.status === "Open").length },
          { label: "Applicants", val: jobs.reduce((acc, curr) => acc + (curr.applicants || 0), 0) }
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, borderRadius: 14, padding: "14px 20px", border: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 22, fontWeight: 700 }}>{s.val}</span>
            <span style={{ fontSize: 13, color: C.textSec }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted }} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            placeholder="Search jobs…"
            style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: 10, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 13, background: C.surface, boxSizing: "border-box" }}
          />
        </div>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${filter === s ? C.accent : C.border}`, background: filter === s ? C.accentLight : C.surface, color: filter === s ? C.accentHover : C.textSec, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 56, textAlign: "center", background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, color: C.textSec, fontSize: 14 }}>
          Loading your jobs...
        </div>
      ) : loadError ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: 40, background: C.errorBg, color: C.error, borderRadius: 16, border: `1px solid ${C.error}25`, fontSize: 13, fontWeight: 600 }}>
          <AlertCircle size={18} /> {loadError}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "56px 20px",
          background: C.surface,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          textAlign: "center"
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `${C.textMuted}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16
          }}>
            <Briefcase size={24} style={{ color: C.textMuted }} />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.text }}>No jobs found</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.textSec }}>There are no job listings matching your criteria.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {filtered.map(job => (
            <div key={job.id} style={{ background: C.surface, borderRadius: 18, padding: 20, border: `1px solid ${C.border}`, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)"; e.currentTarget.style.borderColor = C.accent; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = C.border; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${job.color || C.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: job.color || C.accent }}>{(job.company || "C")[0]}</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{job.title}</p>
                    <p style={{ margin: 0, fontSize: 12, color: C.textSec }}>{job.dept} · {job.type}</p>
                  </div>
                </div>
                <SBadge s={job.status} />      
              </div>
              {["rejected", "changes requested"].includes(String(job.status || "").toLowerCase()) && job.moderation_note && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", marginBottom: 13, borderRadius: 10, background: String(job.status).toLowerCase() === "rejected" ? C.errorBg : C.warningBg, color: String(job.status).toLowerCase() === "rejected" ? C.error : C.warning, fontSize: 12, lineHeight: 1.5 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span><strong>Admin note:</strong> {job.moderation_note}</span>
                </div>
              )}
              <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: C.textSec }}>{job.applicants ?? 0} applicants</span>
                <span style={{ fontSize: 12, color: C.textSec }}>{job.views ?? 0} views</span>
                <span style={{ fontSize: 12, color: C.textSec }}>Posted {job.posted}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn v="primary" size="sm" onClick={() => nav(`/company/jobs/${job.id}`)}>View</Btn>
                <Btn v="outline" size="sm" icon={Edit2} onClick={() => nav(`/company/jobs/edit/${job.id}`)}>Edit</Btn>
                <Btn v="ghost" size="sm" icon={Trash2} onClick={() => openDeleteModal(job.id)}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteModal.open && (
        <div 
          onClick={closeDeleteModal}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.surface,
              width: "100%",
              maxWidth: 420,
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              border: `1px solid ${C.border}`,
              position: "relative"
            }}
          >
            <button
              onClick={closeDeleteModal}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: C.textMuted,
                padding: 4
              }}
            >
              <X size={18} />
            </button>

            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "#FEE2E2",
              color: "#EF4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16
            }}>
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: C.text }}>
              Delete Job Listing?
            </h3>
            
            <p style={{ margin: "0 0 16px", fontSize: 14, color: C.textSec, lineHeight: 1.5 }}>
              Are you sure you want to delete this job posting? This action cannot be undone.
            </p>

            {/* كارت عرض الخطأ البصري */}
            {errorMessage && (
              <div style={{
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                marginBottom: 20
              }}>
                <AlertCircle size={18} style={{ color: "#EF4444", flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: "#991B1B", fontWeight: 500, lineHeight: 1.4 }}>
                  {errorMessage}
                </span>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: "transparent",
                  color: C.text,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: F
                }}
              >
                {errorMessage ? "Close" : "Cancel"}
              </button>
              
              {!errorMessage && (
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "none",
                    background: "#EF4444",
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    fontFamily: F,
                    opacity: isDeleting ? 0.7 : 1
                  }}
                >
                  {isDeleting ? "Deleting..." : "Delete Job"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
