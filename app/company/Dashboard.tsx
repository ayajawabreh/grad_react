import { useEffect, useState } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { C, F } from "../../constants/tokens";
import { getCompanyDashboard } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

export default function CompanyDashboard() {
  const [companyName, setCompanyName] =
    useState("Company");

  const [dashboard, setDashboard] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const loadDashboard = async () => {
    try {
      const data = await getCompanyDashboard();
      setDashboard(data);
    } catch (error) {
      console.log("Failed to load company dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useSyncRefresh(["applications", "jobs", "interviews", "company"], loadDashboard);

  useEffect(() => {
    const loadCompanyName = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setCompanyName(JSON.parse(storedUser)?.name || "Company");
      }
    };

    void loadCompanyName();

    void loadDashboard();
  }, []);

  const activityData =
    dashboard?.activity?.length
      ? dashboard.activity.map((item: any) => ({
          month: item.month,
          value: Number(item.value) || 0,
        }))
      : [
          { month: "May", value: 0 },
          { month: "Jun", value: 0 },
          { month: "Jul", value: 0 },
        ];

  const pipelineData =
    Array.isArray(dashboard?.pipeline)
      ? dashboard.pipeline
      : [];

  const maxActivity =
    Math.max(
      ...activityData.map(
        (item: any) => item.value
      ),
      1
    );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="small"
          color={C.accent || "#C8A46A"}
        />

        <Text style={styles.loadingText}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Good morning, {companyName} 👋
        </Text>

        <Text style={styles.subtitle}>
          Here&apos;s your hiring overview for today.
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCardMobile
          label="Total Applications"
          value={String(
            dashboard?.stats?.total_applications ?? 0
          )}
          trend="+18%"
          icon="document-text-outline"
          iconColor={C.info}
        />

        <StatCardMobile
          label="Active Jobs"
          value={String(
            dashboard?.stats?.active_jobs ?? 0
          )}
          icon="briefcase-outline"
          iconColor={C.accent}
        />

        <StatCardMobile
          label="Interviews"
          value={String(
            dashboard?.stats?.interviews ?? 0
          )}
          trend="+33%"
          icon="calendar-outline"
          iconColor={C.purple}
        />

        <StatCardMobile
          label="Hired"
          value={String(
            dashboard?.stats?.hired ?? 0
          )}
          trend="+20%"
          icon="person-add-outline"
          iconColor={C.success}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Applications Over Time
        </Text>

        <View style={styles.chartContainer}>
          <View style={styles.yAxis}>
            <Text style={styles.axisText}>
              {maxActivity}
            </Text>

            <Text style={styles.axisText}>
              {Math.round(maxActivity / 2)}
            </Text>

            <Text style={styles.axisText}>
              0
            </Text>
          </View>

          <View style={styles.chart}>
            <View style={styles.chartGridLine} />
            <View style={styles.chartGridLine} />
            <View style={styles.chartGridLine} />

            <View style={styles.barsContainer}>
              {activityData.map(
                (item: any, index: number) => {
                  const height =
                    item.value === 0
                      ? 4
                      : Math.max(
                          8,
                          (item.value /
                            maxActivity) *
                            125
                        );

                  return (
                    <View
                      key={`${item.month}-${index}`}
                      style={styles.barColumn}
                    >
                      <View
                        style={[
                          styles.activityBar,
                          {
                            height,
                          },
                        ]}
                      />

                      <Text
                        style={styles.monthText}
                      >
                        {formatMonth(
                          item.month
                        )}
                      </Text>
                    </View>
                  );
                }
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Hiring Pipeline
        </Text>

        {pipelineData.length > 0 ? (
          <View style={styles.pipelineContainer}>
            {pipelineData.map(
              (item: any, index: number) => {
                const total =
                  pipelineData.reduce(
                    (
                      sum: number,
                      p: any
                    ) =>
                      sum +
                      Number(p.value || 0),
                    0
                  );

                const percentage =
                  total > 0
                    ? (Number(
                        item.value || 0
                      ) /
                        total) *
                      100
                    : 0;

                return (
                  <View
                    key={
                      item.name ||
                      index
                    }
                    style={styles.pipelineRow}
                  >
                    <View
                      style={
                        styles.pipelineHeader
                      }
                    >
                      <View
                        style={
                          styles.pipelineNameContainer
                        }
                      >
                        <View
                          style={[
                            styles.pipelineDot,
                            {
                              backgroundColor:
                                item.color ||
                                C.accent ||
                                "#C8A46A",
                            },
                          ]}
                        />

                        <Text
                          style={
                            styles.pipelineName
                          }
                        >
                          {item.name}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.pipelineValue
                        }
                      >
                        {item.value}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.pipelineTrack
                      }
                    >
                      <View
                        style={[
                          styles.pipelineProgress,
                          {
                            width: `${percentage}%`,
                            backgroundColor:
                              item.color ||
                              C.accent ||
                              "#C8A46A",
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              }
            )}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            No hiring pipeline data available.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Recent Applicants
          </Text>

          <Pressable
            onPress={() =>
              router.push("/company/Applicants")
            }
            style={styles.viewButton}
          >
            <Text style={styles.viewButtonText}>
              View all
            </Text>

            <Ionicons
              name="arrow-forward"
              size={14}
              color={C.accent}
            />
          </Pressable>
        </View>

        {dashboard?.recent_applicants?.length >
        0 ? (
          <View style={styles.applicantsContainer}>
            {dashboard.recent_applicants.map(
              (candidate: any) => (
                <ApplicantCard
                  key={candidate.id}
                  candidate={candidate}
                  onPress={() =>
                    router.push({
                      pathname:
                        "/company/CandidateDetails",
                      params: {
                        id: String(
                          candidate.id
                        ),
                      },
                    })
                  }
                />
              )
            )}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons
              name="people-outline"
              size={30}
              color={C.textSec}
            />

            <Text style={styles.emptyText}>
              No recent applicants.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>
            Active Jobs
          </Text>

          <Pressable
            onPress={() =>
              router.push("/company/ManageJobs")
            }
            style={styles.viewButton}
          >
            <Text style={styles.viewButtonText}>
              Manage
            </Text>

            <Ionicons
              name="arrow-forward"
              size={14}
              color={C.accent}
            />
          </Pressable>
        </View>

        {dashboard?.active_jobs?.length >
        0 ? (
          <View>
            {dashboard.active_jobs.map(
              (job: any, index: number) => (
                <View
                  key={job.id}
                  style={[
                    styles.jobRow,
                    index !==
                      dashboard.active_jobs
                        .length -
                        1 &&
                      styles.jobRowBorder,
                  ]}
                >
                  <View
                    style={
                      styles.companyLogo
                    }
                  >
                    <Text
                      style={
                        styles.companyLogoText
                      }
                    >
                      {companyName
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "C"}
                    </Text>
                  </View>

                  <View
                    style={styles.jobInfo}
                  >
                    <Text
                      style={styles.jobTitle}
                      numberOfLines={1}
                    >
                      {job.title}
                    </Text>

                    <Text
                      style={
                        styles.jobMeta
                      }
                    >
                      {job.applicants ?? 0}{" "}
                      applicants ·{" "}
                      {job.posted || ""}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.activeBadge
                    }
                  >
                    <Text
                      style={
                        styles.activeBadgeText
                      }
                    >
                      {job.status}
                    </Text>
                  </View>
                </View>
              )
            )}
          </View>
        ) : (
          <View style={styles.emptyJobs}>
            <Ionicons
              name="briefcase-outline"
              size={30}
              color={C.textSec}
            />

            <Text style={styles.emptyText}>
              No active jobs.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatCardMobile({
  label,
  value,
  trend,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  trend?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}) {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor:
              iconColor + "18",
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
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
          <View style={styles.trendBadge}>
            <Ionicons
              name="trending-up"
              size={11}
              color={C.success}
            />

            <Text style={styles.trendText}>
              {trend}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ApplicantCard({
  candidate,
  onPress,
}: {
  candidate: any;
  onPress: () => void;
}) {
  const name =
    candidate?.student?.name ||
    candidate?.name ||
    "Candidate";

  const headline =
    candidate?.student?.headline ||
    candidate?.headline ||
    "No headline provided";

  const match =
    Number(
      candidate?.match?.percentage ??
        candidate?.match_percentage ??
        candidate?.match ??
        0
    ) || 0;

  const avatar =
    candidate?.student?.avatar ||
    candidate?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      name
    )}`;

  return (
    <Pressable
      onPress={onPress}
      style={styles.applicantCard}
    >
      <Image
        source={{ uri: avatar }}
        style={styles.applicantAvatar}
      />

      <View style={styles.applicantInfo}>
        <Text
          style={styles.applicantName}
          numberOfLines={1}
        >
          {name}
        </Text>

        <Text
          style={styles.applicantHeadline}
          numberOfLines={2}
        >
          {headline}
        </Text>

        <View style={styles.applicantBottom}>
          <View style={styles.matchBadge}>
            <Ionicons
              name="sparkles"
              size={11}
              color={C.accent}
            />

            <Text
              style={styles.matchBadgeText}
            >
              {Math.round(match)}% Match
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={17}
            color={C.textSec}
          />
        </View>
      </View>
    </Pressable>
  );
}

function formatMonth(month: string) {
  if (!month) return "";

  const parts = String(month).split("-");

  if (parts.length === 2) {
    const monthNumber =
      Number(parts[1]);

    const names = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return (
      names[monthNumber - 1] ||
      month
    );
  }

  return month;
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

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF9F7",
  },

  loadingText: {
    marginTop: 10,
    fontFamily: F,
    fontSize: 14,
    color: C.textSec,
  },

  header: {
    marginBottom: 22,
  },

  greeting: {
    fontFamily: F,
    fontSize: 23,
    fontWeight: "800",
    color: C.text,
  },

  subtitle: {
    fontFamily: F,
    fontSize: 13,
    color: C.textSec,
    marginTop: 6,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  statCard: {
    width: "48.2%",
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
  },

  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  statLabel: {
    fontFamily: F,
    fontSize: 11.5,
    color: C.textSec,
    lineHeight: 16,
    minHeight: 32,
  },

  statBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },

  statValue: {
    fontFamily: F,
    fontSize: 22,
    fontWeight: "800",
    color: C.text,
  },

  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  trendText: {
    fontFamily: F,
    fontSize: 10,
    fontWeight: "600",
    color: C.success,
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 18,
  },

  cardTitle: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    marginBottom: 16,
  },

  chartContainer: {
    height: 170,
    flexDirection: "row",
  },

  yAxis: {
    width: 28,
    justifyContent: "space-between",
    paddingBottom: 25,
    paddingTop: 2,
  },

  axisText: {
    fontFamily: F,
    fontSize: 9,
    color: C.textSec,
  },

  chart: {
    flex: 1,
    height: 160,
    position: "relative",
  },

  chartGridLine: {
    height: 1,
    backgroundColor: C.divider,
    opacity: 0.6,
    marginTop: 31,
  },

  barsContainer: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 0,
    height: 145,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
  },

  barColumn: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: 145,
    minWidth: 35,
  },

  activityBar: {
    width: 24,
    borderRadius: 7,
    backgroundColor: C.info,
    marginBottom: 7,
  },

  monthText: {
    fontFamily: F,
    fontSize: 9.5,
    color: C.textSec,
  },

  pipelineContainer: {
    gap: 15,
  },

  pipelineRow: {
    width: "100%",
  },

  pipelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },

  pipelineNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  pipelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  pipelineName: {
    fontFamily: F,
    fontSize: 12,
    color: C.text,
  },

  pipelineValue: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
  },

  pipelineTrack: {
    height: 7,
    borderRadius: 10,
    backgroundColor: "#F1EFED",
    overflow: "hidden",
  },

  pipelineProgress: {
    height: "100%",
    borderRadius: 10,
  },

  section: {
    marginBottom: 18,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontFamily: F,
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
  },

  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 7,
  },

  viewButtonText: {
    fontFamily: F,
    fontSize: 11.5,
    fontWeight: "600",
    color: C.accent,
  },

  applicantsContainer: {
    gap: 10,
  },

  applicantCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
  },

  applicantAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 12,
  },

  applicantInfo: {
    flex: 1,
    minWidth: 0,
  },

  applicantName: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },

  applicantHeadline: {
    fontFamily: F,
    fontSize: 11.5,
    color: C.textSec,
    marginTop: 3,
    lineHeight: 16,
  },

  applicantBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 9,
  },

  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0EBF8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  matchBadgeText: {
    fontFamily: F,
    fontSize: 10,
    fontWeight: "600",
    color: C.accent,
  },

  emptyCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontFamily: F,
    fontSize: 12.5,
    color: C.textSec,
    marginTop: 8,
    textAlign: "center",
  },

  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 11,
  },

  jobRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  companyLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor:
      (C.accent || "#C8A46A") + "18",
    alignItems: "center",
    justifyContent: "center",
  },

  companyLogoText: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "800",
    color: C.accent,
  },

  jobInfo: {
    flex: 1,
    minWidth: 0,
  },

  jobTitle: {
    fontFamily: F,
    fontSize: 12.5,
    fontWeight: "600",
    color: C.text,
  },

  jobMeta: {
    fontFamily: F,
    fontSize: 10.5,
    color: C.textSec,
    marginTop: 3,
  },

  activeBadge: {
    backgroundColor:
      C.successBg || "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 99,
  },

  activeBadgeText: {
    fontFamily: F,
    fontSize: 9.5,
    fontWeight: "600",
    color: C.success,
  },

  emptyJobs: {
    alignItems: "center",
    paddingVertical: 22,
  },
});
