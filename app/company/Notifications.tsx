import { useEffect, useState } from "react";
import {
  AppState,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import {
  UserPlus,
  Calendar,
  TrendingUp,
  Bell,
  Star,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react-native";

import { C, F } from "../../constants/tokens";
import { useSyncRefresh } from "../../context/SyncContext";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  NotificationDTO,
} from "../../imports/Notifications";

import { supabase } from "../../lib/supabase";

interface Notif {
  id: number;
  icon: any;
  title: string;
  body: string;
  time: string;
  read: boolean;
  color: string;
}

const iconFor = (
  title: string
): {
  icon: any;
  color: string;
} => {
  const t = title.toLowerCase();

  if (t.includes("interview")) {
    return {
      icon: Calendar,
      color: C.purple,
    };
  }

  if (
    t.includes("shortlist") ||
    t.includes("published") ||
    t.includes("confirmed")
  ) {
    return {
      icon: CheckCircle2,
      color: C.success,
    };
  }

  if (
    t.includes("flag") ||
    t.includes("awaiting") ||
    t.includes("alert")
  ) {
    return {
      icon: AlertCircle,
      color: C.warning,
    };
  }

  if (
    t.includes("trend") ||
    t.includes("milestone") ||
    t.includes("report")
  ) {
    return {
      icon: TrendingUp,
      color: C.accent,
    };
  }

  if (
    t.includes("registration") ||
    t.includes("application")
  ) {
    return {
      icon: UserPlus,
      color: C.info,
    };
  }

  if (t.includes("view")) {
    return {
      icon: Star,
      color: C.warning,
    };
  }

  return {
    icon: Bell,
    color: C.accent,
  };
};

const mapToNotif = (
  n: NotificationDTO
): Notif => {
  const { icon, color } = iconFor(n.title);

  return {
    id: n.id,
    icon,
    title: n.title,
    body: n.message,
    time: n.time,
    read: n.is_read,
    color,
  };
};

export default function Notifications() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError("");

    try {
      const data = await getNotifications();

      setItems(
        data.notifications.map(mapToNotif)
      );
    } catch (err) {
      console.error(err);
      setError(
        "Failed to load notifications"
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };
  useSyncRefresh("notifications", () => loadNotifications(false));

  useEffect(() => {
    loadNotifications();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void loadNotifications(false);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("company-notifications-full-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => void loadNotifications(false),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  /*
   * Supabase Realtime
   */
  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_events",
        },
        (payload) => {
          console.log(
            "🔥 NOTIFICATION EVENT:",
            payload
          );

          // Reload notifications when
          // a new notification arrives
          loadNotifications();
        }
      )
      .subscribe((status) => {
        console.log(
          "Notification realtime status:",
          status
        );
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = items.filter(
    (n) => !n.read
  ).length;

  /*
   * Mark one notification as read
   */
  const handleRead = async (
    id: number
  ) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              read: true,
            }
          : n
      )
    );

    try {
      await markNotificationAsRead(id);
      await loadNotifications(false);
    } catch (err) {
      console.error(err);

      // Restore from backend
      loadNotifications();
    }
  };

  /*
   * Mark all as read
   */
  const handleReadAll = async () => {
    const previousItems = items;

    // Optimistic update
    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        read: true,
      }))
    );

    try {
      await markAllNotificationsAsRead();
      await loadNotifications(false);
    } catch (err) {
      console.error(err);

      // Restore old state
      setItems(previousItems);
    }
  };

  /*
   * Delete notification
   */
  const handleDelete = async (
    id: number
  ) => {
    const previousItems = items;

    // Remove immediately from UI
    setItems((prev) =>
      prev.filter((n) => n.id !== id)
    );

    try {
      await deleteNotification(id);
      await loadNotifications(false);
    } catch (err) {
      console.error(err);

      // Restore if request failed
      setItems(previousItems);
    }
  };

  /*
   * Loading
   */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="small"
          color={C.accent}
        />

        <Text style={styles.loadingText}>
          Loading notifications...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>
              Notifications
            </Text>

            <Text style={styles.subtitle}>
              {unreadCount} unread
            </Text>
          </View>

          {unreadCount > 0 && (
            <Pressable
              onPress={handleReadAll}
              style={({ pressed }) => [
                styles.markAllButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Text
                style={
                  styles.markAllText
                }
              >
                Mark all as read
              </Text>
            </Pressable>
          )}
        </View>

        {/* Error */}
        {error !== "" && (
          <View style={styles.errorBox}>
            <AlertCircle
              size={17}
              color={C.warning}
            />

            <Text
              style={styles.errorText}
            >
              {error}
            </Text>
          </View>
        )}

        {/* Empty */}
        {items.length === 0 &&
          error === "" && (
            <View
              style={styles.emptyContainer}
            >
              <View
                style={styles.emptyIcon}
              >
                <Bell
                  size={24}
                  color={C.textMuted}
                />
              </View>

              <Text
                style={styles.emptyTitle}
              >
                No notifications
              </Text>

              <Text
                style={styles.emptyText}
              >
                You don&apos;t have any
                notifications right now.
              </Text>
            </View>
          )}

        {/* Notifications */}
        <View style={styles.list}>
          {items.map((n) => {
            const Icon = n.icon;

            return (
              <Pressable
                key={n.id}
                onPress={() => {
                  if (!n.read) {
                    handleRead(n.id);
                  }
                }}
                style={({ pressed }) => [
                  styles.notificationCard,

                  !n.read &&
                    styles.unreadCard,

                  pressed &&
                    styles.cardPressed,
                ]}
              >
                {/* Icon */}
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor:
                        n.color + "18",
                    },
                  ]}
                >
                  <Icon
                    size={18}
                    color={n.color}
                  />
                </View>

                {/* Content */}
                <View
                  style={
                    styles.notificationContent
                  }
                >
                  {/* Top row */}
                  <View
                    style={
                      styles.notificationTop
                    }
                  >
                    <Text
                      style={
                        styles.notificationTitle
                      }
                      numberOfLines={2}
                    >
                      {n.title}
                    </Text>

                    <View
                      style={
                        styles.rightActions
                      }
                    >
                      <Text
                        style={styles.time}
                      >
                        {n.time}
                      </Text>

                      {!n.read && (
                        <View
                          style={
                            styles.unreadDot
                          }
                        />
                      )}

                      {/* Delete */}
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(
                            n.id
                          );
                        }}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.deleteButton,
                          pressed &&
                            styles.deletePressed,
                        ]}
                      >
                        <Trash2
                          size={16}
                          color={
                            C.textMuted
                          }
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* Body */}
                  <Text
                    style={
                      styles.notificationBody
                    }
                  >
                    {n.body}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

