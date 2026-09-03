import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { API } from "../../imports/api";
import { fetchSavedJobs } from "../../imports/jobs";
import { useSyncRefresh } from "../../context/SyncContext";

const COLORS = {
  bg: "#F8F8F6",
  surface: "#FFFFFF",
  text: "#181B1F",
  textSec: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  divider: "#F1F2F4",

  accent: "#C8A46A",
  accentLight: "#F5EDD8",

  success: "#22C55E",
  info: "#3B82F6",
  purple: "#C8A46A",
};

type Stats = {
  applications: string;
  interviews: string;
  saved: string;
};

type Job = {
  id: number;
  title?: string;
  company?: {
    name?: string;
    logo?: string;
  };
  company_name?: string;
  location?: string;
  type?: string;
  employment_type?: string;
  salary?: string;
  description?: string;
  match_percentage?: number | string;
  match_score?: number | string;
  match?: number | string;
};

const trendData = [
  { month: "Jan", v: 2 },
  { month: "Feb", v: 4 },
  { month: "Mar", v: 3 },
  { month: "Apr", v: 7 },
  { month: "May", v: 5 },
  { month: "Jun", v: 9 },
];

export default function Dashboard() {
  const [userName, setUserName] = useState("Student");

  const [stats, setStats] = useState<Stats>({
    applications: "0",
    interviews: "0",
    saved: "0",
  });

  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [
        userResult,
        dashboardResult,
        jobsResult,
        savedJobsResult,
      ] = await Promise.allSettled([
        API.get("/user"),
        API.get("/student/dashboard"),
        API.get("/student/recommended-jobs"),
        fetchSavedJobs(),
      ]);

      const userData =
        userResult.status === "fulfilled"
          ? userResult.value.data
          : null;
      const dashboardData =
        dashboardResult.status === "fulfilled"
          ? dashboardResult.value.data
          : null;
      const jobsData =
        jobsResult.status === "fulfilled"
          ? jobsResult.value.data
          : [];
      const savedJobs =
        savedJobsResult.status === "fulfilled"
          ? savedJobsResult.value
          : [];

      const name =
        userData?.name ??
        userData?.user?.name ??
        userData?.data?.name;

      if (name) {
        setUserName(name);
      }

      let applications = "0";
      let interviews = "0";
      if (dashboardData?.stats) {
        const s = dashboardData.stats;

        applications = String(
          s.applications ??
            s.applications_count ??
            "0"
        );

        interviews = String(
          s.interviews ??
            s.interviews_count ??
            "0"
        );

      } else if (dashboardData) {
        applications = String(
          dashboardData.applications_count ??
            dashboardData.applications ??
            "0"
        );

        interviews = String(
          dashboardData.interviews_count ??
            dashboardData.interviews ??
            "0"
        );

      }

      setStats({
        applications,
        interviews,
        saved: String(savedJobs.length),
      });

      if (Array.isArray(jobsData)) {
        setRecommendedJobs(jobsData);
      } else if (Array.isArray(jobsData?.jobs)) {
        setRecommendedJobs(jobsData.jobs);
      } else if (Array.isArray(jobsData?.data)) {
        setRecommendedJobs(jobsData.data);
      }
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error(
          "Error fetching dashboard data:",
          error
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useSyncRefresh(["student", "jobs", "applications", "interviews"], fetchDashboardData);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSaveToggle = (
    _jobId: string,
    isSavedNow: boolean
  ) => {
    setStats((prev) => ({
      ...prev,
      saved: String(
        Math.max(
          0,
          Number(prev.saved) +
            (isSavedNow ? 1 : -1)
        )
      ),
    }));
  };

  const openJob = (job: Job) => {
    router.push({
      pathname: "/(student)/JobDetails",
      params: {
        jobId: String(job.id),
      },
    });
  };

  const jobMatchesCount = recommendedJobs.filter(
    (job) =>
      Number(
        job.match_percentage ??
          job.match_score ??
          job.match ??
          0
      ) >= 70
  ).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.accent}
        />

        <Text style={styles.loadingText}>
          Loading Dashboard Data...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            Welcome back, {userName} 👋
          </Text>

          <Text style={styles.subtitle}>
            Here&apos;s what&apos;s happening with your job
            search today.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Applications"
            value={stats.applications}
            trend="+12%"
            icon="briefcase-outline"
            iconColor={COLORS.info}
          />

          <StatCard
            label="Interviews"
            value={stats.interviews}
            trend="+50%"
            icon="book-outline"
            iconColor={COLORS.purple}
          />

          <StatCard
            label="Saved Jobs"
            value={stats.saved}
            icon="heart-outline"
            iconColor={COLORS.accent}
          />

          <StatCard
            label="Job Matches"
            value={String(jobMatchesCount)}
            subtitle="Jobs matching your skills"
            icon="sparkles-outline"
            iconColor="#7C3AED"
            onPress={() => router.push("/(student)/Recommended")}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Application Activity
            </Text>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {trendData.map((item, index) => {
                const max = 10;

                const height = Math.max(
                  10,
                  (item.v / max) * 130
                );

                return (
                  <View
                    key={`${item.month}-${index}`}
                    style={styles.chartColumn}
                  >
                    <Text style={styles.chartValue}>
                      {item.v}
                    </Text>

                    <View
                      style={[
                        styles.chartBar,
                        {
                          height,
                        },
                      ]}
                    />

                    <Text style={styles.chartLabel}>
                      {item.month}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.chartLine}>
              <Text style={styles.chartAxis}>
                0
              </Text>

              <Text style={styles.chartAxis}>
                5
              </Text>

              <Text style={styles.chartAxis}>
                10
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Recommended for You
            </Text>

            <Pressable
              onPress={() =>
                router.push(
                  "/(student)/Recommended"
                )
              }
            >
              <Text style={styles.viewAll}>
                View all →
              </Text>
            </Pressable>
          </View>

          {recommendedJobs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="search-outline"
                size={30}
                color={COLORS.textMuted}
              />

              <Text style={styles.emptyText}>
                No recommendations found at
                the moment.
              </Text>

              <Text style={styles.emptySubtext}>
                Try updating your profile or
                fields of interest!
              </Text>
            </View>
          ) : (
            <View style={styles.jobsContainer}>
              {recommendedJobs
                .slice(0, 3)
                .map((job, index) => (
                  <JobCard
                    key={job.id ?? index}
                    job={job}
                    onView={() =>
                      openJob(job)
                    }
                    onSave={
                      handleSaveToggle
                    }
                  />
                ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>

          <View style={styles.actionsGrid}>
            <QuickAction
              label="Browse Jobs"
              icon="search-outline"
              onPress={() =>
                router.push(
                  "/(student)/JobDiscovery"
                )
              }
            />

            <QuickAction
              label="Build Resume"
              icon="document-text-outline"
              onPress={() =>
                router.push(
                  "/(student)/Resume"
                )
              }
            />

            <QuickAction
              label="My Applications"
              icon="briefcase-outline"
              onPress={() =>
                router.push(
                  "/(student)/Applications"
                )
              }
            />

            <QuickAction
              label="AI Assistant"
              icon="sparkles-outline"
              onPress={() =>
                router.push(
                  "/(student)/AIAssistant"
                )
              }
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  trend,
  icon,
  iconColor,
  subtitle,
  onPress,
}: {
  label: string;
  value: string;
  trend?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.statCard, pressed && onPress && styles.statCardPressed]}
    >
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: `${iconColor}15`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={iconColor}
        />
      </View>

      <Text style={styles.statLabel}>
        {label}
      </Text>

      <View style={styles.statBottom}>
        <Text style={styles.statValue}>
          {value}
        </Text>

        {trend && (
          <Text
            style={[
              styles.statTrend,
              {
                color: COLORS.success,
              },
            ]}
          >
            {trend}
          </Text>
        )}
      </View>
      {subtitle ? <Text style={[styles.statSubtitle, { color: iconColor }]}>{subtitle}</Text> : null}
    </Pressable>
  );
}

function QuickAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.actionPressed,
      ]}
    >
      <View style={styles.actionIcon}>
        <Ionicons
          name={icon}
          size={23}
          color={COLORS.accent}
        />
      </View>

      <Text style={styles.actionText}>
        {label}
      </Text>
    </Pressable>
  );
}

