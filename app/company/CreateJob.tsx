import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { C, F } from "../../constants/tokens";
import api, { generateJobDescription } from "../../imports/api";

const availableBenefits = [
  "Health Insurance",
  "Transportation Allowance",
  "Remote Work / Hybrid",
  "Training & Development",
  "Paid Annual Leave",
  "Performance Bonus",
];

const JOB_TYPES = [
  "Full-Time",
  "Part-Time",
  "Internship",
  "Contract",
];

const LEVELS = [
  "Entry",
  "Mid",
  "Senior",
  "Lead",
];

const WORK_MODES = [
  "Remote",
  "On-site",
  "Hybrid",
];

export default function CreateJob() {
  const [submitting, setSubmitting] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  const [error, setError] = useState<string | null>(null);

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

  const handleAiGenerate = async () => {
    if (!formData.title.trim()) {
      Alert.alert(
        "Job Title Required",
        "Please enter a job title first."
      );
      return;
    }

    setGeneratingAi(true);
    setError(null);

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

        Alert.alert(
          "Success",
          "Job description generated successfully with AI ✨"
        );
      } else {
        setError("AI returned an empty description.");
      }
    } catch (e: any) {
      console.error(
        "AI Generate Error:",
        e?.response?.data || e
      );

      setError(
        e?.response?.data?.message ||
          "Failed to generate job description. Please try again."
      );
    } finally {
      setGeneratingAi(false);
    }
  };

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

  const handleBenefitToggle = (benefit: string) => {
    setFormData((prev) => {
      const exists = prev.benefits.includes(benefit);

      return {
        ...prev,
        benefits: exists
          ? prev.benefits.filter(
              (item) => item !== benefit
            )
          : [...prev.benefits, benefit],
      };
    });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter a job title."
      );
      return;
    }

    if (!formData.deadline) {
      Alert.alert(
        "Missing Information",
        "Please select a deadline."
      );
      return;
    }

    const minExperience = formData.minExperienceYears.trim() === "" ? null : Number(formData.minExperienceYears);
    const maxExperience = formData.maxExperienceYears.trim() === "" ? null : Number(formData.maxExperienceYears);

    if (
      (minExperience !== null && (!Number.isFinite(minExperience) || minExperience < 0 || minExperience > 60)) ||
      (maxExperience !== null && (!Number.isFinite(maxExperience) || maxExperience < 0 || maxExperience > 60))
    ) {
      Alert.alert("Invalid Experience", "Experience must be between 0 and 60 years.");
      return;
    }

    if (minExperience !== null && maxExperience !== null && maxExperience < minExperience) {
      Alert.alert("Invalid Experience", "Maximum experience must be greater than or equal to minimum experience.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const pendingSkill = skillInput.trim();
    const submittedSkills = pendingSkill && !formData.skills.includes(pendingSkill)
      ? [...formData.skills, pendingSkill]
      : formData.skills;

    const payload = {
      title: formData.title.trim(),
      department: formData.dept.trim(),
      employment_type: formData.type,
      level: formData.level,
      work_mode: formData.workMode,
      location: formData.location.trim(),
      salary: formData.salary
        ? Number(
            String(formData.salary).replace(
              /[^\d.]/g,
              ""
            )
          )
        : null,
      min_experience_years: minExperience,
      max_experience_years: maxExperience,
      deadline: formData.deadline || null,
      description: formData.description.trim(),
      responsibilities: formData.responsibilities.trim() || null,
      requirements: formData.requirements.trim() || null,
      skills: submittedSkills,
      benefits: formData.benefits,
      status: "Pending Review",
    };

    try {
      const response = await api.post("/company/jobs", payload);

      if (response.status < 200 || response.status >= 300) {
        throw new Error("Failed to create job.");
      }

      await api.get("/company/jobs", {
        params: { _: Date.now() },
      });

      const createdStatus = response.data?.job?.status ?? "Pending Review";
      const successMessage = response.data?.message ?? (
        createdStatus === "Open"
          ? "Job passed automatic validation and was published successfully."
          : "Job was created and sent to admin moderation."
      );
      const moderationIssues = Array.isArray(response.data?.moderation_issues)
        ? response.data.moderation_issues
            .map((issue: any) => issue?.message)
            .filter(Boolean)
            .join(" ")
        : "";
      const qualityScore = response.data?.quality_score;

      router.replace({
        pathname: "/company/ManageJobs",
        params: {
          notice: successMessage,
          noticeStatus: createdStatus,
          noticeDetails: createdStatus === "Open"
            ? "Your job is now visible to students."
            : [qualityScore != null ? `Quality score: ${qualityScore}.` : "", moderationIssues]
                .filter(Boolean)
                .join(" "),
          refreshKey: String(Date.now()),
        },
      });
    } catch (error: any) {
      console.log(
        "Create status:",
        error?.response?.status
      );

      console.log(
        "Create response:",
        error?.response?.data
      );

      console.log(
        "Validation errors:",
        error?.response?.data?.errors
      );

      const firstValidationError = error?.response?.data?.errors
        ? Object.values(error.response.data.errors).flat()[0]
        : null;

      setError(
        String(
          firstValidationError ??
            error?.response?.data?.message ??
            error?.message ??
            "Failed to create job."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>
              Create Job Listing
            </Text>

            <Text style={styles.subtitle}>
              Fill in the details below to publish a
              new job position
            </Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color="#DC2626"
            />

            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              onPress={() => setError(null)}
              style={styles.errorClose}
            >
              <Ionicons
                name="close"
                size={18}
                color="#991B1B"
              />
            </Pressable>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Basic Info
          </Text>

          <Field
            label="Job Title"
            value={formData.title}
            onChangeText={(value) =>
              setFormData((prev) => ({
                ...prev,
                title: value,
              }))
            }
            placeholder="e.g. Senior Product Designer"
            required
          />

          <Field
            label="Department"
            value={formData.dept}
            onChangeText={(value) =>
              setFormData((prev) => ({
                ...prev,
                dept: value,
              }))
            }
            placeholder="e.g. Engineering"
          />

          <Text style={styles.label}>
            Job Type
          </Text>

          <OptionSelector
            options={JOB_TYPES}
            value={formData.type}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                type: value,
              }))
            }
          />

          <Text style={styles.label}>
            Level
          </Text>

          <OptionSelector
            options={LEVELS}
            value={formData.level}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                level: value,
              }))
            }
          />

          <Text style={styles.label}>
            Work Mode
          </Text>

          <OptionSelector
            options={WORK_MODES}
            value={formData.workMode}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                workMode: value,
              }))
            }
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Location & Salary
          </Text>

          <Field
            label="Location"
            value={formData.location}
            onChangeText={(value) =>
              setFormData((prev) => ({
                ...prev,
                location: value,
              }))
            }
            placeholder="Ramallah, Palestine"
          />

          <Field
            label="Salary"
            value={formData.salary}
            onChangeText={(value) =>
              setFormData((prev) => ({
                ...prev,
                salary: value,
              }))
            }
            placeholder="e.g. 1200"
            keyboardType="numeric"
          />

          <Field
            label="Minimum Experience (years)"
            value={formData.minExperienceYears}
            onChangeText={(value) => setFormData((prev) => ({ ...prev, minExperienceYears: value }))}
            placeholder="Optional, e.g. 1.5"
            keyboardType="decimal-pad"
          />

          <Field
            label="Maximum Experience (years)"
            value={formData.maxExperienceYears}
            onChangeText={(value) => setFormData((prev) => ({ ...prev, maxExperienceYears: value }))}
            placeholder="Optional, e.g. 3"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>
            Deadline
          </Text>

          <TextInput
            value={formData.deadline}
            onChangeText={(value) =>
              setFormData((prev) => ({
                ...prev,
                deadline: value,
              }))
            }
            placeholder="YYYY-MM-DD"
            placeholderTextColor={C.textSec}
            style={styles.input}
          />

          <Text style={styles.helperText}>
            Enter the deadline as YYYY-MM-DD
          </Text>
        </View>

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
                <ActivityIndicator
                  size="small"
                  color={C.accentHover}
                />
              ) : (
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={C.accentHover}
                />
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
              setFormData((prev) => ({
                ...prev,
                description: value,
              }))
            }
            placeholder="Describe the role, expectations, and what success looks like..."
            placeholderTextColor={C.textSec}
            multiline
            numberOfLines={7}
            textAlignVertical="top"
            style={[
              styles.input,
              styles.descriptionInput,
            ]}
          />
          <Text style={styles.helperText}>Use at least 120 characters for automatic publishing.</Text>

          <Text style={[styles.label, { marginTop: 18 }]}>Key Responsibilities</Text>
          <TextInput
            value={formData.responsibilities}
            onChangeText={(value) =>
              setFormData((previous) => ({ ...previous, responsibilities: value }))
            }
            placeholder="Enter each responsibility on a separate line"
            placeholderTextColor={C.textSec}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={[styles.input, styles.multiLineInput]}
          />
          <Text style={styles.helperText}>Enter each responsibility on a separate line.</Text>

          <Text style={[styles.label, { marginTop: 16 }]}>Candidate Requirements</Text>
          <TextInput
            value={formData.requirements}
            onChangeText={(value) =>
              setFormData((previous) => ({ ...previous, requirements: value }))
            }
            placeholder="Enter each qualification or requirement on a separate line"
            placeholderTextColor={C.textSec}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={[styles.input, styles.multiLineInput]}
          />
          <Text style={styles.helperText}>
            Qualifications and experience required from the candidate, one per line. Use at least 60 characters for automatic publishing.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Required Skills
          </Text>

          {formData.skills.length > 0 && (
            <View style={styles.chipsContainer}>
              {formData.skills.map((skill) => (
                <View
                  key={skill}
                  style={styles.skillChip}
                >
                  <Text style={styles.skillChipText}>
                    {skill}
                  </Text>

                  <Pressable
                    onPress={() =>
                      handleRemoveSkill(skill)
                    }
                    hitSlop={8}
                  >
                    <Ionicons
                      name="close"
                      size={14}
                      color={C.accent}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <View style={styles.skillInputRow}>
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
              returnKeyType="done"
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

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Benefits
          </Text>

          <View style={styles.benefitsContainer}>
            {availableBenefits.map((benefit) => {
              const isChecked =
                formData.benefits.includes(
                  benefit
                );

              return (
                <Pressable
                  key={benefit}
                  onPress={() =>
                    handleBenefitToggle(benefit)
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
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() =>
              router.replace("/company/ManageJobs")
            }
            disabled={submitting}
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
              styles.publishButton,
              submitting &&
                styles.publishButtonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name="save-outline"
                size={17}
                color="#FFFFFF"
              />
            )}

            <Text style={styles.publishText}>
              {submitting
                ? "Publishing..."
                : "Publish Job"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? " *" : ""}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textSec}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

function OptionSelector({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.optionsContainer}>
      {options.map((option) => {
        const active = value === option;

        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.optionButton,
              active &&
                styles.optionButtonActive,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                active &&
                  styles.optionTextActive,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F7",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerTextContainer: {
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
    marginTop: 5,
    lineHeight: 18,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    padding: 13,
    marginBottom: 16,
    gap: 9,
  },

  errorText: {
    flex: 1,
    fontFamily: F,
    fontSize: 12.5,
    color: "#991B1B",
    lineHeight: 18,
  },

  errorClose: {
    padding: 1,
  },

  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 17,
    marginBottom: 16,
  },

  sectionTitle: {
    fontFamily: F,
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    marginBottom: 15,
  },

  field: {
    marginBottom: 14,
  },

  label: {
    fontFamily: F,
    fontSize: 12.5,
    fontWeight: "600",
    color: C.text,
    marginBottom: 7,
  },

  input: {
    width: "100%",
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    color: C.text,
    fontFamily: F,
    fontSize: 13,
  },

  helperText: {
    fontFamily: F,
    fontSize: 10.5,
    color: C.textSec,
    marginTop: -7,
    marginBottom: 5,
  },

  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 15,
  },

  optionButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: "#F5F3F1",
    borderWidth: 1,
    borderColor: C.border,
  },

  optionButtonActive: {
    backgroundColor: C.accent || "#C8A46A",
    borderColor: C.accent || "#C8A46A",
  },

  optionText: {
    fontFamily: F,
    fontSize: 11.5,
    fontWeight: "600",
    color: C.textSec,
  },

  optionTextActive: {
    color: "#FFFFFF",
  },

  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 7,
  },

  aiButtonText: {
    fontFamily: F,
    fontSize: 11.5,
    fontWeight: "600",
    color: C.accentHover,
  },

  descriptionInput: {
    minHeight: 145,
    lineHeight: 19,
  },

  multiLineInput: {
    minHeight: 112,
    paddingTop: 12,
    lineHeight: 19,
  },

  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 13,
  },

  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor:
      String(C.accent || "#C8A46A") + "18",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 18,
  },

  skillChipText: {
    fontFamily: F,
    fontSize: 11.5,
    fontWeight: "600",
    color: C.accent || "#C8A46A",
  },

  skillInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  skillInput: {
    flex: 1,
  },

  addButton: {
    height: 44,
    paddingHorizontal: 13,
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
    fontSize: 12,
    fontWeight: "600",
    color: C.text,
  },

  benefitsContainer: {
    gap: 13,
  },

  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
  },

  checkboxChecked: {
    backgroundColor: C.accent || "#C8A46A",
    borderColor: C.accent || "#C8A46A",
  },

  benefitText: {
    flex: 1,
    fontFamily: F,
    fontSize: 12.5,
    color: C.text,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 2,
  },

  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
  },

  publishButton: {
    flex: 1.5,
    height: 46,
    borderRadius: 10,
    backgroundColor: C.accent || "#C8A46A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  publishButtonDisabled: {
    opacity: 0.65,
  },

  publishText: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
