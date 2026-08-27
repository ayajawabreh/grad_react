import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Briefcase,
  Clock,
  TrendingUp,
  Trophy,
} from "lucide-react-native";

import { C, F } from "../../constants/tokens";
import { useApplications } from "../../context/ApplicationsContext";

const FILTERS = [
  "All",
  "Applied",
  "Shortlisted",
  "Interview",
  "Hired",
  "Rejected",
] as const;

const COLORS = [
  "#C8A46A",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#B8924A",
  "#06B6D4",
  "#EC4899",
];

function pickColor(seed: number) {
  return COLORS[Math.abs(seed) % COLORS.length];
}

function getStatusColor(status: string) {
  switch (status) {
    case "Applied":
      return C.info;
    case "Shortlisted":
      return C.purple;
    case "Interview":
      return C.warning;
    case "Hired":
      return C.success;
    case "Rejected":
      return C.danger;
    default:
      return C.textSec;
  }
}

function getStatusBackground(status: string) {
  switch (status) {
    case "Applied":
      return C.infoBg;
    case "Shortlisted":
      return C.purpleBg;
    case "Interview":
      return C.warningBg;
    case "Hired":
      return C.successBg;
    case "Rejected":
      return C.dangerBg;
    default:
      return C.bg;
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: getStatusBackground(status),
        },
      ]}
    >
      <Text
        style={[
          styles.statusText,
          {
            color: getStatusColor(status),
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

export default function Applications() {
  const router = useRouter();

  const [filter, setFilter] =
    useState<(typeof FILTERS)[number]>("All");

  const { applications: apps, stats, loading, error } = useApplications();

  const filtered =
    filter === "All"
      ? apps
      : apps.filter(
          (app) => app.status === filter
        );

  const statItems = [
    {
      label: "Total",
      value: stats.total,
      icon: Briefcase,
      color: C.info,
      background: C.infoBg,
    },
    {
      label: "Active",
      value: stats.active,
      icon: Clock,
      color: C.accent,
      background: C.accentLight,
    },
    {
      label: "Interviews",
      value: stats.interviews,
      icon: TrendingUp,
      color: C.purple,
      background: C.purpleBg,
    },
    {
      label: "Offers",
      value: stats.offers,
      icon: Trophy,
      color: C.success,
      background: C.successBg,
    },
  ];

  const handleView = (jobId: number) => {
    if (!jobId) {
      console.error("Job ID is missing");
      return;
    }

    router.push({
      pathname: "/(student)/JobDetails",
      params: {
        id: String(jobId),
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          My Applications
        </Text>

        <Text style={styles.subtitle}>
          Track your job application progress
        </Text>
      </View>

      <View style={styles.statsContainer}>
        {statItems.map((stat) => {
          const Icon = stat.icon;

          return (
            <View
              key={stat.label}
              style={styles.statCard}
            >
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor:
                      stat.background,
                  },
                ]}
              >
                <Icon
                  size={17}
                  color={stat.color}
                />
              </View>

              <View style={styles.statInfo}>
                <Text style={styles.statValue}>
                  {stat.value}
                </Text>

                <Text style={styles.statLabel}>
                  {stat.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          styles.filtersContainer
        }
      >
        {FILTERS.map((item) => {
          const active = filter === item;

          return (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[
                styles.filterButton,
                active &&
                  styles.activeFilterButton,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  active &&
                    styles.activeFilterText,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.messageCard}>
          <ActivityIndicator
            size="small"
            color={C.purple}
          />

          <Text style={styles.messageText}>
            Loading...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.messageCard}>
          <Text
            style={[
              styles.messageText,
              {
                color: C.danger,
              },
            ]}
          >
            {error}
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.messageCard}>
          <Briefcase
            size={28}
            color={C.textMuted}
          />

          <Text style={styles.emptyTitle}>
            No applications found
          </Text>

          <Text style={styles.emptyText}>
            You don&apos;t have any applications
            matching this filter.
          </Text>
        </View>
      ) : (
        <View style={styles.applicationsCard}>
          {filtered.map((app, index) => {
            const color = pickColor(
              Number(app.job_post_id) || 0
            );

            const isLast =
              index === filtered.length - 1;

            return (
              <View
                key={app.id}
                style={[
                  styles.applicationRow,
                  !isLast &&
                    styles.applicationBorder,
                ]}
              >
                <View
                  style={[
                    styles.companyAvatar,
                    {
                      backgroundColor:
                        `${color}18`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.companyInitial,
                      {
                        color,
                      },
                    ]}
                  >
                    {app.company?.[0]?.toUpperCase() ??
                      "?"}
                  </Text>
                </View>

                <View
                  style={styles.applicationInfo}
                >
                  <Text
                    style={
                      styles.applicationTitle
                    }
                    numberOfLines={2}
                  >
                    {app.title}
                  </Text>

                  <Text
                    style={
                      styles.applicationCompany
                    }
                    numberOfLines={1}
                  >
                    {app.company ||
                      "Unknown company"}
                  </Text>

                  <Text
                    style={
                      styles.applicationDateMobile
                    }
                  >
                    {app.date}
                  </Text>
                </View>

                <View
                  style={
                    styles.applicationRight
                  }
                >
                  <StatusBadge
                    status={app.status}
                  />

                  <Pressable
                    onPress={() =>
                      handleView(
                        Number(app.job_post_id)
                      )
                    }
                    style={({ pressed }) => [
                      styles.viewButton,
                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <Text
                      style={
                        styles.viewButtonText
                      }
                    >
                      View
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
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
    fontSize: 14,
    color: C.textSec,
  },

  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  statCard: {
    width: "48%",
    minHeight: 76,
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  statInfo: {
    flex: 1,
  },

  statValue: {
    fontFamily: F,
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 24,
    color: C.text,
  },

  statLabel: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    marginTop: 3,
  },

  filtersContainer: {
    gap: 8,
    paddingBottom: 18,
  },

  filterButton: {
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },

  activeFilterButton: {
    borderColor: C.accent,
    backgroundColor: C.accentLight,
  },

  filterText: {
    fontFamily: F,
    fontSize: 12.5,
    fontWeight: "600",
    color: C.textSec,
  },

  activeFilterText: {
    color: C.accentHover,
  },

  messageCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  messageText: {
    marginTop: 10,
    fontFamily: F,
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
  },

  emptyTitle: {
    marginTop: 12,
    fontFamily: F,
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },

  emptyText: {
    marginTop: 6,
    fontFamily: F,
    fontSize: 12,
    lineHeight: 18,
    color: C.textMuted,
    textAlign: "center",
  },

  applicationsCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },

  applicationRow: {
    paddingHorizontal: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  applicationBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },

  companyAvatar: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  companyInitial: {
    fontFamily: F,
    fontSize: 15,
    fontWeight: "700",
  },

  applicationInfo: {
    flex: 1,
    minWidth: 0,
  },

  applicationTitle: {
    fontFamily: F,
    fontSize: 13.5,
    fontWeight: "600",
    color: C.text,
    lineHeight: 19,
  },

  applicationCompany: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    marginTop: 3,
  },

  applicationDateMobile: {
    fontFamily: F,
    fontSize: 10.5,
    color: C.textMuted,
    marginTop: 5,
  },

  applicationRight: {
    alignItems: "flex-end",
    gap: 8,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
  },

  statusText: {
    fontFamily: F,
    fontSize: 10.5,
    fontWeight: "700",
  },

  viewButton: {
    minWidth: 58,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  viewButtonText: {
    fontFamily: F,
    fontSize: 11.5,
    fontWeight: "700",
    color: C.text,
  },

  pressed: {
    opacity: 0.7,
  },
});
