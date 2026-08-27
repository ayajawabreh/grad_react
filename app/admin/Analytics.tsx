import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Text as SvgText,
} from "react-native-svg";
import {
  Activity,
  Briefcase,
  Building2,
  CalendarCheck,
  FileText,
  Target,
  TrendingUp,
  Users,
} from "lucide-react-native";
import { getAdminAnalytics, getAdminDashboard, getAdminJobsModeration, getAdminPlatformReport } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

const C = {
  background: "#F7F8FC",
  surface: "#FFFFFF",
  text: "#181B1F",
  textSec: "#667085",
  textMuted: "#98A2B3",
  border: "#E7E9EF",
  divider: "#EEF0F4",

  accent: "#C8A46A",
  info: "#3B82F6",
  purple: "#C8A46A",
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#EF4444",

  successBg: "#DCFCE7",
  bg: "#F7F8FC",
};

const colors = [
  C.accent,
  C.info,
  C.purple,
  C.success,
  C.warning,
  C.error,
];

const ANALYTICS_CACHE_KEY = "careerbridge:admin-analytics";

const screenWidth = Dimensions.get("window").width;

const valueOf = (source: any, ...keys: string[]) => {
  for (const key of keys) {
    if (source?.[key] !== undefined) {
      return Number(source[key]) || 0;
    }
  }

  return 0;
};

const listOf = (data: any, ...keys: string[]) => {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
};

