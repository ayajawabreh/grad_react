import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    AppState,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    AlertCircle,
    Bell,
    Calendar,
    CheckCircle2,
    Star,
    Trash2,
    TrendingUp,
    UserPlus,
} from "lucide-react-native";

import { C, F } from "../../../constants/tokens";

import {
    deleteNotification,
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    NotificationDTO,
} from "../../../imports/Notifications";

import { supabase } from "../../../lib/supabase";

interface Notif {
  id: number;
  icon: any;
  title: string;
  body: string;
  time: string;
  read: boolean;
  color: string;
}

const iconFor = (title: string): { icon: any; color: string } => {
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

  if (t.includes("flag") || t.includes("awaiting") || t.includes("alert")) {
    return {
      icon: AlertCircle,
      color: C.warning,
    };
  }

  if (t.includes("trend") || t.includes("milestone") || t.includes("report")) {
    return {
      icon: TrendingUp,
      color: C.accent,
    };
  }

  if (t.includes("registration") || t.includes("application")) {
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

const mapToNotif = (n: NotificationDTO): Notif => {
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

export function NotificationsView() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // Load notifications
  // =========================
  const loadNotifications = async () => {
    try {
      setError("");

      const data = await getNotifications();

      setItems(data.notifications.map(mapToNotif));
    } catch (err) {
      console.error("Failed to load notifications:", err);

      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Initial load
  // =========================
  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      void loadNotifications();
    }, 10000);

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void loadNotifications();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("student-notifications-full-sync")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        () => void loadNotifications(),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications" },
        () => void loadNotifications(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // =========================
  // Supabase Realtime
  // =========================
  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("🔥 NOTIFICATION REALTIME EVENT:", payload);

          const newNotification = payload.new as NotificationDTO;

          const notification = mapToNotif({
            id: newNotification.id,
            title: newNotification.title,
            message: newNotification.message,
            is_read: newNotification.is_read,
            time: "Just now",
            created_at: newNotification.created_at,
          });

          setItems((prev) => {
            if (prev.some((item) => item.id === notification.id)) {
              return prev;
            }

            return [notification, ...prev];
          });
        },
      )

      .subscribe((status) => {
        console.log("NOTIFICATION REALTIME STATUS:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================
  // Unread count
  // =========================
  const unreadCount = items.filter((n) => !n.read).length;

  // =========================
  // Mark notification as read
  // =========================
  const handleRead = async (id: number) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

    try {
      await markNotificationAsRead(id);
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);

      await loadNotifications();
    }
  };

  // =========================
  // Mark all as read
  // =========================
  const handleReadAll = async () => {
    const previousItems = items;

    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        read: true,
      })),
    );

    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);

      setItems(previousItems);
    }
  };

  // =========================
  // Delete notification
  // =========================
  const handleDelete = async (id: number) => {
    const previousItems = items;

    setItems((prev) => prev.filter((n) => n.id !== id));

    try {
      await deleteNotification(id);
      await loadNotifications();
    } catch (err) {
      console.error("Failed to delete notification:", err);

      setItems(previousItems);
    }
  };

  // =========================
  // Loading
  // =========================
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.accent} />

        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  // =========================
  // Notification item
  // =========================
  const renderNotification = ({ item }: { item: Notif }) => {
    const Icon = item.icon;

    return (
      <Pressable
        onPress={() => {
          if (!item.read) {
            handleRead(item.id);
          }
        }}
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: item.color + "18",
            },
          ]}
        >
          <Icon size={18} color={item.color} />
        </View>

        {/* Content */}
        <View style={styles.notificationContent}>
          {/* Top row */}
          <View style={styles.topRow}>
            <Text style={styles.notificationTitle} numberOfLines={2}>
              {item.title}
            </Text>

            <Text style={styles.notificationTime} numberOfLines={1}>
              {item.time}
            </Text>
          </View>

          {/* Body */}
          <Text style={styles.notificationBody}>{item.body}</Text>

          {/* Bottom row */}
          <View style={styles.bottomRow}>
            {!item.read && <View style={styles.unreadIndicator} />}

            <Pressable
              onPress={() => handleDelete(item.id)}
              hitSlop={10}
              style={styles.deleteButton}
            >
              <Trash2 size={16} color={C.textMuted} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>

          <Text style={styles.subtitle}>{unreadCount} unread</Text>
        </View>

        {unreadCount > 0 && (
          <Pressable onPress={handleReadAll} style={styles.readAllButton}>
            <Text style={styles.readAllText}>Mark all as read</Text>
          </Pressable>
        )}
      </View>

      {/* Error */}
      {error !== "" && (
        <View style={styles.errorBox}>
          <AlertCircle size={17} color={C.warning} />

          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Empty state */}
      {items.length === 0 && !error ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Bell size={26} color={C.textMuted} />
          </View>

          <Text style={styles.emptyTitle}>No notifications</Text>

          <Text style={styles.emptyText}>
            You don't have any notifications right now.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNotification}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: C.textSec,
    fontFamily: F,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
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

  readAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.accent + "12",
  },

  readAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.accent,
    fontFamily: F,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: C.warning + "18",
    marginBottom: 14,
  },

  errorText: {
    flex: 1,
    fontSize: 13,
    color: C.warning,
    fontFamily: F,
  },

  listContent: {
    paddingBottom: 40,
  },

  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },

  unreadCard: {
    borderColor: C.accent + "40",
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

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  notificationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
    lineHeight: 19,
  },

  notificationTime: {
    fontSize: 10.5,
    color: C.textMuted,
    fontFamily: F,
  },

  notificationBody: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: C.textSec,
    fontFamily: F,
  },

  bottomRow: {
    minHeight: 22,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
  },

  deleteButton: {
    padding: 4,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: C.textMuted + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.text,
    fontFamily: F,
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: C.textMuted,
    fontFamily: F,
    textAlign: "center",
  },
});
