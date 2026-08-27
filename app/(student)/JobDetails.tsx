import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Briefcase,
  Heart,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react-native";

import { C, F } from "@/constants/tokens";

import {
  fetchJob,
  saveJob,
  unsaveJob,
  formatExperienceRange,
  type UiJob,
} from "@/imports/jobs";
import { useApplications } from "@/context/ApplicationsContext";
import { useSyncRefresh } from "@/context/SyncContext";

export default function JobDetails() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { appliedJobIds, setJobApplied } = useApplications();

  const [job, setJob] = useState<UiJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const applied = id ? appliedJobIds.has(String(id)) : false;
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const handleBack = () => {
    if (from === "saved") {
      router.replace("/(student)/SavedJobs");
    } else if (from === "recommended") {
      router.replace("/(student)/Recommended");
    } else if (from === "browse") {
      router.replace("/(student)/JobDiscovery");
    } else {
      router.back();
    }
  };

  const loadJob = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("Job ID is missing");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setJob(await fetchJob(id));
    } catch (err) {
      console.error("Failed to load job:", err);
      setError("Failed to load job details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadJob(); }, [loadJob]);
  useSyncRefresh("jobs", loadJob, { jobId: id });

  async function handleToggleSave() {
    if (!job || saving) return;

    setSaving(true);

    const nextSaved = !job.saved;
    const previousJob = job;

    setJob({
      ...job,
      saved: nextSaved,
    });

    try {
      if (nextSaved) {
        await saveJob(job.id);
      } else {
        await unsaveJob(job.id);
      }
    } catch (error) {
      console.error("Save job error:", error);
      setJob(previousJob);
    } finally {
      setSaving(false);
    }
  }

  async function handleApply() {
    if (!job || applying) return;

    setApplying(true);

    try {
      await setJobApplied(job.id, true);
    } catch (error: any) {
      console.warn("Apply job error:", error?.message ?? error);
    } finally {
      setApplying(false);
    }
  }

  async function handleConfirmWithdraw() {
    if (!job || applying) return;

    setShowWithdrawModal(false);
    setApplying(true);

    try {
      await setJobApplied(job.id, false);
    } catch (error: any) {
      console.warn("Withdraw application error:", error?.message ?? error);
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error || "Job not found"}
        </Text>

        <Pressable
          onPress={handleBack}
          style={styles.backButton}
        >
          <ArrowLeft size={18} color={C.text} />

          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const activeColor = job.color || C.accent;

  const responsibilities: string[] = job.responsibilities
    ? job.responsibilities
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean)
    : [];

  const requirements: string[] = job.requirements
    ? job.requirements
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean)
    : [];

  const tags: string[] = Array.isArray(job.tags)
    ? job.tags.filter(
        (tag: unknown): tag is string =>
          typeof tag === "string"
      )
    : [];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={handleBack}
          style={styles.backRow}
        >
          <ArrowLeft size={18} color={C.text} />

          <Text style={styles.backText}>
            {from === "saved" ? "Back to Saved Jobs" : from === "recommended" ? "Back to Recommended" : from === "browse" ? "Back to Browse Jobs" : "Back to Jobs"}
          </Text>
        </Pressable>

        <View style={styles.mainColumn}>
          <View style={styles.card}>
            <View style={styles.jobHeader}>
              <View
                style={[
                  styles.companyIcon,
                  {
                    backgroundColor: `${activeColor}18`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.companyLetter,
                    {
                      color: activeColor,
                    },
                  ]}
                >
                  {job.company?.charAt(0)?.toUpperCase() || "C"}
                </Text>
              </View>

              <View style={styles.jobHeaderInfo}>
                <Text style={styles.jobTitle}>
                  {job.title}
                </Text>

                <Text style={styles.companyText}>
                  {job.company}
                  {job.dept ? ` · ${job.dept}` : ""}
                </Text>

                <View style={styles.badgesRow}>
                  {job.status && (
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            job.status === "Published"
                              ? C.successBg
                              : C.warningBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              job.status === "Published"
                                ? C.success
                                : C.warning,
                          },
                        ]}
                      >
                        {job.status}
                      </Text>
                    </View>
                  )}

                  {job.type && (
                    <View style={styles.grayBadge}>
                      <Text style={styles.grayBadgeText}>
                        {job.type}
                      </Text>
                    </View>
                  )}

                  {job.mode && (
                    <View style={styles.grayBadge}>
                      <Text style={styles.grayBadgeText}>
                        {job.mode}
                      </Text>
                    </View>
                  )}

                  {job.level && (
                    <View style={styles.grayBadge}>
                      <Text style={styles.grayBadgeText}>
                        {job.level}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.actionRow}>
              {applied ? (
                <Pressable
                  onPress={() => setShowWithdrawModal(true)}
                  disabled={applying}
                  style={[
                    styles.applyButton,
                    {
                      backgroundColor: C.danger,
                      opacity: applying ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={styles.buttonText}>
                    {applying
                      ? "Withdrawing..."
                      : "Withdraw Application"}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleApply}
                  disabled={applying}
                  style={[
                    styles.applyButton,
                    {
                      backgroundColor: C.accent,
                      opacity: applying ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={styles.buttonText}>
                    {applying
                      ? "Applying..."
                      : "Apply Now"}
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleToggleSave}
                disabled={saving}
                style={[
                  styles.saveButton,
                  job.saved && {
                    backgroundColor: C.accentLight,
                    borderColor: C.accent,
                  },
                  {
                    opacity: saving ? 0.6 : 1,
                  },
                ]}
              >
                <Heart
                  size={18}
                  color={
                    job.saved ? C.accent : C.textSec
                  }
                  fill={
                    job.saved ? C.accent : "none"
                  }
                />

                <Text
                  style={[
                    styles.saveText,
                    job.saved && {
                      color: C.accentHover,
                    },
                  ]}
                >
                  {job.saved ? "Saved" : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <SectionTitle
              title="About the Role"
              color={activeColor}
            />

            <Text style={styles.description}>
              {job.description ||
                `We're looking for a ${job.title} to join our ${job.dept} team at ${job.company}. You'll be working on high-impact projects that shape how millions of users interact with our platform. This is an excellent opportunity for someone who thrives in a fast-paced, collaborative environment and is passionate about building exceptional products.`}
            </Text>
          </View>

          <View style={styles.card}>
            <SectionTitle
              title="Key Responsibilities"
              color={activeColor}
            />

            {responsibilities.length > 0 ? (
              <View style={styles.list}>
                {responsibilities.map(
                  (item: string, index: number) => (
                    <View
                      key={`${item}-${index}`}
                      style={styles.listItem}
                    >
                      <CheckCircle2
                        size={17}
                        color={activeColor}
                        style={styles.listIcon}
                      />

                      <Text style={styles.listText}>
                        {item}
                      </Text>
                    </View>
                  )
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No responsibilities specified.
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <SectionTitle
              title="Requirements & Skills"
              color={activeColor}
            />

            {requirements.length > 0 ? (
              <View style={styles.list}>
                {requirements.map(
                  (item: string, index: number) => (
                    <View
                      key={`${item}-${index}`}
                      style={styles.listItem}
                    >
                      <View style={styles.bullet} />

                      <Text style={styles.listText}>
                        {item}
                      </Text>
                    </View>
                  )
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No requirements specified.
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sideTitle}>
              Job Details
            </Text>

            <JobDetailRow
              icon={DollarSign}
              label="Salary"
              value={job.salary}
            />

            <JobDetailRow
              icon={MapPin}
              label="Location"
              value={job.location}
            />

            <JobDetailRow
              icon={Briefcase}
              label="Experience"
              value={formatExperienceRange(job.minExperienceYears, job.maxExperienceYears)}
            />

            <JobDetailRow
              icon={Clock}
              label="Posted"
              value={job.posted}
            />

            <JobDetailRow
              icon={Users}
              label="Applicants"
              value={
                job.applicants !== null &&
                job.applicants !== undefined
                  ? `${job.applicants} applied`
                  : null
              }
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sideTitle}>
              Required Skills
            </Text>

            {tags.length > 0 ? (
              <View style={styles.skillsRow}>
                {tags.map((tag: string) => (
                  <View
                    key={tag}
                    style={styles.skillBadge}
                  >
                    <Text style={styles.skillText}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No skills specified.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowWithdrawModal(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Withdraw Application
            </Text>

            <Text style={styles.modalDescription}>
              Are you sure you want to withdraw your
              application? This action cannot be undone.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() =>
                  setShowWithdrawModal(false)
                }
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmWithdraw}
                disabled={applying}
                style={[
                  styles.modalWithdraw,
                  {
                    opacity: applying ? 0.6 : 1,
                  },
                ]}
              >
                <Text style={styles.buttonText}>
                  {applying
                    ? "Withdrawing..."
                    : "Withdraw"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SectionTitle({
  title,
  color,
}: {
  title: string;
  color: string;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <View
        style={[
          styles.sectionAccent,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text style={styles.sectionTitle}>
        {title}
      </Text>
    </View>
  );
}

function JobDetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | number | null;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Icon size={15} color={C.accent} />
      </View>

      <View style={styles.detailInfo}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text style={styles.detailValue}>
          {value !== null &&
          value !== undefined &&
          String(value).trim() !== ""
            ? String(value)
            : "Not specified"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
    padding: 24,
  },

  loadingText: {
    fontFamily: F,
    fontSize: 14,
    color: C.textMuted,
  },

  errorText: {
    fontFamily: F,
    fontSize: 15,
    color: C.error,
    textAlign: "center",
    marginBottom: 20,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },

  backButtonText: {
    fontFamily: F,
    fontSize: 14,
    color: C.text,
    fontWeight: "600",
  },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingVertical: 4,
  },

  backText: {
    fontFamily: F,
    fontSize: 14,
    color: C.text,
    fontWeight: "600",
  },

  mainColumn: {
    gap: 16,
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },

  jobHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 20,
  },

  companyIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  companyLetter: {
    fontFamily: F,
    fontSize: 20,
    fontWeight: "700",
  },

  jobHeaderInfo: {
    flex: 1,
  },

  jobTitle: {
    fontFamily: F,
    fontSize: 20,
    fontWeight: "700",
    color: C.text,
    marginBottom: 4,
  },

  companyText: {
    fontFamily: F,
    fontSize: 14,
    color: C.textSec,
    marginBottom: 10,
  },

  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },

  statusText: {
    fontFamily: F,
    fontSize: 11,
    fontWeight: "600",
  },

  grayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: C.divider,
    borderRadius: 99,
  },

  grayBadgeText: {
    fontFamily: F,
    fontSize: 11,
    color: C.textSec,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  applyButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  buttonText: {
    fontFamily: F,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  saveButton: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  saveText: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "600",
    color: C.textSec,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },

  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },

  sectionTitle: {
    fontFamily: F,
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },

  description: {
    fontFamily: F,
    fontSize: 14,
    lineHeight: 24,
    color: C.textSec,
  },

  list: {
    gap: 13,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },

  listIcon: {
    marginTop: 2,
  },

  listText: {
    flex: 1,
    fontFamily: F,
    fontSize: 14,
    lineHeight: 21,
    color: C.textSec,
  },

  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.textMuted,
    marginTop: 8,
  },

  emptyText: {
    fontFamily: F,
    fontSize: 13,
    color: C.textMuted,
  },

  sideTitle: {
    fontFamily: F,
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    marginBottom: 16,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },

  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: C.accentLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  detailInfo: {
    flex: 1,
  },

  detailLabel: {
    fontFamily: F,
    fontSize: 11,
    color: C.textMuted,
    fontWeight: "500",
    marginBottom: 2,
  },

  detailValue: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
  },

  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: C.accentLight,
    borderRadius: 99,
  },

  skillText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
    color: C.accentHover,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
  },

  modalTitle: {
    fontFamily: F,
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    textAlign: "center",
    marginBottom: 10,
  },

  modalDescription: {
    fontFamily: F,
    fontSize: 14,
    lineHeight: 21,
    color: C.textSec,
    textAlign: "center",
    marginBottom: 24,
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
  },

  modalCancel: {
    flex: 1,
    minHeight: 44,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  modalCancelText: {
    fontFamily: F,
    color: C.text,
    fontSize: 13,
    fontWeight: "600",
  },

  modalWithdraw: {
    flex: 1,
    minHeight: 44,
    borderRadius: 11,
    backgroundColor: C.danger,
    alignItems: "center",
    justifyContent: "center",
  },
});
