import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { C, F } from "../../constants/tokens";
import { fetchJob, saveJob, unsaveJob, applyToJob, withdrawJobApplication, checkJobApplied, UiJob } from "../../imports/jobs";
import { Btn, SBadge } from "../../components/ui";
import { ArrowLeft, MapPin, DollarSign, Clock, Users, Heart, CheckCircle2, AlertCircle, FileText } from "lucide-react";

export default function JobDetails() {
  const nav = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState<UiJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applied, setApplied] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    fetchJob(id)
      .then((j) => {
        setJob(j);
        return checkJobApplied(id);
      })
      .then((isApplied) => setApplied(isApplied))
      .catch(() => setError("Failed to load job details"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleToggleSave() {
    if (!job || saving) return;
    setSaving(true);
    const nextSaved = !job.saved;
    setJob({ ...job, saved: nextSaved });
    try {
      if (nextSaved) {
        await saveJob(job.id);
      } else {
        await unsaveJob(job.id);
      }
    } catch {
      setJob({ ...job, saved: !nextSaved });
    } finally {
      setSaving(false);
    }
  }

  async function handleApply() {
    if (!job || applying) return;
    setApplyError("");
    setApplying(true);
    try {
      await applyToJob(job.id);
      setApplied(true);
    } catch (error: any) {
      setApplyError(
        error?.response?.data?.message ||
        Object.values(error?.response?.data?.errors || {}).flat().join(" ") ||
        "Unable to submit your application. Please try again."
      );
    } finally {
      setApplying(false);
    }
  }

  async function handleConfirmWithdraw() {
    if (!job || applying) return;
    setShowWithdrawModal(false);
    setApplying(true);
    try {
      await withdrawJobApplication(job.id);
      setApplied(false);
    } catch (error) {
      console.error(error);
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return <div style={{ fontFamily: F, color: C.textMuted, padding: 40, textAlign: "center" }}>Loading...</div>;
  }

  if (error || !job) {
    return <div style={{ fontFamily: F, color: C.textMuted, padding: 40, textAlign: "center" }}>{error || "Job not found"}</div>;
  }

  const activeColor = job.color || C.accent || "#7c3aed";

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <Btn v="ghost" icon={ArrowLeft} onClick={() => nav("/student/jobs")} style={{ marginBottom: 20 }}>Back to Jobs</Btn>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        <div>
          <div style={{ background: C.surface, borderRadius: 24, padding: 32, border: `1px solid ${C.border}`, marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: `${activeColor}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: activeColor }}>{job.company[0]}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>{job.title}</h1>
                <p style={{ color: C.textSec, margin: "0 0 10px", fontSize: 14 }}>{job.company} · {job.dept}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <SBadge s={job.status} />
                  <span style={{ padding: "3px 10px", background: C.divider, borderRadius: 99, fontSize: 12, color: C.textSec }}>{job.type}</span>
                  <span style={{ padding: "3px 10px", background: C.divider, borderRadius: 99, fontSize: 12, color: C.textSec }}>{job.mode}</span>
                  <span style={{ padding: "3px 10px", background: C.divider, borderRadius: 99, fontSize: 12, color: C.textSec }}>{job.level}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {applied ? (
                <Btn v="danger" onClick={() => setShowWithdrawModal(true)} style={{ flex: 1 }}>
                  {applying ? "Withdrawing..." : "Withdraw Application"}
                </Btn>
              ) : (
                <Btn v="primary" onClick={handleApply} style={{ flex: 1 }}>
                  {applying ? "Applying..." : "Apply Now"}
                </Btn>
              )}
              <Btn 
                v={job.saved ? "secondary" : "outline"} 
                icon={(props) => (
                  <Heart 
                    {...props} 
                    fill={job.saved ? C.accent : "none"} 
                    color={job.saved ? C.accent : props.color} 
                  />
                )} 
                onClick={handleToggleSave} 
                style={{ opacity: saving ? 0.6 : 1, transition: "all 0.2s ease" }}
              >
                {job.saved ? "Saved" : "Save"}
              </Btn>
            </div>
            {applyError && (
              <div
                role="alert"
                style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${C.warning}35`,
                  background: C.warningBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                  <AlertCircle size={17} color={C.warning} style={{ flexShrink: 0 }} />
                  <span style={{ color: C.text, fontSize: 12.5, fontWeight: 600, lineHeight: 1.5 }}>
                    {applyError}
                  </span>
                </div>
                {applyError.toLowerCase().includes("resume") && (
                  <button
                    type="button"
                    onClick={() => {
                      const returnTo = `/student/jobs/${job.id}`;
                      sessionStorage.setItem("cb_resume_return_to", returnTo);
                      nav("/student/resume", { state: { returnTo } });
                    }}
                    style={{
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 10px",
                      borderRadius: 9,
                      border: `1px solid ${C.warning}45`,
                      background: C.surface,
                      color: C.warning,
                      fontFamily: F,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <FileText size={14} /> Create Resume
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ background: C.surface, borderRadius: 24, padding: 32, border: `1px solid ${C.border}`, marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 4, height: 18, background: activeColor, borderRadius: 2 }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.text }}>About the Role</h2>
            </div>
            <p style={{ color: C.textSec, fontSize: 15, lineHeight: 1.8, margin: 0, letterSpacing: "-0.01em" }}>
              {job.description ||
                `We're looking for a ${job.title} to join our ${job.dept} team at ${job.company}. You'll be working on high-impact projects that shape how millions of users interact with our platform. This is an excellent opportunity for someone who thrives in a fast-paced, collaborative environment and is passionate about building exceptional products.`}
            </p>
          </div>

          {job.responsibilities?.trim() && <div style={{ background: C.surface, borderRadius: 24, padding: 32, border: `1px solid ${C.border}`, marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 4, height: 18, background: activeColor, borderRadius: 2 }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.text }}>Key Responsibilities</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {job.responsibilities.split(/\r?\n|,/).filter((r) => r.trim()).map((r, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <CheckCircle2 size={16} color={activeColor} style={{ marginTop: 3, flexShrink: 0, opacity: 0.8 }} />
                  <span style={{ fontSize: 14.5, color: C.textSec, lineHeight: 1.5 }}>{r.trim()}</span>
                </div>
              ))}
            </div>
          </div>}

          {job.requirements?.trim() && <div style={{ background: C.surface, borderRadius: 24, padding: 32, border: `1px solid ${C.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 4, height: 18, background: activeColor, borderRadius: 2 }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.text }}>Candidate Requirements</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {job.requirements.split(/\r?\n|,/).filter((r) => r.trim()).map((r, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.textMuted, marginTop: 8, flexShrink: 0 }} />
                  <span style={{ fontSize: 14.5, color: C.textSec, lineHeight: 1.5 }}>{r.trim()}</span>
                </div>
              ))}
            </div>
          </div>}
        </div>

        <div>
          <div style={{ background: C.surface, borderRadius: 20, padding: 20, border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>Job Details</h3>
            {[
              { icon: DollarSign, label: "Salary", value: job.salary },
              { icon: MapPin, label: "Location", value: job.location },
              { icon: Clock, label: "Posted", value: job.posted },
              { icon: Users, label: "Applicants", value: `${job.applicants} applied` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={14} color={C.accent} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: C.textMuted, fontWeight: 500 }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: C.surface, borderRadius: 20, padding: 20, border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Required Skills</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {job.tags.map(t => (
                <span key={t} style={{ padding: "6px 12px", background: C.accentLight, color: C.accentHover, borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showWithdrawModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div style={{ background: C.surface, padding: 28, borderRadius: 20, width: 380, textAlign: "center", border: `1px solid ${C.border}`, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 18, fontWeight: 700, color: C.text }}>Withdraw Application</h3>
            <p style={{ color: C.textSec, fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>Are you sure you want to withdraw your application? This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <Btn v="outline" onClick={() => setShowWithdrawModal(false)} style={{ flex: 1 }}>Cancel</Btn>
              <Btn v="danger" onClick={handleConfirmWithdraw} style={{ flex: 1 }}>Withdraw</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
