import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
} from "lucide-react-native";

import { C } from "../../constants/tokens";
import { getAdminApplications } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

type Application = {
  id: number;
  job_id?: number;
  status?: string;
  created_at?: string;

  student?: {
    name?: string;
  };

  student_name?: string;

  job?: {
    id?: number;
    title?: string;

    company?: {
      company_name?: string;
    };
  };

  job_title?: string;
  company_name?: string;
};

const colors: Record<
  string,
  [string, string]
> = {
  Interview: [
    C.purpleBg,
    C.purple,
  ],

  Shortlisted: [
    C.accentLight,
    C.accent,
  ],

  Applied: [
    C.infoBg,
    C.info,
  ],

  Hired: [
    C.successBg,
    C.success,
  ],
};

export default function AdminApplications() {
  const { jobId, jobTitle } = useLocalSearchParams<{ jobId?: string; jobTitle?: string }>();
  const [items, setItems] = useState<
    Application[]
  >([]);

  const [summary, setSummary] =
    useState<Record<string, number>>(
      {}
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const loadApplications = async (
    showLoading = true
  ) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const response =
        await getAdminApplications();

      const data =
        response?.data ??
        response ??
        {};

      setItems(
        Array.isArray(data)
          ? data
          : data.applications ??
              data.items ??
              []
      );

      setSummary(
        Array.isArray(data)
          ? {}
          : data.statistics ??
              data.summary ??
              {}
      );
    } catch (error) {
      console.error(
        "Failed to load applications:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useSyncRefresh("applications", () => loadApplications(false));

  useEffect(() => {
    loadApplications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadApplications(false);
  };

  const filteredItems = jobId
    ? items.filter(item => String(item.job_id ?? item.job?.id ?? "") === String(jobId))
    : items;

  const total = jobId
    ? filteredItems.length
    : summary.total ?? summary.total_applications ?? items.length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
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
        <Text style={styles.title}>
          Applications
        </Text>

        <Text style={styles.subtitle}>
          {jobId ? `Applicants for ${jobTitle || "this job"}` : "Platform-wide application activity"}
        </Text>
      </View>

      {/* Statistics */}

      <View style={styles.statsGrid}>
        <StatCard
          label="Total Applications"
          value={
            loading
              ? "..."
              : String(total)
          }
          icon={FileText}
          color={C.info}
        />

        <StatCard
          label="This Month"
          value={
            loading
              ? "..."
              : String(
                  summary.this_month ??
                    summary.monthly ??
                    0
                )
          }
          icon={TrendingUp}
          color={C.accent}
        />

        <StatCard
          label="Successful Hires"
          value={
            loading
              ? "..."
              : String(
                  summary.hired ??
                    summary.successful_hires ??
                    0
                )
          }
          icon={CheckCircle}
          color={C.success}
        />

        <StatCard
          label="Pending Review"
          value={
            loading
              ? "..."
              : String(
                  summary.pending ?? 0
                )
          }
          icon={Clock}
          color={C.warning}
        />
      </View>

      {/* Recent Applications */}

      <View style={styles.applicationsCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            Recent Applications
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
              color={C.accent}
            />

            <Text style={styles.loadingText}>
              Loading applications...
            </Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText
              size={30}
              color={C.textMuted}
            />

            <Text style={styles.emptyTitle}>
              No applications found
            </Text>

            <Text style={styles.emptyText}>
              There are currently no applications
              available.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredItems.map(
              (item, index) => {
                const status =
                  item.status ??
                  "Pending";

                const [
                  backgroundColor,
                  textColor,
                ] =
                  colors[
                    status
                  ] ?? [
                    C.warningBg,
                    C.warning,
                  ];

                return (
                  <ApplicationRow
                    key={item.id}
                    item={item}
                    status={status}
                    backgroundColor={
                      backgroundColor
                    }
                    textColor={
                      textColor
                    }
                    isLast={
                      index ===
                      filteredItems.length -
                        1
                    }
                  />
                );
              }
            )}
          </View>
        )}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

/* -------------------------------------------------------------------------- */
/* Statistics Card                                                            */
/* -------------------------------------------------------------------------- */

type StatCardProps = {
  label: string;
  value: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
  }>;
  color: string;
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor:
              `${color}18`,
          },
        ]}
      >
        <Icon
          size={19}
          color={color}
        />
      </View>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Application Row                                                            */
/* -------------------------------------------------------------------------- */

type ApplicationRowProps = {
  item: Application;
  status: string;
  backgroundColor: string;
  textColor: string;
  isLast: boolean;
};

function ApplicationRow({
  item,
  status,
  backgroundColor,
  textColor,
  isLast,
}: ApplicationRowProps) {
  const candidate =
    item.student?.name ??
    item.student_name ??
    "—";

  const job =
    item.job?.title ??
    item.job_title ??
    "—";

  const company =
    item.job?.company
      ?.company_name ??
    item.company_name ??
    "—";

  const date = item.created_at
    ? new Date(
        item.created_at
      ).toLocaleDateString()
    : "—";

  return (
    <View
      style={[
        styles.applicationRow,
        {
          borderBottomWidth:
            isLast ? 0 : 1,
        },
      ]}
    >
      {/* Candidate */}

      <View style={styles.applicationField}>
        <Text style={styles.fieldLabel}>
          CANDIDATE
        </Text>

        <Text
          style={styles.candidateName}
          numberOfLines={1}
        >
          {candidate}
        </Text>
      </View>

      {/* Job */}

      <View style={styles.applicationField}>
        <Text style={styles.fieldLabel}>
          JOB
        </Text>

        <Text
          style={styles.fieldValue}
          numberOfLines={2}
        >
          {job}
        </Text>
      </View>

      {/* Company */}

      <View style={styles.applicationField}>
        <Text style={styles.fieldLabel}>
          COMPANY
        </Text>

        <Text
          style={styles.fieldValue}
          numberOfLines={1}
        >
          {company}
        </Text>
      </View>

      {/* Status + Date */}

      <View style={styles.bottomRow}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: textColor,
              },
            ]}
          >
            {status}
          </Text>
        </View>

        <Text style={styles.dateText}>
          {date}
        </Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },

  /* Header */

  header: {
    marginBottom: 22,
  },

  title: {
    color: C.text,
    fontSize: 24,
    fontWeight: "700",
  },

  subtitle: {
    color: C.textSec,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },

  /* Stats */

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  statCard: {
    width: "48.5%",
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
    marginBottom: 10,
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  statValue: {
    color: C.text,
    fontSize: 22,
    fontWeight: "800",
  },

  statLabel: {
    color: C.textSec,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },

  /* Applications Card */

  applicationsCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },

  cardHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },

  cardTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
  },

  /* Loading */

  loadingContainer: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: C.textSec,
    fontSize: 12,
    marginTop: 9,
  },

  /* Empty */

  emptyContainer: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },

  emptyText: {
    color: C.textSec,
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
  },

  /* List */

  list: {
    width: "100%",
  },

  applicationRow: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomColor: C.divider,
  },

  applicationField: {
    marginBottom: 11,
  },

  fieldLabel: {
    color: C.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 4,
  },

  candidateName: {
    color: C.text,
    fontSize: 13,
    fontWeight: "600",
  },

  fieldValue: {
    color: C.textSec,
    fontSize: 13,
    lineHeight: 18,
  },

  /* Bottom Row */

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },

  dateText: {
    color: C.textMuted,
    fontSize: 11,
  },
});
