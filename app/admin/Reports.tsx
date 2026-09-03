import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { C, F } from "../../constants/tokens";
import {
    dismissAdminAbuseReport,
    getAdminAbuseReports,
    resolveAdminAbuseReport,
} from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

type AbuseReport = {
  id: number;
  status?: string;
  risk_level?: string;

  created_at?: string;

  reason?: string;
  description?: string;

  entity_type?: string;
  entity_id?: number | string;
  reported_entity_name?: string;

  reporter_name?: string;

  reporter?: {
    name?: string;
    email?: string;
  };

  reported_user?: {
    name?: string;
    email?: string;
  };
};

type ReportStatistics = {
  total?: number;
  pending?: number;
  resolved?: number;
  dismissed?: number;
};

export default function AdminReports() {
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [statistics, setStatistics] = useState<ReportStatistics>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadReports = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const response: any = await getAdminAbuseReports({
          status: "Pending",
          limit: 50,
          _: Date.now(),
        });

        setReports(Array.isArray(response?.recent_reports) ? response.recent_reports : []);
        setStatistics(response?.statistics ?? {});
        setError("");
      } catch (requestError: any) {
        setReports([]);
        setError(requestError?.response?.data?.message ?? "Failed to load abuse reports.");
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);
  useSyncRefresh("admin", () => loadReports(false));

  useEffect(() => {
    loadReports(true);
  }, [loadReports]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadReports(false);
    } finally {
      setRefreshing(false);
    }
  }, [loadReports]);

  const handleAction = async (report: AbuseReport, action: "resolve" | "dismiss") => {
    try {
      setUpdatingId(report.id);

      if (action === "resolve") {
        await resolveAdminAbuseReport(report.id, null);
      } else {
        await dismissAdminAbuseReport(report.id, null);
      }

      setReports((current) => current.filter((item) => item.id !== report.id));
      await loadReports(false);
      Alert.alert(
        "Success",
        action === "resolve"
          ? "Report resolved successfully."
          : "Report dismissed successfully.",
      );
    } catch (requestError: any) {
      const status = requestError?.response?.status;
      const serverMessage = requestError?.response?.data?.message;
      if (status === 404 || status === 422) {
        await loadReports(false);
      }
      Alert.alert(
        "Error",
        serverMessage ??
          (action === "resolve"
            ? "Failed to resolve report."
            : "Failed to dismiss report."),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmAction = (item: AbuseReport, action: "resolve" | "dismiss") => {
    const title = action === "resolve" ? "Resolve Report" : "Dismiss Report";

    const message =
      action === "resolve"
        ? `Are you sure you want to resolve report #${item.id}?`
        : `Are you sure you want to dismiss report #${item.id}?`;

    Alert.alert(title, message, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: action === "resolve" ? "Resolve" : "Dismiss",
        style: action === "dismiss" ? "destructive" : "default",
        onPress: () => handleAction(item, action),
      },
    ]);
  };

  const renderReport = ({ item }: { item: AbuseReport }) => {
    const reporter =
      item.reporter?.name ?? item.reporter_name ?? "Unknown reporter";

    const reported =
      item.reported_entity_name ??
      item.reported_user?.name ??
      `${item.entity_type ?? "Entity"} #${item.entity_id ?? "-"}`;

    const risk = item.risk_level ?? "Not classified";

    const status = item.status ?? "Pending";

    const isUpdating = updatingId === item.id;

    return (
      <ReportCard
        item={item}
        reporter={reporter}
        reported={reported}
        risk={risk}
        status={status}
        canAct={status === "Pending"}
        isUpdating={isUpdating}
        onResolve={() => confirmAction(item, "resolve")}
        onDismiss={() => confirmAction(item, "dismiss")}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Abuse Reports</Text>

          <Text style={styles.subtitle}>
            Review and manage user-submitted safety reports
          </Text>

          <Text style={styles.statisticsText}>
            Pending: {statistics.pending ?? reports.length} · Total: {statistics.total ?? reports.length}
          </Text>
        </View>

        {error ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="alert-circle-outline" size={34} color={C.error} />
            <Text style={styles.loadingText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => loadReports(true)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : loading && reports.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={C.accent} />

            <Text style={styles.loadingText}>Loading abuse reports...</Text>
          </View>
        ) : reports.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyScrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={C.accent}
                colors={[C.accent]}
              />
            }
          >
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="flag-outline" size={32} color={C.textMuted} />
              </View>

              <Text style={styles.emptyTitle}>No open abuse reports</Text>

              <Text style={styles.emptySubtitle}>
                There are currently no reports that require admin review.
              </Text>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderReport}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={C.accent}
                colors={[C.accent]}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/* =========================================================
   REPORT CARD
========================================================= */

type ReportCardProps = {
  item: AbuseReport;
  reporter: string;
  reported: string;
  risk: string;
  status: string;
  canAct: boolean;
  isUpdating: boolean;
  onResolve: () => void;
  onDismiss: () => void;
};

function ReportCard({
  item,
  reporter,
  reported,
  risk,
  status,
  canAct,
  isUpdating,
  onResolve,
  onDismiss,
}: ReportCardProps) {
  const riskIsHigh = risk.toLowerCase() === "high";

  return (
    <View style={styles.reportCard}>
      {/* Header */}
      <View style={styles.reportHeader}>
        <View style={styles.reportHeaderLeft}>
          <View style={styles.reportIconContainer}>
            <Ionicons name="shield-outline" size={19} color={C.error} />
          </View>

          <View style={styles.reportHeaderInfo}>
            <Text style={styles.reportTitle}>Report #{item.id}</Text>

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={C.textMuted} />

              <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.badgesContainer}>
          <Badge text={status} color={C.warning} background={C.warningBg} />

          <Badge
            text={`${risk} risk`}
            color={riskIsHigh ? C.error : C.info}
            background={riskIsHigh ? C.errorBg : C.infoBg}
          />
        </View>
      </View>

      {/* Reporter -> Reported */}
      <View style={styles.peopleContainer}>
        <View style={styles.personWrapper}>
          <Person
            label="Reporter"
            name={reporter}
            color={C.info}
            background={C.infoBg}
          />
        </View>

        <View style={styles.arrowContainer}>
          <Ionicons name="arrow-forward" size={15} color={C.textMuted} />
        </View>

        <View style={styles.personWrapper}>
          <Person
            label="Reported user"
            name={reported}
            color={C.error}
            background={C.errorBg}
          />
        </View>
      </View>

      {/* Reason */}
      <View style={styles.reasonContainer}>
        <View style={styles.reasonTitleRow}>
          <Ionicons name="alert-circle-outline" size={13} color={C.warning} />

          <Text style={styles.reasonTitle}>REPORT REASON</Text>
        </View>

        <Text style={styles.reasonText}>
          {item.reason ?? "No reason provided"}
        </Text>

        {item.description && item.description !== item.reason && (
          <Text style={styles.descriptionText}>{item.description}</Text>
        )}
      </View>

      {/* Actions */}
      {canAct ? <View style={styles.actions}>
        <Pressable
          disabled={isUpdating}
          onPress={onDismiss}
          style={({ pressed }) => [
            styles.outlineButton,
            pressed && !isUpdating && styles.buttonPressed,
            isUpdating && styles.disabledButton,
          ]}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={C.textSec} />
          ) : (
            <>
              <Ionicons name="close-outline" size={16} color={C.textSec} />

              <Text style={styles.outlineButtonText}>Dismiss</Text>
            </>
          )}
        </Pressable>

        <Pressable
          disabled={isUpdating}
          onPress={onResolve}
          style={({ pressed }) => [
            styles.resolveButton,
            pressed && !isUpdating && styles.buttonPressed,
            isUpdating && styles.disabledButton,
          ]}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color="#FFFFFF"
              />

              <Text style={styles.resolveButtonText}>Resolve Report</Text>
            </>
          )}
        </Pressable>
      </View> : null}
    </View>
  );
}

