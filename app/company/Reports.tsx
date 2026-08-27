import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from "react-native";
import {
  Briefcase,
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  RefreshCw,
} from "lucide-react-native";

import {
  getJobsReport,
  getMonthlyApplicationsReport,
  getOverviewReport,
  getPipelineReport,
} from "../../imports/reports";
import { C, F } from "../../constants/tokens";
import { useSyncRefresh } from "../../context/SyncContext";

type Overview = {
  total_jobs: number;
  applications: number;
  interviews: number;
  hired_candidates: number;
};

type Job = {
  job_title: string;
  applications: number;
};

type MonthlyItem = {
  month: string;
  applications: number;
};

export default function Reports() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [monthly, setMonthly] = useState<MonthlyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const loadReports = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const [overviewData, jobsData, pipelineData, monthlyData] = await Promise.all([
      getOverviewReport(),
      getJobsReport(),
      getPipelineReport(),
      getMonthlyApplicationsReport(),
      ]);
      setOverview(overviewData);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setPipeline(pipelineData ?? {});
      setMonthly(Array.isArray(monthlyData) ? monthlyData : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useSyncRefresh(["applications", "jobs", "interviews", "company"], () => loadReports(false));

  useEffect(() => { void loadReports(); }, [loadReports]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.accent} />

        <Text style={styles.loadingText}>
          Loading analytics...
        </Text>
      </View>
    );
  }

  if (error && !overview) {
    return <View style={styles.loadingContainer}><View style={styles.errorIcon}><BarChart3 size={28} color={C.error} /></View><Text style={styles.errorTitle}>Could not load reports</Text><Text style={styles.errorDescription}>Check your connection and try again.</Text><Pressable style={styles.retryButton} onPress={() => void loadReports()}><RefreshCw size={15} color="#FFFFFF" /><Text style={styles.retryText}>Try Again</Text></Pressable></View>;
  }

  const cards = overview
    ? [
        {
          title: "Total Jobs",
          value: overview.total_jobs,
          icon: Briefcase,
          bg: "#EFF6FF",
          iconColor: "#1D4ED8",
        },
        {
          title: "Applications",
          value: overview.applications,
          icon: Users,
          bg: C.accentLight,
          iconColor: "#4338CA",
        },
        {
          title: "Interviews",
          value: overview.interviews,
          icon: Calendar,
          bg: "#FFFBEB",
          iconColor: "#B45309",
        },
        {
          title: "Hired Candidates",
          value: overview.hired_candidates,
          icon: UserCheck,
          bg: "#ECFDF5",
          iconColor: "#047857",
        },
      ]
    : [];

  const pipelineConfig = [
    {
      key: "Accepted",
      label: "Accepted",
      color: "#059669",
      textColor: "#065F46",
      bgColor: "#D1FAE5",
      icon: CheckCircle2,
    },
    {
      key: "Shortlisted",
      label: "Shortlisted",
      color: C.accentHover,
      textColor: "#3730A3",
      bgColor: "#E0E7FF",
      icon: Clock,
    },
    {
      key: "Rejected",
      label: "Rejected",
      color: "#E11D48",
      textColor: "#9F1239",
      bgColor: "#FFE4E6",
      icon: XCircle,
    },
  ];

  const pipelineValues = pipelineConfig.map(
    (item) => pipeline[item.key] || 0
  );

  const pipelineMax = Math.max(
    ...pipelineValues,
    1
  );

  const monthlyMax = Math.max(
    ...monthly.map((m) => m.applications),
    1
  );
  const jobMax = Math.max(...jobs.map((job) => job.applications), 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadReports(true)} tintColor={C.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCopy}><Text style={styles.title}>
          Reports & Analytics
        </Text>

        <Text style={styles.subtitle}>
          Track hiring performance and key metrics.
        </Text>
        </View><View style={styles.headerIcon}><BarChart3 size={23} color={C.accentHover} /></View>
      </View>

      {/* Overview Cards */}
      <View style={styles.cardsGrid}>
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <View
              key={card.title}
              style={styles.card}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardLabel}>
                  {card.title}
                </Text>

                <View
                  style={[
                    styles.cardIcon,
                    { backgroundColor: card.bg },
                  ]}
                >
                  <Icon
                    size={20}
                    color={card.iconColor}
                  />
                </View>
              </View>

              <Text style={styles.cardValue}>
                {card.value.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Applications Per Job */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>
              Applications Per Job
            </Text>

            <Text style={styles.sectionSubtitle}>
              Overview of candidate volume by job title
            </Text>
          </View>

          <View style={styles.jobsBadge}>
            <Text style={styles.jobsBadgeText}>
              {jobs.length} Jobs
            </Text>
          </View>
        </View>

        {jobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No jobs available.
            </Text>
          </View>
        ) : (
          <View>
            {jobs.map((job, index) => (
              <View
                key={`${job.job_title}-${index}`}
                style={[
                  styles.jobRow,
                  index === jobs.length - 1 &&
                    styles.lastRow,
                ]}
              >
                <Text
                  style={styles.jobTitle}
                  numberOfLines={2}
                >
                  {job.job_title}
                </Text>

                <View style={styles.applicationBadge}>
                  <Text style={styles.applicationBadgeText}>
                    {job.applications} applications
                  </Text>
                </View>
                <View style={styles.jobProgressTrack}><View style={[styles.jobProgress, { width: `${Math.round((job.applications / jobMax) * 100)}%` }]} /></View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Application Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Application Status
        </Text>

        <Text style={styles.sectionSubtitle}>
          Candidate progression across hiring stages
        </Text>

        <View style={styles.pipelineContainer}>
          {pipelineConfig.map((item) => {
            const value =
              pipeline[item.key] || 0;

            const percentage = Math.round(
              (value / pipelineMax) * 100
            );

            const StatusIcon = item.icon;

            return (
              <View
                key={item.key}
                style={styles.pipelineItem}
              >
                <View style={styles.pipelineHeader}>
                  <View style={styles.pipelineLeft}>
                    <View
                      style={[
                        styles.statusIcon,
                        {
                          backgroundColor:
                            item.bgColor,
                        },
                      ]}
                    >
                      <StatusIcon
                        size={16}
                        color={item.textColor}
                      />
                    </View>

                    <Text style={styles.pipelineLabel}>
                      {item.label}
                    </Text>
                  </View>

                  <Text style={styles.pipelineValue}>
                    {value.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${percentage}%`,
                        backgroundColor:
                          item.color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Applications by Month */}
      <View style={styles.section}>
        <View style={styles.monthHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>
              Applications by Month
            </Text>

            <Text style={styles.sectionSubtitle}>
              Monthly trends in candidate submissions
            </Text>
          </View>

          <TrendingUp
            size={20}
            color="#94A3B8"
          />
        </View>

        {monthly.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No monthly data available.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>
            {monthly.map((item) => {
              const heightPercent = Math.max(
                Math.round(
                  (item.applications /
                    monthlyMax) *
                    100
                ),
                item.applications > 0 ? 5 : 0
              );

              return (
                <View
                  key={item.month}
                  style={styles.chartColumn}
                >
                  <Text style={styles.chartValue}>
                    {item.applications}
                  </Text>

                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${heightPercent}%`,
                        },
                      ]}
                    />
                  </View>

                  <Text
                    style={styles.monthLabel}
                    numberOfLines={1}
                  >
                    {item.month}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    minHeight: 450,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    fontFamily: F,
  },

  errorIcon: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: C.errorBg },
  errorTitle: { color: C.text, fontSize: 17, fontWeight: "900", marginTop: 14, fontFamily: F },
  errorDescription: { color: C.textSec, fontSize: 12, marginTop: 5, fontFamily: F },
  retryButton: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 16, marginTop: 18, borderRadius: 11, backgroundColor: C.accent },
  retryText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", fontFamily: F },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 20,
    marginBottom: 4,
  },

  headerCopy: { flex: 1 },
  headerIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
    fontFamily: F,
  },

  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
    fontFamily: F,
  },

  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },

  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 15,
    minHeight: 118,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
  },

  cardLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    lineHeight: 17,
    fontFamily: F,
  },

  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  cardValue: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 14,
    fontFamily: F,
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
    gap: 10,
  },

  monthHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 17,
  },

  jobsBadge: {
    backgroundColor: C.accentLight,
    borderWidth: 1,
    borderColor: "#E0E7FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },

  jobsBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3730A3",
  },

  jobRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 12,
    flexWrap: "wrap",
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  jobTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#334155",
  },

  applicationBadge: {
    backgroundColor: "#F1F5F9",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  applicationBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#334155",
  },

  jobProgressTrack: { flexBasis: "100%", width: "100%", height: 5, borderRadius: 99, overflow: "hidden", backgroundColor: C.divider },
  jobProgress: { height: "100%", borderRadius: 99, backgroundColor: C.accent },

  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontSize: 13,
    color: "#64748B",
  },

  pipelineContainer: {
    marginTop: 20,
    gap: 22,
  },

  pipelineItem: {
    gap: 9,
  },

  pipelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pipelineLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  statusIcon: {
    width: 31,
    height: 31,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  pipelineLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },

  pipelineValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },

  progressBackground: {
    width: "100%",
    height: 9,
    backgroundColor: "#F1F5F9",
    borderRadius: 99,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    borderRadius: 99,
  },

  chart: {
    height: 230,
    flexDirection: "row",
    alignItems: "flex-end",
    minWidth: "100%",
    gap: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 2,
    paddingTop: 15,
  },

  chartColumn: {
    width: 48,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  chartValue: {
    fontSize: 9,
    fontWeight: "600",
    color: "#3730A3",
    marginBottom: 5,
  },

  barContainer: {
    width: "70%",
    maxWidth: 32,
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    justifyContent: "flex-end",
    overflow: "hidden",
  },

  bar: {
    width: "100%",
    backgroundColor: C.accent,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
  },

  monthLabel: {
    width: "100%",
    textAlign: "center",
    fontSize: 9,
    color: "#64748B",
    marginTop: 8,
  },
});