function JobCard({
  job,
  onView,
  onSave,
}: {
  job: Job;
  onView: () => void;
  onSave: (
    jobId: string,
    isSavedNow: boolean
  ) => void;
}) {
  const [saved, setSaved] = useState(false);

  const companyName =
    job.company?.name ??
    job.company_name ??
    "Company";

  const location =
    job.location ??
    "Location not specified";

  const employmentType =
    job.type ??
    job.employment_type ??
    "Full Time";

  const toggleSave = () => {
    const newValue = !saved;

    setSaved(newValue);

    onSave(
      String(job.id),
      newValue
    );
  };

  return (
    <View style={styles.jobCard}>
      <View style={styles.jobTop}>
        <View style={styles.companyLogo}>
          <Text style={styles.companyLogoText}>
            {companyName
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>

        <Pressable
          onPress={toggleSave}
          hitSlop={10}
        >
          <Ionicons
            name={
              saved
                ? "heart"
                : "heart-outline"
            }
            size={22}
            color={
              saved
                ? COLORS.accent
                : COLORS.textSec
            }
          />
        </Pressable>
      </View>

      <Pressable onPress={onView}>
        <Text
          style={styles.jobTitle}
          numberOfLines={2}
        >
          {job.title ?? "Untitled Job"}
        </Text>

        <Text
          style={styles.companyName}
          numberOfLines={1}
        >
          {companyName}
        </Text>

        <View style={styles.jobInfoRow}>
          <Ionicons
            name="location-outline"
            size={15}
            color={COLORS.textSec}
          />

          <Text
            style={styles.jobInfoText}
            numberOfLines={1}
          >
            {location}
          </Text>
        </View>

        <View style={styles.jobInfoRow}>
          <Ionicons
            name="time-outline"
            size={15}
            color={COLORS.textSec}
          />

          <Text
            style={styles.jobInfoText}
            numberOfLines={1}
          >
            {employmentType}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onView}
        style={styles.viewJobButton}
      >
        <Text style={styles.viewJobText}>
          View Job
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSec,
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 7,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSec,
    lineHeight: 21,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },

  statCard: {
    width: "48%",
    minHeight: 142,
    backgroundColor: COLORS.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    justifyContent: "space-between",
  },

  statCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  statLabel: {
    color: COLORS.textSec,
    fontSize: 12,
    fontWeight: "600",
  },

  statBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 8,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "900",
  },

  statTrend: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 4,
  },

  statSubtitle: {
    marginTop: 7,
    fontSize: 9.5,
    fontWeight: "700",
  },

  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  viewAll: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "800",
  },

  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },

  chart: {
    height: 180,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingHorizontal: 5,
  },

  chartColumn: {
    flex: 1,
    height: 170,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  chartValue: {
    fontSize: 10,
    color: COLORS.textSec,
    fontWeight: "700",
    marginBottom: 4,
  },

  chartBar: {
    width: 20,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    marginBottom: 9,
  },

  chartLabel: {
    fontSize: 10,
    color: COLORS.textSec,
    fontWeight: "600",
  },

  chartLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 5,
  },

  chartAxis: {
    fontSize: 10,
    color: COLORS.textMuted,
  },

  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 28,
    alignItems: "center",
  },

  emptyText: {
    color: COLORS.textSec,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12,
  },

  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },

  jobsContainer: {
    gap: 12,
  },

  jobCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },

  jobTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  companyLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },

  companyLogoText: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: "900",
  },

  jobTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
    marginBottom: 5,
  },

  companyName: {
    color: COLORS.textSec,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
  },

  jobInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
  },

  jobInfoText: {
    flex: 1,
    color: COLORS.textSec,
    fontSize: 12,
  },

  viewJobButton: {
    height: 42,
    borderRadius: 11,
    backgroundColor: COLORS.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  viewJobText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "800",
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
  },

  actionCard: {
    width: "48%",
    minHeight: 120,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  actionPressed: {
    opacity: 0.7,
    backgroundColor: COLORS.accentLight,
  },

  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: COLORS.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  actionText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
