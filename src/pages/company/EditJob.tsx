import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import { ArrowLeft, Save, Sparkles, Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { getCompanyJobForEdit, updateJob, generateJobDescription, getJobCategories } from "../../imports/api";
import { EnglishDatePicker } from "../../components/shared/EnglishDatePicker";
import { isExperienceYears, numberOrNull } from "../../utils/numbers";

export default function EditJob() {
  const { id } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState<"Draft" | "Open" | "Closed" | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [originalStatus, setOriginalStatus] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);

  const [formData, setFormData] = useState({
    title: "",
    categoryId: "",
    type: "Full-Time",
    level: "Entry",
    workMode: "Remote",
    minExperienceYears: "",
    maxExperienceYears: "",
    location: "",
    salary: "",
    deadline: "",
    description: "",
    responsibilities: "",
    requirements: "",
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

  useEffect(() => {
    void getJobCategories().then((response: any) => {
      const data = response?.data ?? response;
      setCategories(Array.isArray(data) ? data : data?.categories ?? data?.data ?? []);
    }).catch(() => setNotification({ type: "error", message: "Could not load job categories." }));
  }, []);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        if (!id) {
          throw new Error("Missing job id");
        }

        const response: any = await getCompanyJobForEdit(id);
        const currentJob = response?.data?.job ?? response?.job;

        if (currentJob) {
          setJob(currentJob);
          setOriginalStatus(currentJob.status || "");
          setFormData({
            title: currentJob.title || "",
            categoryId: String(currentJob.category_id ?? currentJob.category?.id ?? ""),
            type: currentJob.type || currentJob.employment_type || "Full-Time",
            level: currentJob.level || "Entry",
            workMode: currentJob.mode || currentJob.workMode || currentJob.work_mode || "Remote",
            minExperienceYears: currentJob.min_experience_years == null ? "" : String(currentJob.min_experience_years),
            maxExperienceYears: currentJob.max_experience_years == null ? "" : String(currentJob.max_experience_years),
            location: currentJob.location || "",
            salary: currentJob.salary?.toString() || "",
            deadline: currentJob.deadline || "",
            description: currentJob.description || "",
            responsibilities: currentJob.responsibilities || "",
            requirements: currentJob.requirements || "",
            skills: Array.isArray(currentJob.skills) ? currentJob.skills : [],
            benefits: Array.isArray(currentJob.benefits) ? currentJob.benefits : [],
          });
        } else {
          throw new Error("Job was not returned by the server");
        }
      } catch (e: any) {
        setNotification({
          type: "error",
          message: e?.response?.data?.message || "Could not load the job details.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleExperienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arabic = "٠١٢٣٤٥٦٧٨٩";
    const persian = "۰۱۲۳۴۵۶۷۸۹";
    const value = e.target.value.replace(/[٠-٩]/g, d => String(arabic.indexOf(d))).replace(/[۰-۹]/g, d => String(persian.indexOf(d))).replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    setFormData(current => ({ ...current, [e.target.name]: value }));
  };

  const handleEnglishDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arabic = "٠١٢٣٤٥٦٧٨٩";
    const persian = "۰۱۲۳۴۵۶۷۸۹";
    const value = e.target.value.replace(/[٠-٩]/g, d => String(arabic.indexOf(d))).replace(/[۰-۹]/g, d => String(persian.indexOf(d))).replace(/[^0-9-]/g, "").slice(0, 10);
    setFormData(current => ({ ...current, deadline: value }));
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
    if (!formData.title) return;

    setGeneratingAi(true);

    try {
      const res = await generateJobDescription({
        title: formData.title,
        department: categories.find((category) => String(category.id) === formData.categoryId)?.name ?? "",
        level: formData.level,
        work_mode: formData.workMode,
        skills: formData.skills,
        description: formData.description,
      });

      if (res?.description) {
        setFormData((prev) => ({
          ...prev,
          description: res.description,
        }));
      }
    } catch (e: any) {
      console.error("AI description error:", e?.response?.data || e);
      setNotification({
        type: "error",
        message: e?.response?.data?.message || "Failed to generate job description. Please try again.",
      });
    } finally {
      setGeneratingAi(false);
    }
  };

  const submitJob = async (status?: "Draft" | "Open" | "Closed") => {
    if (formData.deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(formData.deadline) || Number.isNaN(new Date(`${formData.deadline}T00:00:00`).getTime()))) {
      setNotification({ type: "error", message: "Please enter the deadline in YYYY-MM-DD format." });
      return;
    }
    const minExperience = numberOrNull(formData.minExperienceYears);
    const maxExperience = numberOrNull(formData.maxExperienceYears);
    if (!isExperienceYears(minExperience) || !isExperienceYears(maxExperience)) {
      setNotification({ type: "error", message: "Experience years must be between 0 and 60" });
      return;
    }
    if (minExperience !== null && maxExperience !== null && maxExperience < minExperience) {
      setNotification({ type: "error", message: "Maximum experience must be greater than or equal to minimum experience" });
      return;
    }
    setSubmitting(true);
    setSubmittingStatus(status ?? "Open");
    setNotification(null);

    const salaryValue = formData.salary;

    const payload = {
      title: formData.title,
      category_id: Number(formData.categoryId),
      employment_type: formData.type,
      level: formData.level,
      work_mode: formData.workMode,
      min_experience_years: minExperience,
      max_experience_years: maxExperience,
      location: formData.location,
      salary: salaryValue ? Number(salaryValue.replace(/[^\d.]/g, "")) : null,
      deadline: formData.deadline,
      description: formData.description,
      responsibilities: formData.responsibilities,
      requirements: formData.requirements,
      skills: formData.skills,
      benefits: formData.benefits,
      ...(status ? { status } : {}),
    };

    try {
      const response = id ? await updateJob(id, payload) : null;
      const updatedJob = response?.data?.job ?? response?.job;

      if (updatedJob) {
        setJob(updatedJob);
        setOriginalStatus(updatedJob.status || status || originalStatus);
      }

      setNotification({
        type: "success",
        message: response?.message || (status === "Draft"
          ? "Job saved as draft successfully."
          : status === "Closed"
          ? "Job closed successfully."
          : originalStatus.toLowerCase() === "rejected"
          ? "Job resubmitted successfully!"
          : "Job position updated successfully!"),
      });

      setTimeout(() => {
        nav("/company/jobs");
      }, 1500);
    } catch (e: any) {
      console.log(e);
      setNotification({
        type: "error",
        message:
          e?.response?.data?.message ||
          Object.values(e?.response?.data?.errors || {}).flat().join(" ") ||
          "Failed to update job. Please try again.",
      });
    } finally {
      setSubmitting(false);
      setSubmittingStatus(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitJob();
  };

  if (loading) {
    return (
      <div style={{ fontFamily: F, color: C.text, padding: 40, textAlign: "center" }}>
        Loading job details...
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: F,
        color: C.text,
        maxWidth: 840,
        margin: "0 auto",
        paddingBottom: 40,
        position: "relative",
      }}
    >
      {notification && (
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
            background: notification.type === "success" ? "#ECFDF5" : "#FEF2F2",
            border: `1px solid ${
              notification.type === "success" ? "#A7F3D0" : "#FCA5A5"
            }`,
            color: notification.type === "success" ? "#065F46" : "#991B1B",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={20} color="#10B981" />
          ) : (
            <AlertCircle size={20} color="#EF4444" />
          )}

          <span>{notification.message}</span>

          <button
            type="button"
            onClick={() => setNotification(null)}
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
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
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              Edit Job Listing
            </h1>
            <p
              style={{
                color: C.textSec,
                fontSize: 13,
                marginTop: 4,
                margin: 0,
              }}
            >
              Update the details below to edit your job posting
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 20 }}
      >
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
            Basic Info
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
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
                Job Title
              </label>

              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Senior Product Designer"
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
                Category
              </label>

              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
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
              >
                <option value="">Select a category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
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
                Job Type
              </label>

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
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
              >
                <option value="Full-Time">Full-time</option>
                <option value="Part-Time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
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
                Level
              </label>

              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
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
              >
                <option value="Entry">Entry</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
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
                Work Mode
              </label>

              <select
                name="workMode"
                value={formData.workMode}
                onChange={handleChange}
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
              >
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "nowrap" }}><div><label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Min Experience</label><input lang="en-US" dir="ltr" inputMode="decimal" type="text" name="minExperienceYears" value={formData.minExperienceYears} onChange={handleExperienceChange} placeholder="Years" style={{ width: 120, padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 13, boxSizing: "border-box", direction: "ltr" }}/></div><div><label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Max Experience</label><input lang="en-US" dir="ltr" inputMode="decimal" type="text" name="maxExperienceYears" value={formData.maxExperienceYears} onChange={handleExperienceChange} placeholder="Years" style={{ width: 120, padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 13, boxSizing: "border-box", direction: "ltr" }}/></div></div>
          </div>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>Key Responsibilities</h3>
          <p style={{ margin: "0 0 12px", color: C.textSec, fontSize: 12 }}>Enter each responsibility on a separate line.</p>
          <textarea
            name="responsibilities"
            rows={5}
            value={formData.responsibilities}
            onChange={handleChange}
            placeholder={"Create wireframes and prototypes\nCollaborate with developers\nConduct usability testing"}
            style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 14, background: C.surface, color: C.text, boxSizing: "border-box", resize: "vertical" }}
          />
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>Candidate Requirements</h3>
          <p style={{ margin: "0 0 12px", color: C.textSec, fontSize: 12 }}>Qualifications and experience required from the candidate, one per line.</p>
          <textarea
            name="requirements"
            rows={5}
            value={formData.requirements}
            onChange={handleChange}
            placeholder={"Bachelor's degree or equivalent experience\n1+ year of relevant experience\nStrong communication skills"}
            style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${C.border}`, fontFamily: F, fontSize: 14, background: C.surface, color: C.text, boxSizing: "border-box", resize: "vertical" }}
          />
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
            Location & Details
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
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
                value={formData.salary}
                onChange={handleChange}
                placeholder="1000"
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

              <EnglishDatePicker value={formData.deadline} onChange={(deadline) => setFormData((current) => ({ ...current, deadline }))} />
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
              Job Description
            </h3>

            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={generatingAi}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: C.accent,
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Sparkles size={14} />
              {generatingAi ? (formData.description.trim() ? "Improving..." : "Generating...") : (formData.description.trim() ? "Improve with AI" : "Generate with AI")}
            </button>
          </div>

          <textarea
            name="description"
            rows={5}
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the role, expectations, and what success looks like..."
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontFamily: F,
              fontSize: 14,
              background: C.surface,
              color: C.text,
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
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
            Required Skills
          </h3>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {formData.skills.map((skill) => (
              <span
                key={skill}
                style={{
                  background: String(C.accent) + "18",
                  color: C.accent,
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {skill}
                <X
                  size={14}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleRemoveSkill(skill)}
                />
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Add a skill..."
              style={{
                flex: 1,
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

            <button
              type="button"
              onClick={handleAddSkill}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                padding: "0 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Plus size={16} />
              Add
            </button>
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
            Benefits
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            {availableBenefits.map((benefit) => {
              const isChecked = formData.benefits.includes(benefit);

              return (
                <label
                  key={benefit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
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

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 10,
          }}
        >
          <Btn v="ghost" type="button" onClick={() => nav("/company/jobs")}>
            Cancel
          </Btn>

          <Btn
            v="outline"
            type="button"
            icon={Save}
            disabled={submitting}
            onClick={() => void submitJob("Draft")}
          >
            {submittingStatus === "Draft" ? "Saving..." : "Save as Draft"}
          </Btn>

          {String(job?.status ?? originalStatus).toLowerCase() === "open" && (
            <Btn
              v="outline"
              type="button"
              disabled={submitting}
              onClick={() => void submitJob("Closed")}
            >
              {submittingStatus === "Closed" ? "Closing..." : "Close Job"}
            </Btn>
          )}

          <Btn v="primary" type="submit" icon={Save} disabled={submitting}>
            {originalStatus.toLowerCase() === "rejected"
              ? (submittingStatus === "Open" ? "Resubmitting..." : "Resubmit Job")
              : (submittingStatus === "Open" ? "Saving..." : "Save Changes")}
          </Btn>
        </div>
      </form>
    </div>
  );
}
