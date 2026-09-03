import { useEffect, useState } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";

import { C, F } from "../../constants/tokens";
import { getCompanyDashboard, resolveMediaUrl } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

export default function CompanyDashboard() {
  const [companyName, setCompanyName] =
    useState("Company");

  const [dashboard, setDashboard] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const data = await getCompanyDashboard();
      setDashboard(data);
    } catch (error) {
      console.log("Failed to load company dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const activityFromApi = Array.isArray(dashboard?.activity)
    ? dashboard.activity.map((item: any) => ({
        month: String(item.month || ""),
        value: Number(item.value) || 0,
      }))
    : [];

  // A path made from one point is invisible. The web chart starts at zero,
  // so keep that same baseline and make a single returned month visible.
  const activityData = activityFromApi.length
    ? [{ month: "Start", value: 0 }, ...activityFromApi.slice(-6)]
    : [
        { month: "Start", value: 0 },
        { month: "Now", value: 0 },
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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={C.accent}
          onRefresh={() => {
            setRefreshing(true);
            void loadDashboard();
          }}
        />
      }
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

        <ApplicationsLineChart data={activityData} maxValue={maxActivity} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Hiring Pipeline
        </Text>

        {pipelineData.length > 0 ? (
          <View style={styles.pipelineContainer}>
            <PipelineDonut data={pipelineData} />
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

function ApplicationsLineChart({
  data,
  maxValue,
}: {
  data: { month: string; value: number }[];
  maxValue: number;
}) {
  const width = Math.max(330, data.length * 82);
  const height = 210;
  const left = 34;
  const right = 14;
  const top = 12;
  const bottom = 30;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const yMax = Math.max(4, Math.ceil(maxValue / 4) * 4);
  const points = data.map((item, index) => ({
    ...item,
    x: left + (data.length > 1 ? (index * plotWidth) / (data.length - 1) : plotWidth / 2),
    y: top + plotHeight - (item.value / yMax) * plotHeight,
  }));
  const line = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const baseline = top + plotHeight;
  const area = points.length
    ? `${line} L ${points.at(-1)!.x} ${baseline} L ${points[0].x} ${baseline} Z`
    : "";

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={width} height={height}>
        {Array.from({ length: 5 }, (_, index) => {
          const y = top + (plotHeight / 4) * index;
          return (
            <G key={index}>
              <Line x1={left} y1={y} x2={width - right} y2={y} stroke="#E7E5E4" strokeDasharray="4 4" />
              <SvgText x={left - 7} y={y + 3} textAnchor="end" fill="#78716C" fontSize={9}>
                {Math.round(yMax - (yMax / 4) * index)}
              </SvgText>
            </G>
          );
        })}
        {points.map((point, index) => (
          <G key={`${point.month}-${index}`}>
            <Line x1={point.x} y1={top} x2={point.x} y2={baseline} stroke="#F0EEEB" strokeDasharray="4 4" />
            <SvgText x={point.x} y={height - 9} textAnchor="middle" fill="#78716C" fontSize={9}>
              {formatMonth(point.month)}
            </SvgText>
          </G>
        ))}
        <Path d={area} fill="#2563EB" opacity={0.08} />
        <Path d={line} fill="none" stroke="#2563EB" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <Circle
            key={`activity-point-${index}`}
            cx={point.x}
            cy={point.y}
            r={3.5}
            fill="#FFFFFF"
            stroke="#2563EB"
            strokeWidth={2}
          />
        ))}
      </Svg>
    </ScrollView>
  );
}

function PipelineDonut({ data }: { data: any[] }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const radius = 39;
  const circumference = 2 * Math.PI * radius;
  let consumed = 0;

  return (
    <View style={styles.donutWrap}>
      <Svg width={112} height={112} viewBox="0 0 112 112">
        <Circle cx={56} cy={56} r={radius} fill="none" stroke="#F1F0EE" strokeWidth={16} />
        <G rotation="-90" origin="56, 56">
          {data.map((item, index) => {
            const fraction = total ? Number(item.value || 0) / total : 0;
            const length = fraction * circumference;
            const offset = -consumed * circumference;
            consumed += fraction;
            return (
              <Circle
                key={`${item.name}-${index}`}
                cx={56}
                cy={56}
                r={radius}
                fill="none"
                stroke={item.color || C.accent}
                strokeWidth={16}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={offset}
              />
            );
          })}
        </G>
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutValue}>{total}</Text>
        <Text style={styles.donutLabel}>Candidates</Text>
      </View>
    </View>
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
    candidate?.job_title ||
    candidate?.student?.headline ||
    candidate?.headline ||
    "No headline provided";

  const status = String(candidate?.status || "Applied");
  const statusStyle =
    status === "Rejected"
      ? { text: "#DC2626", background: "#FEE2E2" }
      : status === "Accepted" || status === "Hired"
        ? { text: "#15803D", background: "#DCFCE7" }
        : status === "Interview"
          ? { text: "#6D28D9", background: "#EDE9FE" }
          : status === "Shortlisted"
            ? { text: "#B7791F", background: "#FEF3C7" }
            : { text: "#2563EB", background: "#DBEAFE" };

  const skills = Array.isArray(candidate?.skills)
    ? candidate.skills.slice(0, 4)
    : [];

  const match =
    Number(
      candidate?.match?.percentage ??
        candidate?.match_percentage ??
        candidate?.match ??
        0
    ) || 0;

  const avatar =
    resolveMediaUrl(candidate?.student?.avatar || candidate?.avatar) ||
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
        <View style={styles.applicantNameRow}>
          <Text style={styles.applicantName} numberOfLines={1}>{name}</Text>
          <View style={[styles.applicantStatus, { backgroundColor: statusStyle.background }]}>
            <Text style={[styles.applicantStatusText, { color: statusStyle.text }]}>{status}</Text>
          </View>
        </View>

        <Text
          style={styles.applicantHeadline}
          numberOfLines={2}
        >
          {headline}
        </Text>

        <Text style={styles.applicantLocation} numberOfLines={1}>
          {candidate?.location || candidate?.univ || "Location not provided"}
        </Text>

        {skills.length ? (
          <View style={styles.skillsRow}>
            {skills.map((skill: any, index: number) => (
              <View key={`${String(skill)}-${index}`} style={styles.skillChip}>
                <Text style={styles.skillText}>✓ {typeof skill === "string" ? skill : skill?.name}</Text>
              </View>
            ))}
          </View>
        ) : null}

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

  donutWrap: {
    width: 112,
    height: 112,
    alignSelf: "center",
    marginBottom: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  donutCenter: {
    position: "absolute",
    alignItems: "center",
  },

  donutValue: {
    fontFamily: F,
    fontSize: 19,
    fontWeight: "800",
    color: C.text,
  },

  donutLabel: {
    fontFamily: F,
    fontSize: 8.5,
    color: C.textSec,
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
    flex: 1,
    fontFamily: F,
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },

  applicantNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  applicantStatus: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },

  applicantStatusText: {
    fontFamily: F,
    fontSize: 8.5,
    fontWeight: "700",
  },

  applicantHeadline: {
    fontFamily: F,
    fontSize: 11.5,
    color: C.textSec,
    marginTop: 3,
    lineHeight: 16,
  },

  applicantLocation: {
    fontFamily: F,
    fontSize: 9.5,
    color: C.textMuted,
    marginTop: 3,
  },

  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 8,
  },

  skillChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#ECFDF5",
  },

  skillText: {
    fontFamily: F,
    fontSize: 8,
    color: "#15803D",
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