/* =========================
   Styles
========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 35,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: C.textSec,
    fontFamily: F,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
    gap: 12,
  },

  headerLeft: {
    flex: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: C.text,
    fontFamily: F,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: C.textSec,
    fontFamily: F,
  },

  markAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  markAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.accent,
    fontFamily: F,
  },

  pressed: {
    opacity: 0.6,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor:
      C.warning + "18",
    marginBottom: 16,
  },

  errorText: {
    flex: 1,
    fontSize: 12,
    color: C.warning,
    fontFamily: F,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
    marginBottom: 5,
  },

  emptyText: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: F,
    textAlign: "center",
    lineHeight: 18,
  },

  list: {
    gap: 10,
  },

  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,

    paddingVertical: 15,
    paddingHorizontal: 14,

    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,

    backgroundColor: C.surface,
  },

  unreadCard: {
    borderColor: C.accent + "40",
  },

  cardPressed: {
    opacity: 0.75,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    flexShrink: 0,
  },

  notificationContent: {
    flex: 1,
    minWidth: 0,
  },

  notificationTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  notificationTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
    lineHeight: 18,
  },

  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexShrink: 0,
  },

  time: {
    fontSize: 10,
    color: C.textMuted,
    fontFamily: F,
  },

  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: C.accent,
  },

  deleteButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
  },

  deletePressed: {
    backgroundColor: C.bg,
  },

  notificationBody: {
    marginTop: 5,
    fontSize: 12,
    color: C.textSec,
    fontFamily: F,
    lineHeight: 18,
  },
});
