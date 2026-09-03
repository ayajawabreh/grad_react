import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import {
  Save,
  Eye,
  Download,
  Sparkles,
  Trash2,
  GraduationCap,
  Code2,
  Briefcase,
  FolderGit2,
  Award,
  Languages as LanguagesIcon,
  Check,
  X,
  AlertTriangle,
} from "lucide-react-native";

import { C, F } from "../../constants/tokens";
import { API } from "../../imports/api";
import { downloadAndOpenResumePdf } from "../../imports/resumePdf";
import { useSyncRefresh } from "../../context/SyncContext";

interface ToastState {
  show: boolean;
  type: "success" | "error" | "warning";
  message: string;
}

interface EducationItem {
  id: string;
  degree: string;
  university: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  gpa: string;
}

interface SkillItem {
  id: string;
  name: string;
  category: string;
}

interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface ProjectItem {
  id: string;
  name: string;
  link: string;
  description: string;
}

interface CertificateItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

interface LanguageItem {
  id: string;
  language: string;
  level: string;
}

interface AchievementItem {
  id: string;
  title: string;
  organization: string;
  year: string;
  description: string;
}

const genId = () =>
  Math.random().toString(36).slice(2, 9);

function useListState<T extends { id: string }>(
  initial: T[] = []
) {
  const [items, setItems] = useState<T[]>(initial);

  const add = (empty: Omit<T, "id">) => {
    setItems((prev) => [
      ...prev,
      {
        ...(empty as object),
        id: genId(),
      } as T,
    ]);
  };

  const update = (
    id: string,
    field: keyof T,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const remove = (id: string) => {
    setItems((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  return {
    items,
    setItems,
    add,
    update,
    remove,
  };
}

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  required = false,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: any;
  required?: boolean;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.smallLabel}>
        {label}{required && <Text style={styles.requiredMark}> *</Text>}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

function FieldTextarea({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.smallLabel}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={[
          styles.input,
          styles.textarea,
        ]}
      />
    </View>
  );
}

function DynamicSection({
  title,
  Icon,
  items,
  onAdd,
  onRemove,
  addLabel,
  renderItem,
}: {
  title: string;
  Icon: any;
  items: { id: string }[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  addLabel: string;
  renderItem: (item: any) => React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Icon
            size={19}
            color={C.accent || "#C8A46A"}
          />

          <Text style={styles.sectionTitle}>
            {title}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onAdd}
          style={styles.addButton}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>
            + {addLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 && (
        <Text style={styles.emptyText}>
          No {title.toLowerCase()} added yet.
        </Text>
      )}

      {items.map((item) => (
        <View
          key={item.id}
          style={styles.itemCard}
        >
          <TouchableOpacity
            onPress={() => onRemove(item.id)}
            style={styles.removeButton}
            activeOpacity={0.8}
          >
            <Trash2
              size={15}
              color="#EF4444"
            />
          </TouchableOpacity>

          {renderItem(item)}
        </View>
      ))}
    </View>
  );
}

export default function ResumeBuilder() {
  const router = useRouter();

  const [tpl, setTpl] =
    useState("executive");

  const [resumeId, setResumeId] =
    useState<number | null>(null);

  const [fullName, setFullName] =
    useState("");

  const [
    professionalTitle,
    setProfessionalTitle,
  ] = useState("");

  const [summary, setSummary] =
    useState("");

  const [includeProfilePhoto, setIncludeProfilePhoto] = useState(true);

  const [experienceErrors, setExperienceErrors] = useState<
    Record<string, { start_date?: string; end_date?: string }>
  >({});
  const [totalExperience, setTotalExperience] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [aiLoading, setAiLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [downloadingPdf, setDownloadingPdf] =
    useState(false);

  const education =
    useListState<EducationItem>();

  const skills =
    useListState<SkillItem>();

  const experience =
    useListState<ExperienceItem>();

  const projects =
    useListState<ProjectItem>();

  const certificates =
    useListState<CertificateItem>();

  const languages =
    useListState<LanguageItem>();

  const achievements = useListState<AchievementItem>();

  const [
    toast,
    setToast,
  ] = useState<ToastState>({
    show: false,
    type: "success",
    message: "",
  });

  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState(false);

  const showToast = (
    type: "success" | "error" | "warning",
    message: string
  ) => {
    setToast({
      show: true,
      type,
      message,
    });

    setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        show: false,
      }));
    }, 3500);
  };

  const withLocalIds = <T,>(
    arr: any[]
  ): (T & { id: string })[] =>
    (Array.isArray(arr) ? arr : []).map(
      (item) => ({
        ...item,
        id: item?.id
          ? String(item.id)
          : genId(),
      })
    );

  const loadResume = useCallback(async () => {
    try {
      setLoading(true);

      const response = await API.get("/student/resume", {
        params: { _: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      const data = response.data ?? {};
      console.log(
        "Loaded Resume:",
        response.data
      );

      setResumeId(
        data?.id ?? response.data?.id ?? null
      );

      setFullName(
        data?.full_name ?? ""
      );

      setProfessionalTitle(
        data?.professional_title ??
          ""
      );

      setSummary(
        data?.summary ?? ""
      );
      setIncludeProfilePhoto(
        ![false, 0, "0", null].includes(data?.include_profile_photo)
      );
      setTotalExperience(Number(
        data?.total_years_of_experience ??
        data?.total_years_experience ??
        0
      ));

      setTpl(
        data?.template ??
          "executive"
      );

      education.setItems(
        withLocalIds<EducationItem>(
          data?.education
        ).map((item) => ({ ...item, gpa: item.gpa ?? "" }))
      );

      skills.setItems(
        (Array.isArray(data?.skills) ? data.skills : [])
          .map((item: any) => ({
            id: item && typeof item === "object" && item.id
              ? String(item.id)
              : genId(),
            name: typeof item === "string"
              ? item
              : item?.name ?? item?.skill ?? "",
            category: typeof item === "object"
              ? item?.category ?? item?.category_name ?? "Other"
              : "Other",
          }))
          .filter((item: SkillItem) => Boolean(item.name.trim()))
      );

      experience.setItems(
        withLocalIds<ExperienceItem>(
          data?.experience
        ).map((item: any) => ({
          ...item,
          title: item.title ?? item.position ?? "",
        }))
      );

      projects.setItems(
        withLocalIds<ProjectItem>(
          data?.projects
        )
      );

      certificates.setItems(
        withLocalIds<CertificateItem>(
          data?.certificates
        )
      );

      languages.setItems(
        withLocalIds<LanguageItem>(
          data?.languages
        )
      );
      achievements.setItems(
        withLocalIds<AchievementItem>([
          ...(Array.isArray(data?.activities) ? data.activities : []),
          ...(Array.isArray(data?.achievements) ? data.achievements : []),
        ]).map((item: any) => ({
          ...item,
          title: typeof item === "string" ? item : item.title ?? item.name ?? "",
          organization: item.organization ?? item.issuer ?? "",
          year: item.year ?? "",
          description: item.description ?? "",
        }))
      );
    } catch (error: any) {
      console.error(
        "Load resume error:",
        error?.response?.data || error
      );
    } finally {
      setLoading(false);
    }
  // List setters are stable for this screen; re-creating this callback would cause focus reload loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(useCallback(() => {
    void loadResume();
  }, [loadResume]));

  useSyncRefresh(["resume", "student"], loadResume);

  const saveResume =
    async (validateExperienceDates = true): Promise<number | null> => {
      const datePattern = /^\d{4}(?:-(0[1-9]|1[0-2]))?$/;
      const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
      const nextErrors: Record<string, { start_date?: string; end_date?: string }> = {};

      experience.items.forEach((item) => {
        const start = item.start_date.trim();
        const end = item.end_date.trim();
        const errors: { start_date?: string; end_date?: string } = {};

        if (start && !datePattern.test(start)) {
          errors.start_date = "Use YYYY or YYYY-MM, for example 2023 or 2023-01.";
        }

        if (end && end.toLowerCase() !== "present" && !datePattern.test(end)) {
          errors.end_date = 'Use YYYY, YYYY-MM, or "Present" for a current role.';
        } else if (monthPattern.test(start) && monthPattern.test(end) && end < start) {
          errors.end_date = "End Date cannot be earlier than Start Date.";
        }

        if (errors.start_date || errors.end_date) nextErrors[item.id] = errors;
      });

      setExperienceErrors(validateExperienceDates ? nextErrors : {});
      if (validateExperienceDates && Object.keys(nextErrors).length > 0) {
        showToast("error", "Please check the highlighted experience dates.");
        return null;
      }

      const data = {
        title: "My Resume",
        template: tpl || "executive",
        full_name: fullName || "",
        professional_title:
          professionalTitle || "",
        summary: summary || "",
        include_profile_photo: includeProfilePhoto,
        education: education.items,
        skills: skills.items,
        experience: experience.items.map((item) => ({
          title: item.title,
          company: item.company,
          start_date: item.start_date.trim(),
          end_date: item.end_date.trim().toLowerCase() === "present"
            ? "Present"
            : item.end_date.trim(),
          description: item.description,
        })),
        projects: projects.items,
        certificates: certificates.items,
        languages: languages.items,
        achievements: achievements.items
          .filter((item) =>
            Boolean(
              item.title?.trim() ||
                item.organization?.trim() ||
                item.year?.trim() ||
                item.description?.trim()
            )
          )
          .map((item) => {
            const details = [item.organization?.trim(), item.year?.trim()]
              .filter(Boolean)
              .join(" — ");
            const description = [details, item.description?.trim()]
              .filter(Boolean)
              .join(" — ");

            return {
              title: item.title?.trim() || "Achievement",
              name: item.title?.trim() || "Achievement",
              organization: item.organization?.trim() || "",
              year: item.year?.trim() || "",
              description,
            };
          }),
        activities: [],
        is_public: false,
      };

      try {
        setSaving(true);

        console.log(
          "Sending resume data:",
          data
        );

        let savedId: number;

        let savedResume: any;
        if (resumeId) {
          const response =
            await API.put(
              `/student/resume/${resumeId}`,
              data
            );

          savedId =
            response.data.resume.id;
          savedResume = response.data.resume;
        } else {
          const response =
            await API.post(
              "/student/resume",
              data
            );

          savedId =
            response.data.resume.id;
          savedResume = response.data.resume;
        }

        setResumeId(savedId);
        setTotalExperience(Number(
          savedResume?.total_years_of_experience ??
          savedResume?.total_years_experience ??
          0
        ));

        try {
          const [freshResume] = await Promise.all([
            API.get("/student/resume"),
            API.get("/student/profile"),
          ]);
          setTotalExperience(Number(
            freshResume.data?.total_years_of_experience ??
            freshResume.data?.total_years_experience ??
            0
          ));
        } catch (refreshError) {
          console.warn("Resume saved, but derived data refresh failed:", refreshError);
        }

        showToast(
          "success",
          "Resume saved successfully 🎉"
        );

        return savedId;
      } catch (error: any) {
        console.log(
          "========== REQUEST =========="
        );
        console.log(data);

        console.log(
          "========== STATUS =========="
        );
        console.log(
          error?.response?.status
        );

        console.log(
          "========== RESPONSE =========="
        );
        console.log(
          error?.response?.data
        );

        const validationErrors = error?.response?.data?.errors;
        const firstValidationError = validationErrors
          ? Object.values(validationErrors).flat()[0]
          : null;

        showToast(
          "error",
          String(
            firstValidationError ??
              error?.response?.data?.message ??
              error?.message ??
              "Error saving resume."
          )
        );

        return null;
      } finally {
        setSaving(false);
      }
    };

  const handlePreview = async () => {
    const savedId = await saveResume(false);
    const previewResumeId = savedId ?? resumeId;

    if (!previewResumeId) {
      showToast("error", "Save your resume before opening the preview.");
      return;
    }

    try {
      // Persist this preference independently so false is never lost when
      // another optional resume field cannot be saved.
      await API.put(`/student/resume/${previewResumeId}`, {
        include_profile_photo: Boolean(includeProfilePhoto),
      });

      router.push("/(student)/ResumeView");
    } catch (error: any) {
      const validationErrors = error?.response?.data?.errors;
      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null;

      showToast(
        "error",
        String(
          firstValidationError ??
            error?.response?.data?.message ??
            error?.message ??
            "Could not open resume preview."
        )
      );
    }
  };

  const handleDownloadPdf =
    async () => {
      try {
        setDownloadingPdf(true);

        const savedId = await saveResume();
        if (!savedId) return;

        await downloadAndOpenResumePdf(savedId, fullName);

        Alert.alert(
          "PDF Ready",
          "Your resume PDF was generated successfully."
        );
      } catch (error: any) {
        console.error(
          "PDF error:",
          error?.response?.data ||
            error
        );

        showToast(
          "error",
          error?.response?.data?.message ??
            error?.message ??
            "Failed to generate PDF."
        );
      } finally {
        setDownloadingPdf(false);
      }
    };

  const deleteResume = async () => {
    if (!resumeId) {
      return;
    }

    try {
      await API.delete(
        `/student/resume/${resumeId}`
      );

      setResumeId(null);
      setFullName("");
      setProfessionalTitle("");
      setSummary("");
      setExperienceErrors({});
      setTotalExperience(0);
      setTpl("executive");

      education.setItems([]);
      skills.setItems([]);
      experience.setItems([]);
      projects.setItems([]);
      certificates.setItems([]);
      languages.setItems([]);
      achievements.setItems([]);

      setShowDeleteModal(false);

      showToast(
        "success",
        "Resume deleted successfully"
      );
    } catch (error: any) {
      console.error(
        "Delete error:",
        error?.response?.data ||
          error
      );

      showToast(
        "error",
        "Delete failed"
      );
    }
  };

  const handleAIImprove =
    async () => {
      if (!summary.trim()) {
        showToast(
          "warning",
          "Please write your professional summary first."
        );

        return;
      }

      if (summary.trim().length < 10) {
        showToast(
          "warning",
          "Professional summary must be at least 10 characters."
        );

        return;
      }

      try {
        setAiLoading(true);

        const response =
          await API.post(
            "/student/resume/ai-improve",
            {
              text: summary.trim(),
            }
          );

        console.log(
          "AI Improve Response:",
          response.data
        );

        const improvedText =
          response.data?.improved_text;

        if (!improvedText) {
          showToast(
            "error",
            "AI did not return an improved summary."
          );

          return;
        }

        setSummary(improvedText);

        showToast(
          "success",
          "Summary enhanced using AI ✨"
        );
      } catch (error: any) {
        console.error(
          "AI Improve Error:",
          error?.response?.data ||
            error
        );

        if (
          error?.response?.status ===
          422
        ) {
          showToast(
            "warning",
            error?.response?.data
              ?.errors?.text?.[0] ||
              "Please enter a valid professional summary."
          );
        } else if (
          error?.response?.status ===
          401
        ) {
          showToast(
            "error",
            "Your session has expired. Please login again."
          );
        } else {
          showToast(
            "error",
            "Failed to improve your summary."
          );
        }
      } finally {
        setAiLoading(false);
      }
    };

  const renderToastIcon = () => {
    if (toast.type === "success") {
      return (
        <Check
          size={18}
          color="#166534"
        />
      );
    }

    if (toast.type === "error") {
      return (
        <X
          size={18}
          color="#991B1B"
        />
      );
    }

    return (
      <AlertTriangle
        size={18}
        color="#92400E"
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={C.accent}
        />

        <Text style={styles.loadingText}>
          Loading your resume...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {toast.show && (
        <View
          style={[
            styles.toast,
            toast.type === "success" &&
              styles.toastSuccess,
            toast.type === "error" &&
              styles.toastError,
            toast.type === "warning" &&
              styles.toastWarning,
          ]}
        >
          {renderToastIcon()}

          <Text
            style={styles.toastText}
          >
            {toast.message}
          </Text>

          <TouchableOpacity
            onPress={() =>
              setToast((prev) => ({
                ...prev,
                show: false,
              }))
            }
          >
            <X
              size={16}
              color={
                toast.type ===
                "success"
                  ? "#166534"
                  : toast.type ===
                    "error"
                  ? "#991B1B"
                  : "#92400E"
              }
            />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <TouchableOpacity
          onPress={() => router.replace("/(student)/MyResume")}
          style={styles.backButton}
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            ← Back to My Resume
          </Text>
        </TouchableOpacity>

        <View
          style={styles.header}
        >
          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={styles.title}
            >
              Resume Builder
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Craft your perfect resume
              with AI assistance
            </Text>
          </View>

          <View
            style={styles.actions}
          >
            <TouchableOpacity
              onPress={() => void saveResume()}
              disabled={saving}
              style={
                styles.outlineButton
              }
            >
              <Save
                size={17}
                color={C.text}
              />

              <Text
                style={
                  styles.outlineButtonText
                }
              >
                {saving
                  ? "Saving..."
                  : "Save"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePreview}
              disabled={saving}
              style={
                styles.darkButton
              }
            >
              <Eye
                size={17}
                color="#fff"
              />

              <Text
                style={
                  styles.darkButtonText
                }
              >
                {saving
                  ? "Saving..."
                  : "Preview"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={
                handleDownloadPdf
              }
              disabled={
                downloadingPdf
              }
              style={
                styles.primaryButton
              }
            >
              <Download
                size={17}
                color="#fff"
              />

              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {downloadingPdf
                  ? "Preparing..."
                  : "PDF"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={styles.form}
        >
          {/* BASIC INFORMATION */}

          <View
            style={
              styles.sectionCard
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Basic Information
            </Text>

            <FieldInput
              label="Full Name"
              value={fullName}
              onChangeText={
                setFullName
              }
              placeholder="John Doe"
            />

            <FieldInput
              label="Professional Title"
              value={
                professionalTitle
              }
              onChangeText={
                setProfessionalTitle
              }
              placeholder="Software Engineer"
            />

            <View
              style={
                styles.summaryHeader
              }
            >
              <Text
                style={
                  styles.smallLabel
                }
              >
                Professional Summary
              </Text>

              <TouchableOpacity
                onPress={
                  handleAIImprove
                }
                disabled={
                  aiLoading
                }
                style={
                  styles.aiButton
                }
              >
                <Sparkles
                  size={15}
                  color={
                    C.accent
                  }
                />

                <Text
                  style={
                    styles.aiButtonText
                  }
                >
                  {aiLoading
                    ? "Improving..."
                    : "AI Improve"}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={summary}
              onChangeText={
                setSummary
              }
              placeholder="Briefly describe your career background and key milestones..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={[
                styles.input,
                styles.summaryInput,
              ]}
            />

            <TouchableOpacity
              style={styles.photoToggle}
              onPress={() => setIncludeProfilePhoto((value) => !value)}
            >
              <View style={[styles.toggleTrack, includeProfilePhoto && styles.toggleTrackActive]}>
                <View style={[styles.toggleThumb, includeProfilePhoto && styles.toggleThumbActive]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.smallLabel}>Include Profile Photo</Text>
                <Text style={styles.toggleDescription}>
                  Show your profile photo in the resume preview and PDF.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* EDUCATION */}

          <DynamicSection
            title="Education"
            Icon={GraduationCap}
            items={
              education.items
            }
            addLabel="Add Education"
            onAdd={() =>
              education.add({
                degree: "",
                university: "",
                field_of_study:
                  "",
                start_date: "",
                end_date: "",
                gpa: "",
              })
            }
            onRemove={
              education.remove
            }
            renderItem={(
              item: EducationItem
            ) => (
              <>
                <FieldInput
                  label="Degree"
                  value={
                    item.degree
                  }
                  onChangeText={(
                    value
                  ) =>
                    education.update(
                      item.id,
                      "degree",
                      value
                    )
                  }
                  placeholder="Bachelor of Science"
                />

                <FieldInput
                  label="University"
                  value={
                    item.university
                  }
                  onChangeText={(
                    value
                  ) =>
                    education.update(
                      item.id,
                      "university",
                      value
                    )
                  }
                  placeholder="An-Najah National University"
                />

                <FieldInput
                  label="Field of Study"
                  value={
                    item.field_of_study
                  }
                  onChangeText={(
                    value
                  ) =>
                    education.update(
                      item.id,
                      "field_of_study",
                      value
                    )
                  }
                  placeholder="Computer Engineering"
                />

                <FieldInput
                  label="Start Year"
                  value={
                    item.start_date
                  }
                  onChangeText={(
                    value
                  ) =>
                    education.update(
                      item.id,
                      "start_date",
                      value
                    )
                  }
                  placeholder="2022"
                  keyboardType="numeric"
                />

                <FieldInput
                  label="End Year"
                  value={
                    item.end_date
                  }
                  onChangeText={(
                    value
                  ) =>
                    education.update(
                      item.id,
                      "end_date",
                      value
                    )
                  }
                  placeholder="2026"
                  keyboardType="numeric"
                />

                <FieldInput
                  label="GPA"
                  value={item.gpa}
                  onChangeText={(value) => education.update(item.id, "gpa", value)}
                  placeholder="3.5"
                  keyboardType="decimal-pad"
                />
              </>
            )}
          />

          {/* SKILLS */}

          <DynamicSection
            title="Skills"
            Icon={Code2}
            items={
              skills.items
            }
            addLabel="Add Skill"
            onAdd={() =>
              skills.add({
                name: "",
                category: "Other",
              })
            }
            onRemove={
              skills.remove
            }
            renderItem={(
              item: SkillItem
            ) => (
              <>
                <FieldInput
                  label="Skill"
                  value={item.name}
                  onChangeText={(value) => skills.update(item.id, "name", value)}
                  placeholder="React"
                />
                <Text style={styles.smallLabel}>Category</Text>
                <View style={styles.levelContainer}>
                  {["Programming", "Frameworks", "Databases", "Tools", "Soft Skills", "Concepts", "Other"].map((category) => (
                    <TouchableOpacity
                      key={category}
                      onPress={() => skills.update(item.id, "category", category)}
                      style={[styles.levelButton, item.category === category && styles.levelButtonActive]}
                    >
                      <Text style={[styles.levelText, item.category === category && styles.levelTextActive]}>{category}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          />

          {/* EXPERIENCE */}

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Total Experience: {totalExperience} Years</Text>
            <Text style={styles.emptyText}>Calculated automatically from your work experience records.</Text>
          </View>

          <DynamicSection
            title="Experience"
            Icon={Briefcase}
            items={
              experience.items
            }
            addLabel="Add Experience"
            onAdd={() =>
              experience.add({
                title: "",
                company: "",
                start_date: "",
                end_date: "",
                description: "",
              })
            }
            onRemove={
              experience.remove
            }
            renderItem={(
              item: ExperienceItem
            ) => (
              <>
                <FieldInput
                  label="Job Title"
                  value={
                    item.title
                  }
                  onChangeText={(
                    value
                  ) =>
                    experience.update(
                      item.id,
                      "title",
                      value
                    )
                  }
                  placeholder="Frontend Developer Intern"
                />

                <FieldInput
                  label="Company"
                  value={
                    item.company
                  }
                  onChangeText={(
                    value
                  ) =>
                    experience.update(
                      item.id,
                      "company",
                      value
                    )
                  }
                  placeholder="Company X"
                />

                <FieldInput
                  label="Start Date"
                  value={
                    item.start_date
                  }
                  onChangeText={(value) => {
                    experience.update(
                      item.id,
                      "start_date",
                      value
                    );
                    setExperienceErrors((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], start_date: undefined },
                    }));
                  }}
                  placeholder="2023-01"
                  required
                  error={experienceErrors[item.id]?.start_date}
                />

                <FieldInput
                  label="End Date"
                  value={
                    item.end_date
                  }
                  onChangeText={(value) => {
                    experience.update(
                      item.id,
                      "end_date",
                      value
                    );
                    setExperienceErrors((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], end_date: undefined },
                    }));
                  }}
                  placeholder="2024-06 or Present"
                  required
                  error={experienceErrors[item.id]?.end_date}
                />

                <FieldTextarea
                  label="Description"
                  value={
                    item.description
                  }
                  onChangeText={(
                    value
                  ) =>
                    experience.update(
                      item.id,
                      "description",
                      value
                    )
                  }
                  placeholder="What did you do in this role?"
                />
              </>
            )}
          />

          {/* PROJECTS */}

          <DynamicSection
            title="Projects"
            Icon={FolderGit2}
            items={
              projects.items
            }
            addLabel="Add Project"
            onAdd={() =>
              projects.add({
                name: "",
                link: "",
                description:
                  "",
              })
            }
            onRemove={
              projects.remove
            }
            renderItem={(
              item: ProjectItem
            ) => (
              <>
                <FieldInput
                  label="Project Name"
                  value={
                    item.name
                  }
                  onChangeText={(
                    value
                  ) =>
                    projects.update(
                      item.id,
                      "name",
                      value
                    )
                  }
                  placeholder="HireMatch Platform"
                />

                <FieldInput
                  label="GitHub / Live Demo"
                  value={
                    item.link
                  }
                  onChangeText={(
                    value
                  ) =>
                    projects.update(
                      item.id,
                      "link",
                      value
                    )
                  }
                  placeholder="github.com/username/project"
                />

                <FieldTextarea
                  label="Description"
                  value={
                    item.description
                  }
                  onChangeText={(
                    value
                  ) =>
                    projects.update(
                      item.id,
                      "description",
                      value
                    )
                  }
                  placeholder="Briefly describe the project and your role..."
                />
              </>
            )}
          />

          {/* CERTIFICATES */}

          <DynamicSection
            title="Certificates"
            Icon={Award}
            items={
              certificates.items
            }
            addLabel="Add Certificate"
            onAdd={() =>
              certificates.add({
                name: "",
                issuer: "",
                year: "",
              })
            }
            onRemove={
              certificates.remove
            }
            renderItem={(
              item: CertificateItem
            ) => (
              <>
                <FieldInput
                  label="Certificate Name"
                  value={
                    item.name
                  }
                  onChangeText={(
                    value
                  ) =>
                    certificates.update(
                      item.id,
                      "name",
                      value
                    )
                  }
                  placeholder="React Course Certificate"
                />

                <FieldInput
                  label="Issuer"
                  value={
                    item.issuer
                  }
                  onChangeText={(
                    value
                  ) =>
                    certificates.update(
                      item.id,
                      "issuer",
                      value
                    )
                  }
                  placeholder="Coursera"
                />

                <FieldInput
                  label="Year"
                  value={
                    item.year
                  }
                  onChangeText={(
                    value
                  ) =>
                    certificates.update(
                      item.id,
                      "year",
                      value
                    )
                  }
                  placeholder="2025"
                  keyboardType="numeric"
                />
              </>
            )}
          />

          {/* LANGUAGES */}

          <DynamicSection
            title="Languages"
            Icon={
              LanguagesIcon
            }
            items={
              languages.items
            }
            addLabel="Add Language"
            onAdd={() =>
              languages.add({
                language: "",
                level: "Fluent",
              })
            }
            onRemove={
              languages.remove
            }
            renderItem={(
              item: LanguageItem
            ) => (
              <>
                <FieldInput
                  label="Language"
                  value={
                    item.language
                  }
                  onChangeText={(
                    value
                  ) =>
                    languages.update(
                      item.id,
                      "language",
                      value
                    )
                  }
                  placeholder="English"
                />

                <Text
                  style={
                    styles.smallLabel
                  }
                >
                  Proficiency
                </Text>

                <View
                  style={
                    styles.levelContainer
                  }
                >
                  {[
                    "Native",
                    "Fluent",
                    "Intermediate",
                    "Basic",
                  ].map(
                    (level) => (
                      <TouchableOpacity
                        key={
                          level
                        }
                        onPress={() =>
                          languages.update(
                            item.id,
                            "level",
                            level
                          )
                        }
                        style={[
                          styles.levelButton,
                          item.level ===
                            level &&
                            styles.levelButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.levelText,
                            item.level ===
                              level &&
                              styles.levelTextActive,
                          ]}
                        >
                          {
                            level
                          }
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </>
            )}
          />

          <DynamicSection
            title="Activities & Achievements"
            Icon={Award}
            items={achievements.items}
            addLabel="Add Achievement"
            onAdd={() => achievements.add({ title: "", organization: "", year: "", description: "" })}
            onRemove={achievements.remove}
            renderItem={(item: AchievementItem) => (
              <>
                <FieldInput label="Title" value={item.title} onChangeText={(value) => achievements.update(item.id, "title", value)} />
                <FieldInput label="Organization" value={item.organization} onChangeText={(value) => achievements.update(item.id, "organization", value)} />
                <FieldInput label="Year" value={item.year} onChangeText={(value) => achievements.update(item.id, "year", value)} keyboardType="numeric" />
                <FieldTextarea label="Description" value={item.description} onChangeText={(value) => achievements.update(item.id, "description", value)} />
              </>
            )}
          />

          {/* DELETE */}

          {resumeId && (
            <TouchableOpacity
              onPress={() =>
                setShowDeleteModal(
                  true
                )
              }
              style={
                styles.deleteButton
              }
            >
              <Trash2
                size={17}
                color="#EF4444"
              />

              <Text
                style={
                  styles.deleteText
                }
              >
                Delete Resume
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* DELETE MODAL */}

      {showDeleteModal && (
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modal
            }
          >
            <View
              style={
                styles.modalTitleRow
              }
            >
              <View
                style={
                  styles.warningIcon
                }
              >
                <AlertTriangle
                  size={20}
                  color="#92400E"
                />
              </View>

              <Text
                style={
                  styles.modalTitle
                }
              >
                Confirm Deletion
              </Text>
            </View>

            <Text
              style={
                styles.modalText
              }
            >
              Are you sure you want to
              delete your resume? This
              action cannot be undone.
            </Text>

            <View
              style={
                styles.modalActions
              }
            >
              <TouchableOpacity
                onPress={() =>
                  setShowDeleteModal(
                    false
                  )
                }
                style={
                  styles.cancelButton
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={
                  deleteResume
                }
                style={
                  styles.confirmDeleteButton
                }
              >
                <Text
                  style={
                    styles.confirmDeleteText
                  }
                >
                  Yes, Delete It
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      C.bg || "#F8FAFC",
  },

  container: {
    padding: 18,
    paddingBottom: 50,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      C.bg || "#F8FAFC",
  },

  loadingText: {
    marginTop: 12,
    fontFamily: F,
    fontSize: 14,
    color: C.textSec,
  },

  backButton: {
    marginBottom: 18,
  },

  backButtonText: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "600",
    color: C.textSec,
  },

  header: {
    marginBottom: 24,
  },

  headerText: {
    marginBottom: 16,
  },

  photoToggle: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 3,
    backgroundColor: "#CBD5E1",
  },

  toggleTrackActive: {
    backgroundColor: C.accent,
  },

  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
  },

  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },

  toggleDescription: {
    marginTop: 2,
    fontFamily: F,
    fontSize: 11.5,
    lineHeight: 17,
    color: C.textSec,
  },

  title: {
    fontFamily: F,
    fontSize: 27,
    fontWeight: "800",
    color: C.text,
  },

  subtitle: {
    fontFamily: F,
    fontSize: 13,
    color: C.textSec,
    marginTop: 5,
  },

  actions: {
    flexDirection: "row",
    gap: 8,
  },

  outlineButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor:
      C.border || "#E2E8F0",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  outlineButtonText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
  },

  darkButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor:
      "#181B1F",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  darkButtonText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },

  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor:
      C.accent || "#C8A46A",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  primaryButtonText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },

  form: {
    gap: 16,
  },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor:
      C.border || "#E2E8F0",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 18,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },

  sectionTitle: {
    fontFamily: F,
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },

  field: {
    marginBottom: 12,
  },

  smallLabel: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
    color: C.textSec,
    marginBottom: 6,
  },

  requiredMark: {
    color: "#DC2626",
  },

  inputError: {
    borderColor: "#DC2626",
  },

  fieldError: {
    marginTop: 5,
    fontFamily: F,
    fontSize: 11.5,
    color: "#DC2626",
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor:
      C.border || "#E2E8F0",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: F,
    fontSize: 13.5,
    color: C.text,
    backgroundColor: "#fff",
  },

  textarea: {
    minHeight: 90,
  },

  summaryInput: {
    minHeight: 130,
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 6,
  },

  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor:
      `${C.accent || "#C8A46A"}12`,
  },

  aiButtonText: {
    fontFamily: F,
    fontSize: 11,
    fontWeight: "700",
    color:
      C.accent || "#C8A46A",
  },

  addButton: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor:
      C.accent || "#C8A46A",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  addButtonText: {
    fontFamily: F,
    fontSize: 11.5,
    fontWeight: "700",
    color:
      C.accent || "#C8A46A",
  },

  emptyText: {
    fontFamily: F,
    fontSize: 13,
    color: C.textSec,
    marginBottom: 5,
  },

  itemCard: {
    position: "relative",
    padding: 16,
    paddingTop: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      C.divider || "#F1F5F9",
    backgroundColor:
      "#FAFAFA",
  },

  removeButton: {
    position: "absolute",
    right: 9,
    top: 9,
    zIndex: 10,
    width: 27,
    height: 27,
    borderRadius: 8,
    backgroundColor:
      "#FEE2E2",
    borderWidth: 1,
    borderColor:
      "#FCA5A5",
    alignItems: "center",
    justifyContent: "center",
  },

  levelContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 8,
  },

  levelButton: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor:
      "#E2E8F0",
    backgroundColor: "#fff",
  },

  levelButtonActive: {
    backgroundColor:
      `${C.accent || "#C8A46A"}15`,
    borderColor:
      C.accent || "#C8A46A",
  },

  levelText: {
    fontFamily: F,
    fontSize: 11.5,
    fontWeight: "600",
    color: C.textSec,
  },

  levelTextActive: {
    color:
      C.accent || "#C8A46A",
  },

  deleteButton: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor:
      "#FEE2E2",
    borderWidth: 1,
    borderColor:
      "#FCA5A5",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  deleteText: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "700",
    color: "#EF4444",
  },

  toast: {
    position: "absolute",
    top: 12,
    left: 15,
    right: 15,
    zIndex: 9999,
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  toastSuccess: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  toastError: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },

  toastWarning: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  toastText: {
    flex: 1,
    fontFamily: F,
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
  },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    backgroundColor:
      "rgba(15,23,42,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },

  modal: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
  },

  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  warningIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor:
      "#FFFBEB",
    borderWidth: 1,
    borderColor:
      "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    flex: 1,
    fontFamily: F,
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
  },

  modalText: {
    fontFamily: F,
    fontSize: 13.5,
    lineHeight: 20,
    color: C.textSec,
    marginBottom: 22,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent:
      "flex-end",
    gap: 10,
  },

  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor:
      "#F1F5F9",
  },

  cancelText: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },

  confirmDeleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor:
      "#EF4444",
  },

  confirmDeleteText: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
});
