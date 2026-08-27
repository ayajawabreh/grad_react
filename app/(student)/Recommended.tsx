import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import {
  MapPin,
  DollarSign,
  Heart,
  ChevronRight,
} from "lucide-react-native";

import { C, F } from "../../constants/tokens";
import { API } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";
import { formatExperienceRange } from "../../imports/jobs";

interface Job {
  id?: number;
  job_id: number;
  title: string;
  location?: string;
  salary?: number | string;
  employment_type?: string;
  work_mode?: string;
  match?: number;
  match_score?: number;
  recommendation_level?: string;
  level_match?: boolean | null;
  matching_skills?: string[];
  missing_skills?: string[];
  reasons?: string[];
  warnings?: string[];
  breakdown?: Record<string, { score?: number; max_weight?: number; applicable?: boolean; reason?: string } | null>;
  match_source?: string;
  min_experience_years?: number | null;
  max_experience_years?: number | null;
  color?: string;
  company?: string | {
    company_name?: string;
    name?: string;
  };
  is_saved?: boolean;
  category?: { name?: string };
}

export default function Recommended() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<Job | null>(null);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadRecommendedJobs();
  }, []);

  const loadRecommendedJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get(
        "/student/recommended-jobs",
        { timeout: 15000 }
      );

      const data: Job[] = Array.isArray(res.data)
        ? res.data
        : res.data.jobs || [];

      setJobs([...data].sort((a, b) => Number(b.match ?? 0) - Number(a.match ?? 0)));
    } catch (error: any) {
      console.error(
        "Error fetching recommended jobs:",
        error
      );
      setError(error?.response?.data?.message || "Could not load recommended jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useSyncRefresh(["jobs", "student", "resume"], loadRecommendedJobs);

  const handleSave = async (
    jobId: number,
    isSaved: boolean
  ) => {
    if (savingIds.has(jobId)) return;
    const previousJobs = jobs;
    setSavingIds((current) => new Set(current).add(jobId));
    setJobs((current) => current.map((job) => (job.job_id ?? job.id) === jobId ? { ...job, is_saved: !isSaved } : job));
    try {
      if (isSaved) {
        await API.delete(`/jobs/${jobId}/save`);
      } else {
        await API.post(`/jobs/${jobId}/save`);
      }

    } catch (error) {
      console.error("Save error:", error);
      setJobs(previousJobs);
    } finally {
      setSavingIds((current) => { const next = new Set(current); next.delete(jobId); return next; });
    }
  };

  const getLevelColor = (level?: string) => {
    switch ((level || "").toLowerCase()) {
      case "excellent": case "strong match": return C.success;
      case "good": case "good match": return "#2563EB";
      case "fair": case "moderate match": return C.warning;
      case "low match": return C.danger;
      default: return "#64748B";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={C.accent}
        />

        <Text style={styles.loadingText}>
          Analyzing your profile for personalized matches...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            Recommended for You
          </Text>

          <Text style={styles.subtitle}>
            Personalized matches based on your profile,
            skills, and preferences
          </Text>
        </View>

        {error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Could not load recommendations</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadRecommendedJobs}><Text style={styles.retryText}>Retry</Text></Pressable>
          </View>
        ) : jobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No recommendations found
            </Text>

            <Text style={styles.emptyText}>
              We could not find any suitable jobs for you
              at the moment.
            </Text>
          </View>
        ) : (
          <View style={styles.jobsContainer}>
            {jobs.map((job, index) => {
              const jobId = job.job_id ?? job.id;
              const companyName =
                typeof job.company === "string"
                  ? job.company
                  : job.company?.company_name || job.company?.name || "Unknown Company";

              const initialLetter =
                companyName.charAt(0).toUpperCase() || "J";

              const jobColor =
                job.color || C.accent;

              const matchScore = Number(job.match ?? 0);

              const matchColor = getLevelColor(job.recommendation_level);

              const salary =
                job.salary &&
                !isNaN(Number(job.salary))
                  ? `$${Number(
                      job.salary
                    ).toLocaleString()}`
                  : "Competitive";

              const whyMatches = Array.isArray(job.reasons) ? job.reasons : [];
              const matchingSkills = Array.isArray(job.matching_skills) ? job.matching_skills : [];
              const missingSkills = Array.isArray(job.missing_skills) ? job.missing_skills : [];
              return (
                <View
                  key={jobId || index}
                  style={styles.jobCard}
                >
                  <View style={styles.jobTopRow}>
                    <View
                      style={[
                        styles.companyIcon,
                        {
                          backgroundColor:
                            `${jobColor}18`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.companyInitial,
                          {
                            color: jobColor,
                          },
                        ]}
                      >
                        {initialLetter}
                      </Text>
                    </View>

                    <View style={styles.jobInfo}>
                      <Text
                        style={styles.jobTitle}
                        numberOfLines={2}
                      >
                        {job.title}
                      </Text>

                      <Text
                        style={styles.companyName}
                        numberOfLines={1}
                      >
                        {companyName}
                      </Text>

                      <Text style={styles.categoryName}>{job.category?.name || "Uncategorized"}</Text>

                      <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                          <MapPin
                            size={13}
                            color={C.textSec}
                          />

                          <Text
                            style={styles.detailText}
                            numberOfLines={1}
                          >
                            {job.location ||
                              "Location not specified"}
                          </Text>
                        </View>

                        <View style={styles.detailItem}>
                          <DollarSign
                            size={13}
                            color={C.textSec}
                          />

                          <Text style={styles.detailText}>
                            {salary}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.typeBadge}>
                        <Text
                          style={styles.typeBadgeText}
                        >
                          {[job.employment_type, job.work_mode].filter(Boolean).join(" · ") || "Not specified"}
                        </Text>
                      </View>
                    </View>

                    <Pressable style={styles.matchContainer} onPress={() => setSelectedMatch(job)}>
                      <View
                        style={[
                          styles.matchCircle,
                          {
                            borderColor:
                              matchColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.matchScore,
                            {
                              color: matchColor,
                            },
                          ]}
                        >
                          {matchScore}%
                        </Text>
                      </View>

                      <Text style={styles.matchLabel}>
                        {job.recommendation_level || "Match"}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.whyCard}>
                    <Text style={styles.whyTitle}>
                      WHY THIS MATCHES
                    </Text>

                    {whyMatches.length === 0 && (
                      <Text style={styles.reasonText}>{matchScore > 0 ? "This recommendation is based on your current profile." : "No strong match found with your current profile yet."}</Text>
                    )}
                    {whyMatches.map(
                      (item, itemIndex) => (
                        <View
                          key={itemIndex}
                          style={styles.reasonRow}
                        >
                          <View
                            style={[
                              styles.reasonDot,
                              {
                                backgroundColor:
                                  matchColor,
                              },
                            ]}
                          />

                          <Text
                            style={styles.reasonText}
                          >
                            {item}
                          </Text>
                        </View>
                      )
                    )}

                    <Text style={styles.experienceText}>
                      {formatExperienceRange(job.min_experience_years, job.max_experience_years)}
                    </Text>

                    {matchingSkills.length > 0 && (
                      <Text style={styles.skillSummary}>Matching skills: {matchingSkills.join(", ")}</Text>
                    )}
                    {missingSkills.length > 0 && (
                      <Text style={styles.warningText}>Missing skills: {missingSkills.join(", ")}</Text>
                    )}
                    {Array.isArray(job.warnings) && job.warnings.map((warning, warningIndex) => (
                      <Text key={`warning-${warningIndex}`} style={styles.warningText}>{warning}</Text>
                    ))}
                  </View>

                  <View style={styles.actions}>
                    <Pressable
                      onPress={() =>
                        handleSave(
                          jobId!,
                          !!job.is_saved
                        )
                      }
                      style={({ pressed }) => [
                        styles.saveButton,
                        {
                          borderColor:
                            job.is_saved
                              ? C.accent
                              : C.border,
                          opacity: pressed
                            ? 0.7
                            : 1,
                        },
                      ]}
                    >
                      <Heart
                        size={17}
                        color={
                          job.is_saved
                            ? C.accent
                            : C.textSec
                        }
                        fill={
                          job.is_saved
                            ? C.accent
                            : "none"
                        }
                      />

                      <Text
                        style={[
                          styles.saveText,
                          {
                            color:
                              job.is_saved
                                ? C.accent
                                : C.textSec,
                          },
                        ]}
                      >
                        {job.is_saved
                          ? "Saved"
                          : "Save"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        jobId && router.push(`/(student)/JobDetails?id=${jobId}&from=recommended`)
                      }
                      style={({ pressed }) => [
                        styles.viewButton,
                        {
                          opacity: pressed
                            ? 0.8
                            : 1,
                        },
                      ]}
                    >
                      <Text style={styles.viewText}>
                        View
                      </Text>

                      <ChevronRight
                        size={16}
                        color="#FFFFFF"
                      />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selectedMatch} transparent animationType="slide" onRequestClose={() => setSelectedMatch(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedMatch(null)}>
          <Pressable style={styles.matchSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>How the match score was calculated</Text>
            {Object.entries(selectedMatch?.breakdown ?? {}).filter(([, item]) => item?.applicable === true).map(([criterion, item]) => {
              const score = Number(item?.score ?? 0);
              const max = Number(item?.max_weight ?? 0);
              return <View key={criterion} style={styles.criteriaRow}>
                <View style={styles.criteriaHeader}><Text style={styles.criteriaName}>{criterion.replace(/_/g, " ")}</Text><Text style={styles.criteriaScore}>{score}/{max}</Text></View>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${max > 0 ? Math.min(100, (score / max) * 100) : 0}%` }]} /></View>
              </View>;
            })}
            <Text style={styles.officialMatch}>Official match: {Number(selectedMatch?.match ?? 0)}%</Text>
            <Pressable style={styles.closeButton} onPress={() => setSelectedMatch(null)}><Text style={styles.closeText}>Close</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: C.bg,
  },

  loadingText: {
    marginTop: 14,
    fontFamily: F,
    fontSize: 14,
    fontWeight: "600",
    color: C.textSec,
    textAlign: "center",
  },

  header: {
    marginBottom: 22,
  },

  title: {
    fontFamily: F,
    fontSize: 24,
    fontWeight: "900",
    color: C.text,
  },

  subtitle: {
    marginTop: 7,
    fontFamily: F,
    fontSize: 13.5,
    lineHeight: 20,
    color: C.textSec,
  },

  jobsContainer: {
    gap: 14,
  },

  jobCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },

  jobTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  companyIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  companyInitial: {
    fontFamily: F,
    fontSize: 18,
    fontWeight: "800",
  },

  jobInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    marginRight: 10,
  },

  jobTitle: {
    fontFamily: F,
    fontSize: 15,
    fontWeight: "800",
    color: C.text,
  },

  companyName: {
    marginTop: 3,
    fontFamily: F,
    fontSize: 12.5,
    color: C.textSec,
  },

  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 9,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "100%",
  },

  detailText: {
    fontFamily: F,
    fontSize: 11.5,
    color: C.textSec,
    flexShrink: 1,
  },

  typeBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: C.divider,
  },

  typeBadgeText: {
    fontFamily: F,
    fontSize: 10.5,
    color: C.textSec,
    fontWeight: "600",
  },

  matchContainer: {
    alignItems: "center",
    width: 62,
  },

  matchCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  matchScore: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "900",
  },

  matchLabel: {
    marginTop: 4,
    fontFamily: F,
    fontSize: 9.5,
    color: C.textMuted,
    fontWeight: "600",
  },

  whyCard: {
    marginTop: 15,
    backgroundColor: C.bg,
    borderRadius: 11,
    padding: 12,
  },

  whyTitle: {
    fontFamily: F,
    fontSize: 10,
    fontWeight: "800",
    color: C.textSec,
    letterSpacing: 0.5,
    marginBottom: 7,
  },

  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
  },

  reasonDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 8,
  },

  reasonText: {
    flex: 1,
    fontFamily: F,
    fontSize: 11.5,
    lineHeight: 17,
    color: C.textSec,
  },

  categoryName: {
    marginTop: 3,
    fontFamily: F,
    fontSize: 11,
    color: C.accent,
    fontWeight: "600",
  },

  experienceText: {
    marginTop: 8,
    fontFamily: F,
    fontSize: 11.5,
    fontWeight: "700",
    color: C.text,
  },

  skillSummary: {
    marginTop: 6,
    fontFamily: F,
    fontSize: 11.5,
    lineHeight: 17,
    color: C.success,
  },

  warningText: {
    marginTop: 5,
    fontFamily: F,
    fontSize: 11.5,
    lineHeight: 17,
    color: C.warning,
  },

  retryButton: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: C.accent },
  retryText: { fontFamily: F, fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.45)" },
  matchSheet: { maxHeight: "80%", padding: 22, paddingBottom: 30, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: C.surface },
  sheetTitle: { fontFamily: F, fontSize: 18, fontWeight: "800", color: C.text, marginBottom: 18 },
  criteriaRow: { marginBottom: 14 },
  criteriaHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  criteriaName: { fontFamily: F, fontSize: 12, fontWeight: "700", color: C.text, textTransform: "capitalize" },
  criteriaScore: { fontFamily: F, fontSize: 11.5, color: C.textSec },
  progressTrack: { height: 7, borderRadius: 4, overflow: "hidden", backgroundColor: C.divider },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: C.accent },
  officialMatch: { marginTop: 8, fontFamily: F, fontSize: 13, fontWeight: "800", color: C.text },
  closeButton: { marginTop: 20, minHeight: 44, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: C.accent },
  closeText: { fontFamily: F, fontSize: 13, fontWeight: "800", color: "#FFFFFF" },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },

  saveButton: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  saveText: {
    fontFamily: F,
    fontSize: 11.5,
    fontWeight: "700",
  },

  viewButton: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 9,
    backgroundColor: C.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  viewText: {
    fontFamily: F,
    fontSize: 11.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  emptyCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 35,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },

  emptyTitle: {
    fontFamily: F,
    fontSize: 16,
    fontWeight: "800",
    color: C.text,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 7,
    fontFamily: F,
    fontSize: 13,
    lineHeight: 19,
    color: C.textSec,
    textAlign: "center",
  },
});