export default function AdminAnalytics() {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadAnalytics = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      try {
        const cached = sessionStorage.getItem(ANALYTICS_CACHE_KEY);

        if (cached) {
          setData(JSON.parse(cached));
          setLoading(false);
        }
      } catch {
        // sessionStorage is not normally available in React Native.
        // This is kept only for compatibility.
      }

      const [
        analyticsResult,
        reportResult,
        dashboardResult,
        jobsResult,
      ] = await Promise.allSettled([
        getAdminAnalytics(),
        getAdminPlatformReport("month"),
        getAdminDashboard(),
        getAdminJobsModeration(),
      ]);

      const unwrap = (
        result: PromiseSettledResult<any>
      ) =>
        result.status === "fulfilled"
          ? result.value?.data ?? result.value ?? {}
          : {};

      const analytics = unwrap(analyticsResult);
      const report = unwrap(reportResult);
      const dashboard = unwrap(dashboardResult);
      const jobsResponse = unwrap(jobsResult);

      const jobs = Array.isArray(jobsResponse)
        ? jobsResponse
        : jobsResponse.jobs ?? jobsResponse.data ?? [];

      const monthlyJobs = Array.from(
        (jobs.reduce(
          (months: Map<string, number>, job: any) => {
            if (
              !job.created_at &&
              !job.posted_at &&
              !job.posted
            ) {
              return months;
            }

            const date = new Date(
              job.created_at ??
                job.posted_at ??
                job.posted
            );

            if (Number.isNaN(date.getTime())) {
              return months;
            }

            const key = `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}`;

            months.set(
              key,
              (months.get(key) ?? 0) + 1
            );

            return months;
          },
          new Map<string, number>()
        ) as Map<string, number>).entries()
      )
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({
          month: new Date(`${month}-01`).toLocaleDateString(
            "en-US",
            {
              month: "short",
              year: "2-digit",
            }
          ),
          count,
        }));

      const categoryJobs = Array.from(
        (jobs.reduce(
          (categories: Map<string, number>, job: any) => {
            const name = job.category?.name ?? "Uncategorized";

            categories.set(
              name,
              (categories.get(name) ?? 0) + 1
            );

            return categories;
          },
          new Map<string, number>()
        ) as Map<string, number>).entries()
      ).map(([name, count]) => ({
        name,
        count,
      }));

      const apiTrend =
        analytics.jobs_over_time ??
        analytics.jobsOverTime ??
        analytics.jobs_by_month ??
        analytics.trends?.monthly;

      const apiCategories =
        analytics.jobs_by_category ??
        analytics.jobsByCategory ??
        report.highlights?.jobs_by_category;

      const overview = {
        ...(analytics.overview ??
          analytics.metrics ??
          analytics.statistics ??
          {}),

        total_students:
          report.students?.total ??
          dashboard.statistics?.total_students ??
          analytics.total_students,

        total_companies:
          report.companies?.total ??
          dashboard.statistics?.total_companies ??
          analytics.total_companies,

        total_jobs:
          analytics.overview?.total_jobs ??
          analytics.total_jobs ??
          report.jobs?.total ??
          dashboard.statistics?.active_jobs ??
          0,

        total_applications:
          report.applications?.total ??
          analytics.total_applications,

        total_interviews:
          report.hiring?.total_interviews ??
          report.applications?.interviews ??
          analytics.total_interviews,

        total_hires:
          report.hiring?.total_hires ??
          report.applications?.accepted ??
          dashboard.statistics?.total_hires ??
          analytics.total_hires,
      };

      const nextData = {
        ...analytics,

        overview,

        application_funnel:
          analytics.application_funnel ??
          analytics.applicationFunnel ??
          report.applications,

        jobs_over_time:
          Array.isArray(apiTrend) && apiTrend.length
            ? apiTrend
            : monthlyJobs,

        jobs_by_category:
          Array.isArray(apiCategories) &&
          apiCategories.length
            ? apiCategories
            : categoryJobs,

        companies_summary:
          analytics.companies_summary ??
          analytics.companiesSummary ??
          {
            approved: report.companies?.active,
            pending:
              dashboard.needs_review?.companies,
          },
      };

      setData(nextData);
      const allFailed = [analyticsResult, reportResult, dashboardResult, jobsResult]
        .every(result => result.status === "rejected");
      setLoadError(allFailed ? "Could not load analytics data." : "");

      try {
        // sessionStorage isn't available in native apps.
        // AsyncStorage can be added here if persistent caching is needed.
      } catch {}

    } catch (error) {
      console.log(
        "Admin analytics error:",
        error
      );
      setLoadError("Could not load analytics data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useSyncRefresh(["admin", "applications", "jobs", "student", "company"], () => loadAnalytics(false));

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", next => {
      if (next === "active") loadAnalytics(false);
    });
    return () => subscription.remove();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics(false);
  };

  const metrics =
    data.overview ??
    data.metrics ??
    data.statistics ??
    data;

  const cards = [
    {
      label: "Students",
      value: valueOf(
        metrics,
        "total_students",
        "totalStudents",
        "students"
      ),
      Icon: Users,
      color: C.info,
    },

    {
      label: "Companies",
      value: valueOf(
        metrics,
        "total_companies",
        "totalCompanies",
        "companies"
      ),
      Icon: Building2,
      color: C.purple,
    },

    {
      label: "Jobs",
      value: valueOf(
        metrics,
        "total_jobs",
        "totalJobs",
        "jobs"
      ),
      Icon: Briefcase,
      color: C.accent,
    },

    {
      label: "Applications",
      value: valueOf(
        metrics,
        "total_applications",
        "totalApplications",
        "applications"
      ),
      Icon: FileText,
      color: C.warning,
    },

    {
      label: "Interviews",
      value: valueOf(
        metrics,
        "total_interviews",
        "totalInterviews",
        "interviews"
      ),
      Icon: CalendarCheck,
      color: C.success,
    },

    {
      label: "Hires",
      value: valueOf(
        metrics,
        "total_hires",
        "totalHires",
        "hires",
        "accepted"
      ),
      Icon: Target,
      color: C.error,
    },
  ];

  const rawJobsTrend = listOf(
    data,
    "jobs_over_time",
    "jobsOverTime",
    "jobs_by_month"
  ).map((item: any, i: number) => ({
    name:
      item.label ??
      (typeof item.month === "string" && /^\d{4}-\d{2}$/.test(item.month)
        ? new Date(`${item.month}-01T00:00:00`).toLocaleDateString("en-US", { month: "short" })
        : item.month) ??
      item.date ??
      `Period ${i + 1}`,

    value: valueOf(
      item,
      "value",
      "count",
      "total",
      "jobs"
    ),
  })).slice(-6);

  const totalJobs = valueOf(metrics, "total_jobs", "totalJobs", "jobs");
  const jobsTrend = rawJobsTrend.length === 1
    ? [{ name: "Start", value: 0 }, rawJobsTrend[0]]
    : rawJobsTrend.length === 0 && totalJobs > 0
      ? [{ name: "Start", value: 0 }, { name: "Current", value: totalJobs }]
      : rawJobsTrend;

  const categories = listOf(
    data,
    "jobs_by_category",
    "jobsByCategory",
    "categories"
  ).map((item: any) => ({
    name:
      item.name ??
      item.category ??
      item.label ??
      "Other",

    value: valueOf(
      item,
      "value",
      "count",
      "total",
      "jobs"
    ),
  }));

  const statusesRaw =
    data.application_funnel ??
    data.applicationFunnel ??
    data.application_statuses ??
    data.applicationStatuses ??
    {};

  const funnelKeys = [
    {
      name: "Submitted",
      keys: ["submitted", "total"],
    },
    {
      name: "Viewed",
      keys: ["viewed"],
    },
    {
      name: "Shortlisted",
      keys: ["shortlisted"],
    },
    {
      name: "Interview",
      keys: ["interview", "interviews"],
    },
    {
      name: "Accepted",
      keys: ["accepted", "hired"],
    },
  ];

  const funnel = Array.isArray(statusesRaw)
    ? statusesRaw.map((item: any) => ({
        name:
          item.name ??
          item.status ??
          item.label,

        value: valueOf(
          item,
          "value",
          "count",
          "total"
        ),
      }))
    : funnelKeys.map((item) => ({
        name: item.name,
        value: valueOf(
          statusesRaw,
          ...item.keys
        ),
      }));

  const companies = listOf(
    data,
    "top_companies",
    "topCompanies",
    "companies_analytics"
  ).slice(0, 6);

  const companyStats =
    data.companies_summary ??
    data.companiesSummary ??
    {};

  const maxFunnel = Math.max(
    1,
    ...funnel.map(
      (item: any) => item.value
    )
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      {/* Header */}

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            Reports & Analytics
          </Text>

          <Text style={styles.subtitle}>
            Live platform health, growth and recruitment
            conversion data.
          </Text>
        </View>

        <View style={styles.liveBadge}>
          <Activity
            size={13}
            color={C.success}
          />

          <Text style={styles.liveText}>
            Live API
          </Text>
        </View>
      </View>

      {/* Loading */}

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator
            size="small"
            color={C.accent}
          />

          <Text style={styles.loadingText}>
            Loading analytics...
          </Text>
        </View>
      )}

      {loadError ? (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>{loadError}</Text>
          <TouchableOpacity onPress={() => loadAnalytics()} style={{ marginLeft: 10 }}>
            <Text style={{ color: C.accent, fontWeight: "700" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Metric Cards */}

      <View style={styles.cardsGrid}>
        {cards.map((card) => {
          const Icon = card.Icon;

          return (
            <View
              key={card.label}
              style={styles.metricCard}
            >
              <View style={styles.metricTop}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor:
                        `${card.color}18`,
                    },
                  ]}
                >
                  <Icon
                    size={18}
                    color={card.color}
                  />
                </View>

                <TrendingUp
                  size={14}
                  color={C.textMuted}
                />
              </View>

              <Text style={styles.metricValue}>
                {loading
                  ? "—"
                  : card.value.toLocaleString()}
              </Text>

              <Text style={styles.metricLabel}>
                Total {card.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Jobs Trend */}

      <ChartBox
        title="Jobs Posted Over Time"
        subtitle="New job listings by reporting period"
      >
        {jobsTrend.length ? (
          <JobsTrendChart
            data={jobsTrend}
          />
        ) : (
          <Empty text="No analytics data available." />
        )}
      </ChartBox>

      {/* Categories */}

      <ChartBox
        title="Jobs by Category"
        subtitle="Distribution of active demand"
      >
        {categories.length ? (
          <>
            <CategoryChart
              data={categories}
            />

            <View style={styles.legend}>
              {categories
                .slice(0, 6)
                .map(
                  (
                    item: any,
                    i: number
                  ) => (
                    <View
                      key={item.name}
                      style={styles.legendItem}
                    >
                      <View
                        style={[
                          styles.legendDot,
                          {
                            backgroundColor:
                              colors[
                                i %
                                  colors.length
                              ],
                          },
                        ]}
                      />

                      <Text
                        style={styles.legendText}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </View>
                  )
                )}
            </View>
          </>
        ) : (
          <Empty text="No category analytics returned" />
        )}
      </ChartBox>

      {/* Application Funnel */}

      <ChartBox
        title="Application Funnel"
        subtitle="Conversion through the recruitment journey"
      >
        <View style={styles.funnelContainer}>
          {funnel.map(
            (
              item: any,
              i: number
            ) => {
              const percentage =
                (item.value /
                  maxFunnel) *
                100;

              return (
                <View
                  key={item.name}
                  style={styles.funnelItem}
                >
                  <View
                    style={
                      styles.funnelHeader
                    }
                  >
                    <Text
                      style={
                        styles.funnelName
                      }
                    >
                      {item.name}
                    </Text>

                    <Text
                      style={
                        styles.funnelValue
                      }
                    >
                      {item.value.toLocaleString()}{" "}
                      ·{" "}
                      {Math.round(
                        percentage
                      )}
                      %
                    </Text>
                  </View>

                  <View
                    style={
                      styles.funnelBackground
                    }
                  >
                    <View
                      style={[
                        styles.funnelProgress,
                        {
                          width: `${percentage}%`,
                          backgroundColor:
                            colors[
                              i %
                                colors.length
                            ],
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            }
          )}
        </View>
      </ChartBox>

      {/* Companies Analytics */}

      <ChartBox
        title="Companies Analytics"
        subtitle="Status and highest platform activity"
      >
        <View style={styles.companyStats}>
          {[
            ["Approved", "approved"],
            ["Pending", "pending"],
            ["Suspended", "suspended"],
          ].map(
            ([label, key]) => (
              <View
                key={key}
                style={styles.companyStat}
              >
                <Text
                  style={
                    styles.companyStatValue
                  }
                >
                  {valueOf(
                    companyStats,
                    key,
                    `${key}_companies`
                  )}
                </Text>

                <Text
                  style={
                    styles.companyStatLabel
                  }
                >
                  {label}
                </Text>
              </View>
            )
          )}
        </View>

        {companies.length ? (
          <View>
            {companies.map(
              (
                company: any,
                i: number
              ) => (
                <View
                  key={
                    company.id ??
                    i
                  }
                  style={[
                    styles.companyRow,
                    {
                      borderBottomWidth:
                        i <
                        companies.length -
                          1
                          ? 1
                          : 0,
                    },
                  ]}
                >
                  <Text
                    style={
                      styles.companyName
                    }
                    numberOfLines={1}
                  >
                    {company.name ??
                      company.company_name ??
                      `Company ${
                        i + 1
                      }`}
                  </Text>

                  <Text
                    style={
                      styles.companyInfo
                    }
                  >
                    {valueOf(
                      company,
                      "jobs",
                      "jobs_count",
                      "job_count"
                    )}{" "}
                    jobs ·{" "}
                    {valueOf(
                      company,
                      "applications",
                      "applications_count"
                    )}{" "}
                    applications
                  </Text>
                </View>
              )
            )}
          </View>
        ) : (
          <Empty text="No top-company data returned" />
        )}
      </ChartBox>

      {/* Bottom spacing */}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

/* -------------------------------------------------------------------------- */
/* Chart Box                                                                  */
/* -------------------------------------------------------------------------- */

function ChartBox({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.chartBox}>
      <Text style={styles.chartTitle}>
        {title}
      </Text>

      <Text style={styles.chartSubtitle}>
        {subtitle}
      </Text>

      {children}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty                                                                      */
/* -------------------------------------------------------------------------- */

function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>
        {text}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Jobs Trend Chart                                                           */
/* -------------------------------------------------------------------------- */

function JobsTrendChart({
  data,
}: {
  data: {
    name: string;
    value: number;
  }[];
}) {
  const width = Math.max(
    screenWidth - 56,
    320
  );

  const height = 250;

  const paddingLeft = 38;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const maxValue = Math.max(
    1,
    ...data.map(
      (item) => item.value
    )
  );

  const points = data.map(
    (item, index) => {
      const x =
        paddingLeft +
        (data.length === 1
          ? chartWidth / 2
          : (index /
              (data.length - 1)) *
            chartWidth);

      const y =
        paddingTop +
        chartHeight -
        (item.value / maxValue) *
          chartHeight;

      return {
        x,
        y,
        ...item,
      };
    }
  );

  let path = "";

  points.forEach(
    (point, index) => {
      if (index === 0) {
        path += `M ${point.x} ${point.y}`;
      } else {
        path += ` L ${point.x} ${point.y}`;
      }
    }
  );

  return (
    <View
      style={{
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Svg
        width={width}
        height={height}
      >
        {/* Horizontal grid lines */}

        {[0, 0.25, 0.5, 0.75, 1].map(
          (ratio, index) => {
            const y =
              paddingTop +
              chartHeight -
              ratio * chartHeight;

            const value =
              Math.round(
                maxValue * ratio
              );

            return (
              <G key={index}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={
                    width -
                    paddingRight
                  }
                  y2={y}
                  stroke={C.divider}
                  strokeWidth={1}
                />

                <SvgText
                  x={paddingLeft - 7}
                  y={y + 4}
                  fontSize="9"
                  fill={C.textMuted}
                  textAnchor="end"
                >
                  {value}
                </SvgText>
              </G>
            );
          }
        )}

        {/* Area */}

        {points.length > 1 && (
          <Path
            d={`${path} L ${
              points[
                points.length - 1
              ].x
            } ${
              paddingTop +
              chartHeight
            } L ${points[0].x} ${
              paddingTop +
              chartHeight
            } Z`}
            fill={C.accent}
            opacity={0.1}
          />
        )}

        {/* Line */}

        {points.length > 1 && (
          <Path
            d={path}
            fill="none"
            stroke={C.accent}
            strokeWidth={2.5}
          />
        )}

        {/* Points */}

        {points.map(
          (point, index) => (
            <G key={index}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={4}
                fill={C.surface}
                stroke={C.accent}
                strokeWidth={2}
              />

              <SvgText
                x={point.x}
                y={
                  height -
                  14
                }
                fontSize="9"
                fill={C.textMuted}
                textAnchor="middle"
              >
                {point.name}
              </SvgText>
            </G>
          )
        )}
      </Svg>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Category Chart                                                             */
/* -------------------------------------------------------------------------- */

function CategoryChart({
  data,
}: {
  data: {
    name: string;
    value: number;
  }[];
}) {
  const size = Math.min(
    screenWidth - 80,
    230
  );

  const center = size / 2;
  const radius = size / 2 - 18;
  const innerRadius =
    radius * 0.58;

  const total = data.reduce(
    (sum, item) =>
      sum + item.value,
    0
  );

  let currentAngle = -90;

  const polarToCartesian = (
    cx: number,
    cy: number,
    r: number,
    angle: number
  ) => {
    const angleInRadians =
      (angle * Math.PI) / 180;

    return {
      x:
        cx +
        r *
          Math.cos(
            angleInRadians
          ),

      y:
        cy +
        r *
          Math.sin(
            angleInRadians
          ),
    };
  };

  const createArc = (
    startAngle: number,
    endAngle: number
  ) => {
    const outerStart =
      polarToCartesian(
        center,
        center,
        radius,
        startAngle
      );

    const outerEnd =
      polarToCartesian(
        center,
        center,
        radius,
        endAngle
      );

    const innerStart =
      polarToCartesian(
        center,
        center,
        innerRadius,
        endAngle
      );

    const innerEnd =
      polarToCartesian(
        center,
        center,
        innerRadius,
        startAngle
      );

    const largeArc =
      endAngle -
        startAngle >
      180
        ? 1
        : 0;

    return `
      M ${outerStart.x} ${outerStart.y}
      A ${radius} ${radius}
        0 ${largeArc} 1
        ${outerEnd.x} ${outerEnd.y}
      L ${innerStart.x} ${innerStart.y}
      A ${innerRadius} ${innerRadius}
        0 ${largeArc} 0
        ${innerEnd.x} ${innerEnd.y}
      Z
    `;
  };

  return (
    <View style={styles.donutContainer}>
      <Svg
        width={size}
        height={size}
      >
        {data.map(
          (item, index) => {
            const percentage =
              total
                ? item.value /
                  total
                : 0;

            const angle =
              percentage * 360;

            const start =
              currentAngle;

            const end =
              currentAngle +
              angle;

            currentAngle = end;

            return (
              <Path
                key={item.name}
                d={createArc(
                  start,
                  end - 1
                )}
                fill={
                  colors[
                    index %
                      colors.length
                  ]
                }
              />
            );
          }
        )}

        <SvgText
          x={center}
          y={center - 5}
          fontSize="22"
          fontWeight="bold"
          fill={C.text}
          textAnchor="middle"
        >
          {total}
        </SvgText>

        <SvgText
          x={center}
          y={center + 14}
          fontSize="10"
          fill={C.textMuted}
          textAnchor="middle"
        >
          Total Jobs
        </SvgText>
      </Svg>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },

  content: {
    paddingHorizontal: 17,
    paddingTop: 20,
    paddingBottom: 18,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  headerText: {
    flex: 1,
    paddingRight: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: C.textSec,
    marginTop: 5,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    height: 30,
    borderRadius: 20,
    backgroundColor: C.successBg,
  },

  liveText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.success,
  },

  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 15,
  },

  loadingText: {
    color: C.textSec,
    fontSize: 12,
  },

  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 6,
  },

  metricCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    padding: 13,
    marginBottom: 3,
    shadowColor: "#0F172A",
    shadowOpacity: 0.025,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  metricTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  metricValue: {
    color: C.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 10,
  },

  metricLabel: {
    color: C.textSec,
    fontSize: 11,
    marginTop: 2,
  },

  chartBox: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    padding: 15,
    marginTop: 10,
    marginBottom: 0,
    shadowColor: "#0F172A",
    shadowOpacity: 0.025,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  chartTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "800",
  },

  chartSubtitle: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 4,
    marginBottom: 16,
  },

  empty: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: C.textMuted,
    fontSize: 12,
    textAlign: "center",
  },

  donutContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    backgroundColor: C.bg,
    paddingHorizontal: 8,
    height: 28,
    borderRadius: 7,
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 3,
    marginRight: 5,
  },

  legendText: {
    color: C.textSec,
    fontSize: 10,
    flexShrink: 1,
  },

  funnelContainer: {
    gap: 14,
    paddingTop: 3,
  },

  funnelItem: {
    width: "100%",
  },

  funnelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  funnelName: {
    color: C.text,
    fontSize: 12,
    fontWeight: "600",
  },

  funnelValue: {
    color: C.textSec,
    fontSize: 11,
  },

  funnelBackground: {
    height: 9,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: C.divider,
  },

  funnelProgress: {
    height: "100%",
    borderRadius: 99,
  },

  companyStats: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },

  companyStat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: C.divider,
  },

  companyStatValue: {
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
  },

  companyStatLabel: {
    color: C.textMuted,
    fontSize: 10,
    marginTop: 2,
  },

  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomColor: C.divider,
  },

  companyName: {
    flex: 1,
    color: C.text,
    fontSize: 12,
    fontWeight: "600",
    paddingRight: 10,
  },

  companyInfo: {
    color: C.textSec,
    fontSize: 10,
    textAlign: "right",
  },
});
