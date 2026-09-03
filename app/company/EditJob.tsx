import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import { C, F } from "../../constants/tokens";
import {
  getCompanyJobForEdit,
  updateJob,
  generateJobDescription,
} from "../../imports/api";

export default function EditJob() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    dept: "",
    type: "Full-Time",
    level: "Entry",
    workMode: "Remote",
    location: "",
    salary: "",
    minExperienceYears: "",
    maxExperienceYears: "",
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

  const jobTypes = [
    "Full-Time",
    "Part-Time",
    "Internship",
    "Contract",
  ];

  const levels = [
    "Entry",
    "Mid",
    "Senior",
    "Lead",
  ];

  const workModes = [
    "Remote",
    "On-site",
    "Hybrid",
  ];

  // =========================
  // Load Job
  // =========================

  useEffect(() => {
    const fetchJob = async () => {
      try {
        if (!id) return;
        const response = await getCompanyJobForEdit(id);
        const currentJob = response?.job ?? response;

        if (currentJob) {
          setFormData({
            title: currentJob.title || "",

            dept:
              currentJob.dept ||
              currentJob.department ||
              "",

            type:
              currentJob.type ||
              currentJob.employment_type ||
              "Full-Time",

            level: currentJob.level || "Entry",

            workMode:
              currentJob.mode ||
              currentJob.workMode ||
              currentJob.work_mode ||
              "Remote",

            location: currentJob.location || "",

            salary:
              currentJob.salary !== null &&
              currentJob.salary !== undefined
                ? String(currentJob.salary)
                : "",

            minExperienceYears:
              currentJob.min_experience_years == null ? "" : String(currentJob.min_experience_years),

            maxExperienceYears:
              currentJob.max_experience_years == null ? "" : String(currentJob.max_experience_years),

            deadline: currentJob.deadline || "",

            description:
              currentJob.description || "",

            responsibilities:
              currentJob.responsibilities || response?.responsibilities || "",

            requirements:
              currentJob.requirements || response?.requirements || "",

            skills:
              Array.isArray(currentJob.skills)
                ? currentJob.skills
                : [],

            benefits:
              Array.isArray(currentJob.benefits)
                ? currentJob.benefits
                : [],
          });
        }
      } catch (e) {
        console.log("Load job error:", e);

        setNotification({
          type: "error",
          message: "Failed to load job details.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJob();
    }
  }, [id]);

  // =========================
  // Handle Change
  // =========================

  const updateField = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================
  // Skills
  // =========================

  const handleAddSkill = () => {
    const skill = skillInput.trim();

    if (!skill) return;

    if (formData.skills.includes(skill)) {
      setSkillInput("");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, skill],
    }));

    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter(
        (skill) => skill !== skillToRemove
      ),
    }));
  };

  // =========================
  // Benefits
  // =========================

  const handleBenefitToggle = (benefit: string) => {
    const exists = formData.benefits.includes(benefit);

    setFormData((prev) => ({
      ...prev,

      benefits: exists
        ? prev.benefits.filter(
            (item) => item !== benefit
          )
        : [...prev.benefits, benefit],
    }));
  };

  // =========================
  // AI Generate
  // =========================

  const handleAiGenerate = async () => {
    if (!formData.title.trim()) {
      setNotification({
        type: "error",
        message: "Please enter a job title first.",
      });

      return;
    }

    setGeneratingAi(true);
    setNotification(null);

    try {
      const res = await generateJobDescription({
        title: formData.title.trim(),
        department: formData.dept.trim(),
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

        setNotification({
          type: "success",
          message: "Job description generated successfully.",
        });
      } else {
        setNotification({
          type: "error",
          message: "AI returned an empty description.",
        });
      }
    } catch (e: any) {
      console.log("AI Generate Error:", e);

      setNotification({
        type: "error",
        message:
          e?.response?.data?.message ||
          "Failed to generate job description.",
      });
    } finally {
      setGeneratingAi(false);
    }
  };

  // =========================
  // Date
  // =========================

  const getDateValue = () => {
    if (formData.deadline) {
      const date = new Date(formData.deadline);

      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return new Date();
  };

  const handleDateChange = (
    event: any,
    selectedDate?: Date
  ) => {
    setShowDatePicker(false);

    if (!selectedDate) return;

    const year = selectedDate.getFullYear();
    const month = String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      selectedDate.getDate()
    ).padStart(2, "0");

    updateField(
      "deadline",
      `${year}-${month}-${day}`
    );
  };

  // =========================
  // Submit
  // =========================

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setNotification({
        type: "error",
        message: "Job title is required.",
      });

      return;
    }

    if (!formData.deadline) {
      setNotification({
        type: "error",
        message: "Please select a deadline.",
      });

      return;
    }

    const minExperience = formData.minExperienceYears.trim() === "" ? null : Number(formData.minExperienceYears);
    const maxExperience = formData.maxExperienceYears.trim() === "" ? null : Number(formData.maxExperienceYears);

    if (
      (minExperience !== null && (!Number.isFinite(minExperience) || minExperience < 0 || minExperience > 60)) ||
      (maxExperience !== null && (!Number.isFinite(maxExperience) || maxExperience < 0 || maxExperience > 60))
    ) {
      setNotification({ type: "error", message: "Experience must be between 0 and 60 years." });
      return;
    }

    if (minExperience !== null && maxExperience !== null && maxExperience < minExperience) {
      setNotification({ type: "error", message: "Maximum experience must be greater than or equal to minimum experience." });
      return;
    }

    setSubmitting(true);
    setNotification(null);

    const salaryValue = formData.salary;

    const payload = {
      title: formData.title,

      department: formData.dept,

      employment_type: formData.type,

      level: formData.level,

      work_mode: formData.workMode,

      location: formData.location,

      salary: salaryValue
        ? Number(
            salaryValue.replace(/[^\d.]/g, "")
          )
        : null,

      min_experience_years: minExperience,
      max_experience_years: maxExperience,

      deadline: formData.deadline,

      description: formData.description,

      responsibilities: formData.responsibilities.trim() || null,

      requirements: formData.requirements.trim() || null,

      skills: formData.skills,

      benefits: formData.benefits,
    };

    try {
      const response = id ? await updateJob(id, payload) : null;
      const updatedStatus = response?.job?.status ?? "Pending Review";
      const successMessage =
        response?.message ?? "Job position updated successfully!";

      router.replace({
        pathname: "/company/ManageJobs",
        params: {
          notice: successMessage,
          noticeStatus: updatedStatus,
          refreshKey: String(Date.now()),
        },
      });
    } catch (e: any) {
      console.log("Update job error:", e);
      console.log(
        "Validation errors:",
        e?.response?.data?.errors
      );

      setNotification({
        type: "error",
        message:
          e?.response?.data?.message ||
          Object.values(
            e?.response?.data?.errors || {}
          )
            .flat()
            .join(" ") ||
          "Failed to update job. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={C.accent}
        />

        <Text style={styles.loadingText}>
          Loading job details...
        </Text>
      </View>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        {/* Notification */}

        {notification && (
          <View
            style={[
              styles.notification,
              notification.type === "success"
                ? styles.successNotification
                : styles.errorNotification,
            ]}
          >
            <Ionicons
              name={
                notification.type === "success"
                  ? "checkmark-circle"
                  : "alert-circle"
              }
              size={22}
              color={
                notification.type === "success"
                  ? "#10B981"
                  : "#EF4444"
              }
            />

            <Text
              style={[
                styles.notificationText,
                {
                  color:
                    notification.type === "success"
                      ? "#065F46"
                      : "#991B1B",
                },
              ]}
            >
              {notification.message}
            </Text>

            <Pressable
              onPress={() => setNotification(null)}
              hitSlop={10}
            >
              <Ionicons
                name="close"
                size={18}
                color="inherit"
              />
            </Pressable>
          </View>
        )}

        {/* Header */}

        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.replace("/company/ManageJobs")
            }
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={C.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Edit Job Listing
            </Text>

            <Text style={styles.subtitle}>
              Update the details below to edit your job
              posting
            </Text>
          </View>
        </View>

        {/* =========================
            Basic Info
        ========================= */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Basic Info
          </Text>

          <Text style={styles.label}>
            Job Title
          </Text>

          <TextInput
            value={formData.title}
            onChangeText={(value) =>
              updateField("title", value)
            }
            placeholder="e.g. Senior Product Designer"
            placeholderTextColor={C.textSec}
            style={styles.input}
          />

          <Text style={styles.label}>
            Department
          </Text>

          <TextInput
            value={formData.dept}
            onChangeText={(value) =>
              updateField("dept", value)
            }
            placeholder="e.g. Engineering"
            placeholderTextColor={C.textSec}
            style={styles.input}
          />

          <Text style={styles.label}>
            Job Type
          </Text>

          <View style={styles.optionsContainer}>
            {jobTypes.map((type) => (
              <Pressable
                key={type}
                onPress={() =>
                  updateField("type", type)
                }
                style={[
                  styles.option,
                  formData.type === type &&
                    styles.optionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.type === type &&
                      styles.optionTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>
            Level
          </Text>

          <View style={styles.optionsContainer}>
            {levels.map((level) => (
              <Pressable
                key={level}
                onPress={() =>
                  updateField("level", level)
                }
                style={[
                  styles.option,
                  formData.level === level &&
                    styles.optionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.level === level &&
                      styles.optionTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>
            Work Mode
          </Text>

          <View style={styles.optionsContainer}>
            {workModes.map((mode) => (
              <Pressable
                key={mode}
                onPress={() =>
                  updateField("workMode", mode)
                }
                style={[
                  styles.option,
                  formData.workMode === mode &&
                    styles.optionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.workMode === mode &&
                      styles.optionTextSelected,
                  ]}
                >
                  {mode}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* =========================
            Location & Details
        ========================= */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Location & Details
          </Text>

          <Text style={styles.label}>
            Location
          </Text>

          <TextInput
            value={formData.location}
            onChangeText={(value) =>
              updateField("location", value)
            }
            placeholder="Ramallah, Palestine"
            placeholderTextColor={C.textSec}
            style={styles.input}
          />

          <Text style={styles.label}>
            Salary
          </Text>

          <TextInput
            value={formData.salary}
            onChangeText={(value) =>
              updateField("salary", value)
            }
            placeholder="1000"
            placeholderTextColor={C.textSec}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Minimum Experience (years)</Text>
          <TextInput
            value={formData.minExperienceYears}
            onChangeText={(value) => updateField("minExperienceYears", value)}
            placeholder="Optional, e.g. 1.5"
            placeholderTextColor={C.textSec}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Maximum Experience (years)</Text>
          <TextInput
            value={formData.maxExperienceYears}
            onChangeText={(value) => updateField("maxExperienceYears", value)}
            placeholder="Optional, e.g. 3"
            placeholderTextColor={C.textSec}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.label}>
            Deadline
          </Text>

          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={styles.input}
          >
            <Text
              style={{
                color: formData.deadline
                  ? C.text
                  : C.textSec,
                fontFamily: F,
                fontSize: 14,
              }}
            >
              {formData.deadline ||
                "Select deadline"}
            </Text>

            <Ionicons
              name="calendar-outline"
              size={20}
              color={C.textSec}
              style={styles.calendarIcon}
            />
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={getDateValue()}
              mode="date"
              display={
                Platform.OS === "ios"
                  ? "spinner"
                  : "default"
              }
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* =========================
            Job Description
        ========================= */}

        <View style={styles.card}>
          <View style={styles.descriptionHeader}>
            <Text style={styles.sectionTitle}>
              Job Description
            </Text>

            <Pressable
              onPress={handleAiGenerate}
              disabled={generatingAi}
              style={[styles.aiButton, generatingAi && { opacity: 0.6 }]}
            >
              {generatingAi ? (
                <ActivityIndicator size="small" color={C.accent} />
              ) : (
                <Ionicons name="sparkles" size={16} color={C.accent} />
              )}

              <Text style={styles.aiButtonText}>
                {generatingAi
                  ? formData.description.trim()
                    ? "Improving..."
                    : "Generating..."
                  : formData.description.trim()
                    ? "Improve with AI"
                    : "Generate with AI"}
              </Text>
            </Pressable>
          </View>

          <TextInput
            value={formData.description}
            onChangeText={(value) =>
              updateField("description", value)
            }
            placeholder="Describe the role, expectations, and what success looks like..."
            placeholderTextColor={C.textSec}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              styles.textArea,
            ]}
          />

          <Text style={[styles.label, { marginTop: 18 }]}>Key Responsibilities</Text>
          <TextInput
            value={formData.responsibilities}
            onChangeText={(value) => updateField("responsibilities", value)}
            placeholder="Enter each responsibility on a separate line"
            placeholderTextColor={C.textSec}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={[styles.input, styles.textArea]}
          />
          <Text style={styles.helperText}>Enter each responsibility on a separate line.</Text>

          <Text style={[styles.label, { marginTop: 16 }]}>Candidate Requirements</Text>
          <TextInput
            value={formData.requirements}
            onChangeText={(value) => updateField("requirements", value)}
            placeholder="Enter each qualification or requirement on a separate line"
            placeholderTextColor={C.textSec}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={[styles.input, styles.textArea]}
          />
          <Text style={styles.helperText}>
            Qualifications and experience required from the candidate, one per line.
          </Text>
        </View>

        {/* =========================
            Required Skills
        ========================= */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Required Skills
          </Text>

          <View style={styles.skillsContainer}>
            {formData.skills.map((skill) => (
              <View
                key={skill}
                style={styles.skillTag}
              >
                <Text style={styles.skillText}>
                  {skill}
                </Text>

                <Pressable
                  onPress={() =>
                    handleRemoveSkill(skill)
                  }
                >
                  <Ionicons
                    name="close"
                    size={15}
                    color={C.accent}
                  />
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.addSkillRow}>
            <TextInput
              value={skillInput}
              onChangeText={setSkillInput}
              placeholder="Add a skill..."
              placeholderTextColor={C.textSec}
              style={[
                styles.input,
                styles.skillInput,
              ]}
              onSubmitEditing={handleAddSkill}
            />

            <Pressable
              onPress={handleAddSkill}
              style={styles.addButton}
            >
              <Ionicons
                name="add"
                size={18}
                color={C.text}
              />

              <Text style={styles.addButtonText}>
                Add
              </Text>
            </Pressable>
          </View>
        </View>

        {/* =========================
            Benefits
        ========================= */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Benefits
          </Text>

          {availableBenefits.map((benefit) => {
            const isChecked =
              formData.benefits.includes(
                benefit
              );

            return (
              <Pressable
                key={benefit}
                onPress={() =>
                  handleBenefitToggle(
                    benefit
                  )
                }
                style={styles.benefitRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    isChecked &&
                      styles.checkboxChecked,
                  ]}
                >
                  {isChecked && (
                    <Ionicons
                      name="checkmark"
                      size={15}
                      color="#FFFFFF"
                    />
                  )}
                </View>

                <Text style={styles.benefitText}>
                  {benefit}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* =========================
            Buttons
        ========================= */}

        <View style={styles.actionButtons}>
          <Pressable
            onPress={() =>
              router.replace("/company/ManageJobs")
            }
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>
              Cancel
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[
              styles.saveButton,
              submitting &&
                styles.disabledButton,
            ]}
          >
            {submitting ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <Ionicons
                  name="save-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text style={styles.saveText}>
                  Save Changes
                </Text>
              </>
            )}
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

// =====================================================
// Styles
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg || "#F7F8FA",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      C.bg || "#F7F8FA",
  },

  loadingText: {
    marginTop: 12,
    fontFamily: F,
    fontSize: 14,
    color: C.textSec,
  },

  // =========================
  // Notification
  // =========================

  notification: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },

  successNotification: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },

  errorNotification: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },

  notificationText: {
    flex: 1,
    fontFamily: F,
    fontSize: 13,
    fontWeight: "600",
  },

  // =========================
  // Header
  // =========================

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontFamily: F,
    fontSize: 22,
    fontWeight: "800",
    color: C.text,
  },

  subtitle: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    marginTop: 4,
  },

  // =========================
  // Card
  // =========================

  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  sectionTitle: {
    fontFamily: F,
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    marginBottom: 16,
  },

  label: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 9,
    paddingHorizontal: 12,
    backgroundColor: C.surface,
    color: C.text,
    fontFamily: F,
    fontSize: 14,
    justifyContent: "center",
  },

  textArea: {
    minHeight: 140,
    paddingTop: 12,
  },

  helperText: {
    marginTop: 6,
    fontFamily: F,
    fontSize: 11,
    lineHeight: 16,
    color: C.textSec,
  },

  // =========================
  // Options
  // =========================

  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },

  option: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: C.surface,
  },

  optionSelected: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },

  optionText: {
    fontFamily: F,
    fontSize: 12,
    color: C.text,
    fontWeight: "600",
  },

  optionTextSelected: {
    color: "#FFFFFF",
  },

  // =========================
  // Description
  // =========================

  descriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },

  aiButtonText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "700",
    color: C.accent,
  },

  // =========================
  // Skills
  // =========================

  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  skillTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor:
      String(C.accent) + "18",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  skillText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
    color: C.accent,
  },

  addSkillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  skillInput: {
    flex: 1,
  },

  addButton: {
    height: 46,
    paddingHorizontal: 15,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  addButtonText: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
  },

  // =========================
  // Benefits
  // =========================

  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },

  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  checkboxChecked: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },

  benefitText: {
    flex: 1,
    fontFamily: F,
    fontSize: 13,
    color: C.text,
  },

  // =========================
  // Buttons
  // =========================

  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
  },

  saveButton: {
    flex: 1.3,
    height: 48,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  saveText: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  disabledButton: {
    opacity: 0.6,
  },

  calendarIcon: {
    position: "absolute",
    right: 12,
  },
});
