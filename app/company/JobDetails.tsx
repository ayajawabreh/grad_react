import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { C, F } from "../../constants/tokens";
import { getJobDetails, getJobApplicants } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";
import { formatExperienceRange } from "../../imports/jobs";

const { width } = Dimensions.get("window");

export default function CompanyJobDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [job, setJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
      try {
        if (!id) return;

        const jobData = await getJobDetails(Number(id));
        setJob(jobData);

        try {
          const applicantsData = await getJobApplicants();
          const allApplicants = Array.isArray(applicantsData?.data)
            ? applicantsData.data
            : Array.isArray(applicantsData)
              ? applicantsData
              : [];
          setApplicants(
            allApplicants.filter((applicant: any) => {
              const applicantJobId =
                applicant.job_id ??
                applicant.job?.id ??
                applicant.job_post_id;
              return !applicantJobId || String(applicantJobId) === String(id);
            }),
          );
        } catch (err) {
          console.error("Error fetching applicants:", err);
          setApplicants([]);
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
  }, [id]);

  useSyncRefresh(["applications", "jobs", "student", "resume"], loadData, { jobId: id });
  useEffect(() => { void loadData(); }, [loadData]);

  /* -------------------- Loading -------------------- */

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  /* -------------------- Job Not Found -------------------- */

  if (!job) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={C.textSec}
        />

        <Text style={styles.notFoundTitle}>Job not found</Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/company/ManageJobs")}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text style={styles.backButtonText}>Back to Jobs</Text>
        </Pressable>
      </View>
    );
  }

  /* -------------------- Data -------------------- */

  const weeklyData = job.weekly_data ?? [];

  const recentApplicantsList =
    job.recent_applicants ?? applicants;

  const totalApplicantsCount =
    job.stats?.applicants ??
    job.applicants_count ??
    (applicants.length > 0 ? applicants.length : 0);

  const stats = {
    applied:
      job.stats?.applicants ??
      totalApplicantsCount,

    interview:
      job.stats?.interview ??
      applicants.filter(
        (a: any) => a.status === "Interview"
      ).length,

    shortlisted:
      job.stats?.shortlisted ??
      applicants.filter(
        (a: any) =>
          a.status === "Shortlisted" ||
          a.is_shortlisted
      ).length,

    hired:
      job.stats?.hired ??
      applicants.filter(
        (a: any) => a.status === "Hired"
      ).length,
  };

  const pipelineCards = [
    {
      title: "Applied",
      value: stats.applied,
      color: C.info,
      icon: "document-text-outline" as const,
    },
    {
      title: "Interview",
      value: stats.interview,
      color: C.purple,
      icon: "people-outline" as const,
    },
    {
      title: "Shortlisted",
      value: stats.shortlisted,
      color: C.accent,
      icon: "star-outline" as const,
    },
    {
      title: "Hired",
      value: stats.hired,
      color: "#2A6B54",
      icon: "checkmark-circle-outline" as const,
    },
  ];

  const companyLetter =
    job.company?.company_name?.[0] ??
    job.title?.[0] ??
    "C";

  const conversion =
    job.views > 0
      ? `${Math.round(
          (totalApplicantsCount / job.views) * 100
        )}%`
      : "0%";

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* =====================================================
            HEADER
        ====================================================== */}

        <Pressable
          onPress={() => router.replace("/company/ManageJobs")}
          style={styles.backRow}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={C.text}
          />

          <Text style={styles.backText}>
            Back to Jobs
          </Text>
        </Pressable>

        {/* =====================================================
            JOB HEADER
        ====================================================== */}

        <View style={styles.jobCard}>
          <View style={styles.jobHeader}>
            {/* Company Logo */}

            <View style={styles.companyLogo}>
              <Text style={styles.companyLetter}>
                {companyLetter}
              </Text>
            </View>

            {/* Job Information */}

            <View style={styles.jobInfo}>
              <View style={styles.titleRow}>
                <Text
                  style={styles.jobTitle}
                  numberOfLines={2}
                >
                  {job.title}
                </Text>

                <View style={styles.openBadge}>
                  <Text style={styles.openBadgeText}>
                    Open
                  </Text>
                </View>
              </View>

              <Text style={styles.jobMeta}>
                {[job.location, job.employment_type]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>

              <Text style={styles.jobMeta}>
                {formatExperienceRange(job.min_experience_years, job.max_experience_years)}
              </Text>

              {/* Skills */}

              <View style={styles.skillsContainer}>
                {(job.skills ?? []).map(
                  (skill: any, index: number) => (
                    <View
                      key={
                        skill.id ??
                        skill.name ??
                        index
                      }
                      style={styles.skillBadge}
                    >
                      <Text style={styles.skillText}>
                        {skill.name ?? skill}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </View>
          </View>

          {/* Actions */}

          <View style={styles.jobActions}>
            <Pressable
              style={styles.primaryButton}
              onPress={() =>
                router.push({ pathname: "/company/Shortlisted", params: { id: String(job.id) } })
              }
            >
              <Ionicons
                name="person-add-outline"
                size={17}
                color="#fff"
              />

              <Text style={styles.primaryButtonText}>
                View Shortlisted Candidates
              </Text>
            </Pressable>

            <Pressable
              style={styles.outlineButton}
              onPress={() =>
                router.push({ pathname: "/company/EditJob", params: { id: String(job.id) } })
              }
            >
              <Ionicons
                name="create-outline"
                size={17}
                color={C.text}
              />

              <Text style={styles.outlineButtonText}>
                Edit Job
              </Text>
            </Pressable>
          </View>
        </View>

        {/* =====================================================
            APPLICATION PIPELINE
        ====================================================== */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Application Pipeline
          </Text>

          <View style={styles.pipelineGrid}>
            {pipelineCards.map((item) => (
              <View
                key={item.title}
                style={styles.pipelineCard}
              >
                <View
                  style={[
                    styles.pipelineIcon,
                    {
                      backgroundColor:
                        `${item.color}18`,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.color}
                  />
                </View>

                <Text
                  style={[
                    styles.pipelineValue,
                    { color: item.color },
                  ]}
                >
                  {item.value}
                </Text>

                <Text style={styles.pipelineTitle}>
                  {item.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* =====================================================
            JOB PERFORMANCE
        ====================================================== */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Job Performance
          </Text>

          <View style={styles.performanceGrid}>
            <PerformanceCard
              icon="eye-outline"
              title="Total Views"
              value={job.views ?? 0}
              color={C.info}
            />

            <PerformanceCard
              icon="people-outline"
              title="Applicants"
              value={totalApplicantsCount}
              color={C.accent}
            />

            <PerformanceCard
              icon="trending-up-outline"
              title="Conversion"
              value={conversion}
              color={C.success}
            />
          </View>
        </View>

        {/* =====================================================
            WEEKLY APPLICATIONS
        ====================================================== */}

        {weeklyData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              Weekly Applications Overview
            </Text>

            <View style={styles.chart}>
              {weeklyData.map(
                (item: any, index: number) => {
                  const maxValue = Math.max(
                    ...weeklyData.map(
                      (x: any) => Number(x.apps) || 0
                    ),
                    1
                  );

                  const value =
                    Number(item.apps) || 0;

                  const barHeight =
                    (value / maxValue) * 120;

                  return (
                    <View
                      key={index}
                      style={styles.chartColumn}
                    >
                      <Text style={styles.chartValue}>
                        {value}
                      </Text>

                      <View
                        style={[
                          styles.chartBar,
                          {
                            height:
                              Math.max(
                                barHeight,
                                4
                              ),
                          },
                        ]}
                      />

                      <Text
                        style={styles.chartLabel}
                        numberOfLines={1}
                      >
                        {item.day}
                      </Text>
                    </View>
                  );
                }
              )}
            </View>
          </View>
        )}

        {/* =====================================================
            RECENT APPLICANTS
        ====================================================== */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Recent Applicants
          </Text>

          {recentApplicantsList.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="people-outline"
                size={38}
                color={C.textSec}
              />

              <Text style={styles.emptyText}>
                No applicants yet for this job.
              </Text>
            </View>
          ) : (
            <View style={styles.applicantsContainer}>
              {recentApplicantsList.map(
                (c: any) => {
                  const formattedCandidate = {
                    ...c,

                    name:
                      c.name ??
                      c.student?.user?.name ??
                      c.user?.name ??
                      "Applicant",

                    headline:
                      c.headline ??
                      c.student?.headline ??
                      c.role ??
                      "",

                    match:
                      c.match ??
                      c.match_score ??
                      c.pivot?.match_score ??
                      0,

                    avatar:
                      c.avatar ??
                      c.student?.user?.avatar ??
                      c.profile_photo_url ??
                      null,
                  };

                  return (
                    <MobileCandidateCard
                      key={c.id}
                      candidate={
                        formattedCandidate
                      }
                      onView={() =>
                        router.push({
                          pathname: "/company/CandidateDetails",
                          params: { id: String(c.id) },
                        })
                      }
                    />
                  );
                }
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ============================================================
   PERFORMANCE CARD
============================================================ */

function PerformanceCard({
  icon,
  title,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <View style={styles.performanceCard}>
      <View
        style={[
          styles.performanceIcon,
          {
            backgroundColor: `${color}18`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={color}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.performanceTitle}>
          {title}
        </Text>

        <Text style={styles.performanceValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
   MOBILE CANDIDATE CARD
============================================================ */

function MobileCandidateCard({
  candidate,
  onView,
}: {
  candidate: any;
  onView: () => void;
}) {
  return (
    <Pressable
      onPress={onView}
      style={({ pressed }) => [
        styles.candidateCard,
        pressed && {
          opacity: 0.8,
        },
      ]}
    >
      {/* Avatar */}

      <View style={styles.candidateAvatar}>
        <Text style={styles.candidateAvatarText}>
          {candidate.name?.[0]?.toUpperCase() ??
            "A"}
        </Text>
      </View>

      {/* Information */}

      <View style={styles.candidateInfo}>
        <Text
          style={styles.candidateName}
          numberOfLines={1}
        >
          {candidate.name}
        </Text>

        <Text
          style={styles.candidateHeadline}
          numberOfLines={2}
        >
          {candidate.headline ||
            "No headline"}
        </Text>

        <View style={styles.candidateBottom}>
          <View style={styles.matchBadge}>
            <Ionicons
              name="sparkles-outline"
              size={12}
              color={C.accent}
            />

            <Text style={styles.matchText}>
              {candidate.match ?? 0}% match
            </Text>
          </View>

          {candidate.status && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {candidate.status}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={C.textSec}
      />
    </Pressable>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 36,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
    padding: 24,
  },

  loadingText: {
    marginTop: 10,
    fontFamily: F,
    fontSize: 14,
    color: C.textSec,
  },

  notFoundTitle: {
    marginTop: 12,
    fontFamily: F,
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
  },

  /* Back */

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },

  backText: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
  },

  backButton: {
    marginTop: 20,
    backgroundColor: C.accent,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  backButtonText: {
    color: "#fff",
    fontFamily: F,
    fontSize: 13,
    fontWeight: "600",
  },

  /* Job Card */

  jobCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },

  jobHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${C.accent}18`,
    borderWidth: 1,
    borderColor: `${C.accent}33`,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  companyLetter: {
    fontFamily: F,
    fontSize: 20,
    fontWeight: "700",
    color: C.accent,
  },

  jobInfo: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  jobTitle: {
    flex: 1,
    fontFamily: F,
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
  },

  openBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: `${C.success}15`,
  },

  openBadgeText: {
    fontFamily: F,
    fontSize: 10,
    fontWeight: "700",
    color: C.success,
  },

  jobMeta: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    marginTop: 8,
  },

  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },

  skillBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: C.accentLight,
  },

  skillText: {
    fontFamily: F,
    fontSize: 10,
    fontWeight: "500",
    color: C.accentHover,
  },

  /* Actions */

  jobActions: {
    gap: 9,
    marginTop: 16,
  },

  primaryButton: {
    width: "100%",
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 10,
  },

  primaryButtonText: {
    fontFamily: F,
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  outlineButton: {
    width: "100%",
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  outlineButtonText: {
    fontFamily: F,
    color: C.text,
    fontSize: 12,
    fontWeight: "600",
  },

  /* Sections */

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontFamily: F,
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    marginBottom: 12,
  },

  /* Pipeline */

  pipelineGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  pipelineCard: {
    width: (width - 38) / 2,
    minHeight: 112,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  },

  pipelineIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  pipelineValue: {
    fontFamily: F,
    fontSize: 22,
    fontWeight: "700",
  },

  pipelineTitle: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    fontWeight: "500",
    marginTop: 2,
  },

  /* Performance */

  performanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  performanceCard: {
    width: (width - 38) / 2,
    minHeight: 92,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  performanceIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  performanceTitle: {
    fontFamily: F,
    fontSize: 11,
    color: C.textSec,
    marginBottom: 3,
  },

  performanceValue: {
    fontFamily: F,
    fontSize: 19,
    fontWeight: "700",
    color: C.text,
  },

  /* Chart */

  chartCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 22,
  },

  chartTitle: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "600",
    color: C.textSec,
    marginBottom: 18,
  },

  chart: {
    height: 180,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingHorizontal: 4,
  },

  chartColumn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    marginHorizontal: 3,
  },

  chartValue: {
    fontFamily: F,
    fontSize: 9,
    color: C.textSec,
    marginBottom: 4,
  },

  chartBar: {
    width: 22,
    minHeight: 4,
    backgroundColor: C.accent,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },

  chartLabel: {
    fontFamily: F,
    fontSize: 9,
    color: C.textSec,
    marginTop: 7,
    maxWidth: 35,
  },

  /* Applicants */

  applicantsContainer: {
    gap: 10,
  },

  candidateCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  candidateAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${C.accent}18`,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  candidateAvatarText: {
    fontFamily: F,
    fontSize: 18,
    fontWeight: "700",
    color: C.accent,
  },

  candidateInfo: {
    flex: 1,
  },

  candidateName: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    marginBottom: 3,
  },

  candidateHeadline: {
    fontFamily: F,
    fontSize: 11,
    color: C.textSec,
    lineHeight: 16,
  },

  candidateBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 8,
    flexWrap: "wrap",
  },

  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: `${C.accent}15`,
  },

  matchText: {
    fontFamily: F,
    fontSize: 9,
    fontWeight: "700",
    color: C.accent,
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: `${C.info}15`,
  },

  statusText: {
    fontFamily: F,
    fontSize: 9,
    fontWeight: "600",
    color: C.info,
  },

  /* Empty */

  emptyCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 30,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontFamily: F,
    color: C.textSec,
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
});
