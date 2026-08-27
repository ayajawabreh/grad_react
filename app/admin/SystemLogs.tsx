import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { C, F } from "../../constants/tokens";
import { getAdminSystemLogs } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

type Log = {
  id?: number | string;
  message?: string;
  action?: string;
  event?: string;
  description?: string;
  details?: string;
  created_at?: string;
  user?: {
    name?: string;
  };
};

type EventStyle = {
  icon: string;
  color: string;
  bg: string;
  label: string;
};

function eventStyle(title: string): EventStyle {
  const value = title.toLowerCase();

  if (value.includes("reject") || value.includes("delete")) {
    return {
      icon: "shield-check-outline",
      color: C.error,
      bg: C.errorBg,
      label: "Moderation",
    };
  }

  if (value.includes("job")) {
    return {
      icon: "briefcase-outline",
      color: C.info,
      bg: C.infoBg,
      label: "Job",
    };
  }

  if (value.includes("student") || value.includes("company")) {
    return {
      icon: "account-outline",
      color: C.purple,
      bg: C.purpleBg,
      label: "Account",
    };
  }

  if (value.includes("skill") || value.includes("categor")) {
    return {
      icon: "sparkles",
      color: C.accentHover,
      bg: C.accentLight,
      label: "Content",
    };
  }

  return {
    icon: "pulse",
    color: C.success,
    bg: C.successBg,
    label: "System",
  };
}

export default function AdminSystemLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);

      const response = await getAdminSystemLogs();

      const data = response?.data ?? response;

      setLogs(Array.isArray(data) ? data : (data?.logs ?? data?.data ?? []));
    } catch (error) {
      console.error("Failed to load system logs:", error);

      setLogs([]);
    } finally {
      setLoading(false);
    }
  };
  useSyncRefresh("admin", loadLogs);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return logs;
    }

    return logs.filter((log) =>
      `${log.message ?? ""} ${log.action ?? ""} ${log.event ?? ""} ${
        log.user?.name ?? ""
      }`
        .toLowerCase()
        .includes(query),
    );
  }, [logs, search]);

  const todayCount = useMemo(() => {
    return logs.filter((log) => {
      if (!log.created_at) {
        return false;
      }

      const date = new Date(log.created_at);
      const today = new Date();

      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    }).length;
  }, [logs]);

  const renderLog = ({ item, index }: { item: Log; index: number }) => {
    const title = item.message ?? item.action ?? item.event ?? "System event";

    const { icon, color, bg, label } = eventStyle(title);

    const date = item.created_at ? new Date(item.created_at) : null;

    const description =
      item.description ??
      item.details ??
      (item.user?.name
        ? `Performed by ${item.user.name}`
        : "Platform activity");

    return (
      <View style={styles.logRow}>
        {/* Timeline line */}
        {index < filtered.length - 1 && <View style={styles.timelineLine} />}

        {/* Icon */}
        <View
          style={[
            styles.logIcon,
            {
              backgroundColor: bg,
            },
          ]}
        >
          <MaterialCommunityIcons name={icon as any} size={19} color={color} />
        </View>

        {/* Content */}
        <View style={styles.logContent}>
          <View style={styles.titleRow}>
            <Text style={styles.logTitle} numberOfLines={2}>
              {title}
            </Text>

            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: bg,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color,
                  },
                ]}
              >
                {label}
              </Text>
            </View>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        </View>

        {/* Date */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>
            {date
              ? date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "-"}
          </Text>

          <Text style={styles.timeText}>
            {date
              ? date.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : ""}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>System Logs</Text>

          <Text style={styles.subtitle}>
            Recent administrative and platform activity
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <Stat
            label="Total activity"
            value={logs.length}
            icon="pulse"
            color={C.info}
            bg={C.infoBg}
          />

          <Stat
            label="Today"
            value={todayCount}
            icon="time-outline"
            color={C.success}
            bg={C.successBg}
          />
        </View>
      </View>

      {/* Main Card */}
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>Activity timeline</Text>

            <Text style={styles.cardSubtitle}>Newest events appear first</Text>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={17} color={C.textMuted} />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search activity..."
              placeholderTextColor={C.textMuted}
              style={styles.searchInput}
              returnKeyType="search"
            />

            {search.length > 0 && (
              <Ionicons
                name="close-circle"
                size={17}
                color={C.textMuted}
                onPress={() => setSearch("")}
              />
            )}
          </View>
        </View>

        {/* Loading */}
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            text={
              search
                ? "No activity matches your search."
                : "No system logs found."
            }
          />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item, index) => String(item.id ?? index)}
            renderItem={renderLog}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}