/* =========================================================
   BADGE
========================================================= */

function Badge({
  text,
  color,
  background,
}: {
  text: string;
  color: string;
  background: string;
}) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: background,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color,
          },
        ]}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

/* =========================================================
   PERSON
========================================================= */

function Person({
  label,
  name,
  color,
  background,
}: {
  label: string;
  name: string;
  color: string;
  background: string;
}) {
  const initial = name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <View style={styles.person}>
      <View
        style={[
          styles.personAvatar,
          {
            backgroundColor: background,
          },
        ]}
      >
        <Text
          style={[
            styles.personAvatarText,
            {
              color,
            },
          ]}
        >
          {initial}
        </Text>
      </View>

      <View style={styles.personInfo}>
        <Text style={styles.personLabel}>{label}</Text>

        <Text style={styles.personName} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text>
      </View>
    </View>
  );
}

/* =========================================================
   DATE
========================================================= */

function formatDate(date?: string) {
  if (!date) {
    return "-";
  }

  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },

  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
  },

  header: {
    paddingTop: 16,
    paddingBottom: 20,
  },

  title: {
    fontFamily: F,
    fontSize: 24,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.4,
  },

  subtitle: {
    fontFamily: F,
    color: C.textSec,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },

  statisticsText: {
    fontFamily: F,
    color: C.textSec,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 9,
  },

  listContent: {
    paddingBottom: 30,
  },

  reportCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,

    shadowColor: "#2F343C",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,

    elevation: 1,
  },

  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },

  reportHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  reportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: C.errorBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  reportHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },

  reportTitle: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  dateText: {
    fontFamily: F,
    color: C.textMuted,
    fontSize: 11,
    marginLeft: 5,
  },

  badgesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },

  badge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
    maxWidth: 105,
  },

  badgeText: {
    fontFamily: F,
    fontSize: 10,
    fontWeight: "700",
  },

  peopleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 17,
    gap: 8,
  },

  personWrapper: {
    flex: 1,
    minWidth: 0,
  },

  person: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  personAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  personAvatarText: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "800",
  },

  personInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },

  personLabel: {
    fontFamily: F,
    color: C.textMuted,
    fontSize: 10,
    marginBottom: 3,
  },

  personName: {
    fontFamily: F,
    color: C.text,
    fontSize: 12,
    fontWeight: "700",
  },

  arrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  reasonContainer: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.bg,
    borderLeftWidth: 3,
    borderLeftColor: C.warning,
  },

  reasonTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  reasonTitle: {
    fontFamily: F,
    color: C.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginLeft: 5,
  },

  reasonText: {
    fontFamily: F,
    color: C.text,
    fontSize: 13,
    lineHeight: 20,
  },

  descriptionText: {
    fontFamily: F,
    color: C.textSec,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 9,
    marginTop: 16,
  },

  outlineButton: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  outlineButtonText: {
    fontFamily: F,
    color: C.textSec,
    fontSize: 12,
    fontWeight: "600",
  },

  resolveButton: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 9,
    backgroundColor: C.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  resolveButtonText: {
    fontFamily: F,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  buttonPressed: {
    opacity: 0.7,
  },

  disabledButton: {
    opacity: 0.55,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },

  loadingText: {
    fontFamily: F,
    color: C.textSec,
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 14,
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 9,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  retryButtonText: {
    fontFamily: F,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 100,
  },

  emptyCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 35,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontFamily: F,
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },

  emptySubtitle: {
    fontFamily: F,
    color: C.textSec,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
  },
});
