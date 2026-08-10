import { useState } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import { ArrowLeft, Save, Sparkles, Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import api, { generateJobDescription } from "../../imports/api";

export default function CreateJob() {
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    dept: "",
    type: "Full-Time",
    level: "Entry",
    workMode: "Remote",
    location: "",
    salary: "",
    deadline: "",
    description: "",
    skills: [] as string[],
    benefits: [] as string[],
  });

  const [skillInput, setSkillInput] = useState("");

  const availableBenefits = [
    "Health Insurance",
    "Transportation Allowance",
    "Remote Work / Hybrid",
    "Training & Development",
    "Paid Annual Leave",
    "Performance Bonus",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleBenefitToggle = (benefit: string) => {
    const exists = formData.benefits.includes(benefit);

    setFormData({
      ...formData,
      benefits: exists
        ? formData.benefits.filter((b) => b !== benefit)
        : [...formData.benefits, benefit],
    });
  };

  const handleAiGenerate = async () => {
    if (!formData.title.trim()) {
      setError("Please enter a job title first.");
      return;
    }

    setGeneratingAi(true);
    setError(null);
    setNotification(null);

    try {
      const res = await generateJobDescription({
        title: formData.title.trim(),
        department: formData.dept.trim(),
        level: formData.level,
        work_mode: formData.workMode,
        skills: formData.skills,
      });

      if (res?.description) {
        setFormData((prev) => ({
          ...prev,
          description: res.description,
        }));

        setNotification({
          type: "success",
          message: "Job description generated successfully with AI ✨",
        });
      } else {
        setError("AI returned an empty description.");
      }
    } catch (e: any) {
      console.error(
        "AI Generate Error:",
        e.response?.data || e
      );

      setError(
        e.response?.data?.message ||
        "Failed to generate job description. Please try again."
      );
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotification(null);

    const payload = {
      title: formData.title,
      department: formData.dept,
      employment_type: formData.type,
      level: formData.level,
      work_mode: formData.workMode,
      location: formData.location,
      salary: formData.salary
        ? Number(String(formData.salary).replace(/[^\d.]/g, ""))
        : null,
      deadline: formData.deadline || null,
      description: formData.description,
      skills: formData.skills,
      benefits: formData.benefits,
    };

    try {
      await api.post("/company/jobs", payload);

      setNotification({
        type: "success",
        message: "Job position created successfully!",
      });

      setTimeout(() => {
        nav("/company/jobs");
      }, 1500);
    } catch (error: any) {
      console.log("Create job error:", error.response?.data);
      console.log("Validation errors:", error.response?.data?.errors);

      setError(
        error?.response?.data?.message ||
        Object.values(error?.response?.data?.errors || {}).flat().join(" ") ||
        "Failed to publish the job. Please check the entered information."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: F, color: C.text, maxWidth: 840, margin: "0 auto", paddingBottom: 40, position: "relative" }}>
      {(notification || error) && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 20px",
            borderRadius: 12,
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
            background: notification?.type === "success" ? "#ECFDF5" : "#FEF2F2",
            border: `1px solid ${notification?.type === "success" ? "#A7F3D0" : "#FCA5A5"}`,
            color: notification?.type === "success" ? "#065F46" : "#991B1B",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {notification?.type === "success" ? (
            <CheckCircle2 size={20} color="#10B981" />
          ) : (
            <AlertCircle size={20} color="#EF4444" />
          )}
          <span>{notification?.message || error}</span>
          <button
            type="button"
            onClick={() => {
              setNotification(null);
              setError(null);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              marginLeft: 8,
              color: "inherit",
              display: "flex",
              alignItems: "center",
              opacity: 0.7,
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => nav("/company/jobs")}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 8,
              cursor: "pointer",
              color: C.text,
              display: "flex",
              alignItems: "center",
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Create Job Listing</h1>
            <p style={{ color: C.textSec, fontSize: 13, marginTop: 4, margin: 0 }}>
              Fill in the details below to publish a new job position
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>Basic Info</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Job Title</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Senior Product Designer"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 14, background: C.surface, color: C.text, boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Department</label>
              <input
                name="dept"
                value={formData.dept}
                onChange={handleChange}
                placeholder="e.g. Engineering"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 14, background: C.surface, color: C.text, boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Job Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 14, background: C.surface, color: C.text, boxSizing: "border-box" }}
              >
                <option value="Full-Time">Full-time</option>
                <option value="Part-Time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Level</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 14, background: C.surface, color: C.text, boxSizing: "border-box" }}
              >
                <option value="Entry">Entry</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Work Mode</label>
              <select
                name="workMode"
                value={formData.workMode}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 14, background: C.surface, color: C.text, boxSizing: "border-box" }}
              >
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </div>

        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              marginTop: 0,
              marginBottom: 16,
            }}
          >
            Location & Salary
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                Location
              </label>

              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ramallah, Palestine"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontFamily: F,
                  fontSize: 14,
                  background: C.surface,
                  color: C.text,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                Salary
              </label>

              <input
                name="salary"
                type="number"
                min="0"
                value={formData.salary}
                onChange={handleChange}
                placeholder="e.g. 1200"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontFamily: F,
                  fontSize: 14,
                  background: C.surface,
                  color: C.text,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                Deadline
              </label>

              <input
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
                required
                min={new Date().toISOString().split("T")[0]}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontFamily: F,
                  fontSize: 14,
                  background: C.surface,
                  color: C.text,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Job Description</h3>
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={generatingAi}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Sparkles size={14} /> {generatingAi ? "Generating..." : "AI Generate"}
            </button>
          </div>

          <textarea
            name="description"
            rows={5}
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the role, expectations, and what success looks like..."
            style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 14, background: C.surface, color: C.text, boxSizing: "border-box", resize: "vertical" }}
          />
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>Required Skills</h3>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {formData.skills.map((skill) => (
              <span
                key={skill}
                style={{ background: String(C.accent) + "18", color: C.accent, padding: "4px 10px", borderRadius: 20, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
              >
                {skill}
                <X size={14} style={{ cursor: "pointer" }} onClick={() => handleRemoveSkill(skill)} />
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Add a skill..."
              style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 14, background: C.surface, color: C.text, boxSizing: "border-box" }}
            />
            <button
              type="button"
              onClick={handleAddSkill}
              style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "0 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>Benefits</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {availableBenefits.map((benefit) => {
              const isChecked = formData.benefits.includes(benefit);

              return (
                <label key={benefit} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleBenefitToggle(benefit)}
                    style={{ accentColor: C.accent }}
                  />
                  {benefit}
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
          <Btn v="ghost" type="button" onClick={() => nav("/company/jobs")}>
            Cancel
          </Btn>
          <Btn v="primary" type="submit" icon={Save} disabled={submitting}>
            {submitting ? "Publishing..." : "Publish Job"}
          </Btn>
        </div>
      </form>
    </div>
  );
}