/* =========================
   STAT COMPONENT
========================= */

function Stat({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={styles.stat}>
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: bg,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon as any} size={16} color={color} />
      </View>

      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>

        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

/* =========================
   LOADING
========================= */

function LoadingState() {
  return (
    <View style={styles.emptyContainer}>
      <ActivityIndicator size="small" color={C.accent} />

      <Text style={styles.emptyText}>Loading system activity...</Text>
    </View>
  );
}

/* =========================
   EMPTY
========================= */

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="pulse" size={28} color={C.textMuted} />
      </View>

      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  header: {
    marginBottom: 18,
  },

  headerText: {
    marginBottom: 14,
  },

  title: {
    fontFamily: F,
    fontSize: 23,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.4,
  },

  subtitle: {
    fontFamily: F,
    color: C.textSec,
    fontSize: 13,
    marginTop: 5,
    lineHeight: 19,
  },

  statsContainer: {
    flexDirection: "row",
    gap: 10,
  },

  stat: {
    flex: 1,
    minHeight: 58,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  statInfo: {
    flex: 1,
    minWidth: 0,
  },

  statValue: {
    fontFamily: F,
    fontSize: 17,
    fontWeight: "800",
    color: C.text,
  },

  statLabel: {
    fontFamily: F,
    color: C.textMuted,
    fontSize: 9,
    marginTop: 1,
  },

  card: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,

    elevation: 1,
  },

  cardHeader: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },

  cardHeaderText: {
    marginBottom: 12,
  },

  cardTitle: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },

  cardSubtitle: {
    fontFamily: F,
    color: C.textMuted,
    fontSize: 11,
    marginTop: 3,
  },

  searchContainer: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.bg,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 11,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    height: 40,
    paddingVertical: 0,

    fontFamily: F,
    fontSize: 12,
    color: C.text,
  },

  listContent: {
    paddingHorizontal: 14,
    paddingVertical: 5,
  },

  logRow: {
    position: "relative",
    minHeight: 72,

    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 12,

    gap: 10,

    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },

  timelineLine: {
    position: "absolute",
    left: 20,
    top: 50,
    bottom: -13,
    width: 1,
    backgroundColor: C.border,
  },

  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    zIndex: 2,
  },

  logContent: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  logTitle: {
    flexShrink: 1,
    fontFamily: F,
    fontSize: 12.5,
    fontWeight: "700",
    color: C.text,
    lineHeight: 18,
  },

  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },

  categoryText: {
    fontFamily: F,
    fontSize: 8.5,
    fontWeight: "700",
  },

  description: {
    fontFamily: F,
    color: C.textMuted,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 4,
  },

  dateContainer: {
    width: 74,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  dateText: {
    fontFamily: F,
    fontSize: 9.5,
    fontWeight: "600",
    color: C.text,
    textAlign: "right",
  },

  timeText: {
    fontFamily: F,
    fontSize: 9.5,
    color: C.textSec,
    marginTop: 3,
    textAlign: "right",
  },

  emptyContainer: {
    flex: 1,
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  emptyIcon: {
    marginBottom: 10,
  },

  emptyText: {
    fontFamily: F,
    color: C.textSec,
    fontSize: 12.5,
    textAlign: "center",
  },
});
