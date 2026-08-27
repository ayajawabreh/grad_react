import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

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

/* =========================================================
   TYPES
========================================================= */

type IconName =
  | "calendar-outline"
  | "checkmark-circle-outline"
  | "alert-circle-outline"
  | "trending-up-outline"
  | "person-add-outline"
  | "star-outline"
  | "notifications-outline";

interface Notif {
  id: number;
  icon: IconName;
  title: string;
  body: string;
  time: string;
  read: boolean;
  color: string;
}

/* =========================================================
   HELPERS
========================================================= */

const iconFor = (
  title: string
): { icon: IconName; color: string } => {
  const t = title.toLowerCase();

  // Interview
  if (t.includes("interview")) {
    return {
      icon: "calendar-outline",
      color: C.purple,
    };
  }

  // Shortlist / Published / Confirmed / Approved
  if (
    t.includes("shortlist") ||
    t.includes("published") ||
    t.includes("confirmed") ||
    t.includes("approved")
  ) {
    return {
      icon: "checkmark-circle-outline",
      color: C.success,
    };
  }

  // Flag / Awaiting / Alert / Rejected
  if (
    t.includes("flag") ||
    t.includes("awaiting") ||
    t.includes("alert") ||
    t.includes("rejected")
  ) {
    return {
      icon: "alert-circle-outline",
      color: C.warning,
    };
  }

  // Trend / Milestone / Report
  if (
    t.includes("trend") ||
    t.includes("milestone") ||
    t.includes("report")
  ) {
    return {
      icon: "trending-up-outline",
      color: C.accent,
    };
  }

  // Registration / Application / Student / Company
  if (
    t.includes("registration") ||
    t.includes("application") ||
    t.includes("student") ||
    t.includes("company")
  ) {
    return {
      icon: "person-add-outline",
      color: C.info,
    };
  }

  // View
  if (t.includes("view")) {
    return {
      icon: "star-outline",
      color: C.warning,
    };
  }

  // Default
  return {
    icon: "notifications-outline",
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

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminNotifications() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const appState = useRef(AppState.currentState);

  /* =======================================================
     LOAD NOTIFICATIONS
  ======================================================= */

  const loadNotifications = async (
    showLoading = true
  ) => {
    try {
      setError("");

      if (showLoading) {
        setLoading(true);
      }

      const data = await getNotifications();

      setItems(
        data.notifications.map(mapToNotif)
      );
    } catch (err) {
      console.error(
        "Failed to load notifications:",
        err
      );

      setError("Failed to load notifications");
    } finally {
      if (showLoading) {
        setLoading(false);
      }

      setRefreshing(false);
    }
  };
  useSyncRefresh("notifications", () => loadNotifications(false));

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadNotifications();
  }, []);

  /* =======================================================
     AUTO REFRESH
     
     Web version:
     - every 10 seconds
     - refresh on window focus

     Mobile version:
     - every 10 seconds
     - refresh when app becomes active
  ======================================================= */

  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications(false);
    }, 10000);

    const subscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (
          appState.current.match(
            /inactive|background/
          ) &&
          nextState === "active"
        ) {
          loadNotifications(false);
        }

        appState.current = nextState;
      }
    );

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  /* =======================================================
     SUPABASE REALTIME
  ======================================================= */

  useEffect(() => {
    const channelName =
      "admin-notifications-realtime";

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log(
            "🔥 ADMIN NOTIFICATION REALTIME EVENT:",
            payload
          );

          const newNotification =
            payload.new as NotificationDTO;

          const notification = mapToNotif({
            id: newNotification.id,
            title: newNotification.title,
            message: newNotification.message,
            is_read: newNotification.is_read,
            time: "Just now",
            created_at:
              newNotification.created_at,
          });

          setItems((prev) => {
            // Prevent duplicate notification
            if (
              prev.some(
                (item) =>
                  item.id === notification.id
              )
            ) {
              return prev;
            }

            return [notification, ...prev];
          });
        }
      )
      .subscribe((status) => {
        console.log(
          "ADMIN NOTIFICATION REALTIME STATUS:",
          status
        );
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* =======================================================
     UNREAD COUNT
  ======================================================= */

  useEffect(() => {
    const channel = supabase
      .channel("admin-notifications-update-delete-sync")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        () => void loadNotifications(false),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications" },
        () => void loadNotifications(false),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = items.filter(
    (notification) => !notification.read
  ).length;

  /* =======================================================
     MARK ONE AS READ
  ======================================================= */

  const handleRead = async (id: number) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification
      )
    );

    try {
      await markNotificationAsRead(id);
      await loadNotifications(false);
    } catch (err) {
      console.error(
        "Failed to mark notification as read:",
        err
      );

      await loadNotifications();
    }
  };

  /* =======================================================
     MARK ALL AS READ
  ======================================================= */

  const handleReadAll = async () => {
    const previousItems = items;

    // Optimistic update
    setItems((prev) =>
      prev.map((notification) => ({
        ...notification,
        read: true,
      }))
    );

    try {
      await markAllNotificationsAsRead();
      await loadNotifications(false);
    } catch (err) {
      console.error(
        "Failed to mark all notifications as read:",
        err
      );

      setItems(previousItems);

      Alert.alert(
        "Error",
        "Failed to mark all notifications as read."
      );
    }
  };

  /* =======================================================
     DELETE NOTIFICATION
  ======================================================= */

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const previousItems = items;

            // Optimistic update
            setItems((prev) =>
              prev.filter(
                (notification) =>
                  notification.id !== id
              )
            );

            try {
              await deleteNotification(id);
              await loadNotifications(false);
            } catch (err) {
              console.error(
                "Failed to delete notification:",
                err
              );

              setItems(previousItems);

              Alert.alert(
                "Error",
                "Failed to delete notification."
              );
            }
          },
        },
      ]
    );
  };

  /* =======================================================
     PULL TO REFRESH
  ======================================================= */

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications(false);
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={C.accent}
          />

          <Text style={styles.loadingText}>
            Loading notifications...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* =======================================================
     NOTIFICATION ITEM
  ======================================================= */

  const renderNotification = ({
    item,
  }: {
    item: Notif;
  }) => {
    return (
      <Pressable
        onPress={() => {
          if (!item.read) {
            handleRead(item.id);
          }
        }}
        style={({ pressed }) => [
          styles.notificationCard,

          !item.read &&
            styles.unreadNotificationCard,

          pressed && styles.notificationPressed,
        ]}
      >
        {/* ICON */}

        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor:
                item.color + "18",
            },
          ]}
        >
          <Ionicons
            name={item.icon}
            size={20}
            color={item.color}
          />
        </View>

        {/* CONTENT */}

        <View style={styles.notificationContent}>
          {/* HEADER */}

          <View style={styles.notificationHeader}>
            <Text
              style={styles.notificationTitle}
              numberOfLines={2}
            >
              {item.title}
            </Text>

            <View style={styles.rightHeader}>
              <Text style={styles.notificationTime}>
                {item.time}
              </Text>

              {!item.read && (
                <View
                  style={styles.unreadDot}
                />
              )}

              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  handleDelete(item.id);
                }}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed &&
                    styles.deleteButtonPressed,
                ]}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={C.textMuted}
                />
              </Pressable>
            </View>
          </View>

          {/* BODY */}

          <Text style={styles.notificationBody}>
            {item.body}
          </Text>
        </View>
      </Pressable>
    );
  };

  /* =======================================================
     EMPTY
  ======================================================= */

  const renderEmpty = () => {
    if (error) {
      return null;
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="notifications-off-outline"
            size={28}
            color={C.textMuted}
          />
        </View>

        <Text style={styles.emptyTitle}>
          No notifications
        </Text>

        <Text style={styles.emptyText}>
          You don&apos;t have any notifications right now.
        </Text>
      </View>
    );
  };

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
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
                  styles.markAllButtonPressed,
              ]}
            >
              <Ionicons
                name="checkmark-done-outline"
                size={17}
                color={C.accent}
              />

              <Text style={styles.markAllText}>
                Mark all as read
              </Text>
            </Pressable>
          )}
        </View>

        {/* ERROR */}

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={C.warning}
            />

            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              onPress={() => loadNotifications()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* LIST */}

        <FlatList
          data={items}
          keyExtractor={(item) =>
            String(item.id)
          }
          renderItem={renderNotification}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            items.length === 0
              ? styles.emptyListContent
              : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={C.accent}
              colors={[C.accent]}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
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

  /* HEADER */

  header: {
    paddingTop: 18,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTextContainer: {
    flex: 1,
    marginRight: 10,
  },

  title: {
    fontFamily: F,
    fontSize: 24,
    fontWeight: "800",
    color: C.text,
    marginBottom: 4,
  },

  subtitle: {
    fontFamily: F,
    fontSize: 13,
    color: C.textSec,
  },

  markAllButton: {
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  markAllButtonPressed: {
    backgroundColor: C.accent + "12",
  },

  markAllText: {
    fontFamily: F,
    color: C.accent,
    fontSize: 12,
    fontWeight: "700",
  },

  /* ERROR */

  errorContainer: {
    marginBottom: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: C.warning + "18",
    flexDirection: "row",
    alignItems: "center",
  },

  errorText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: F,
    color: C.warning,
    fontSize: 12,
    lineHeight: 18,
  },

  retryButton: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: C.warning + "18",
  },

  retryText: {
    fontFamily: F,
    color: C.warning,
    fontSize: 11,
    fontWeight: "700",
  },

  /* LIST */

  listContent: {
    paddingTop: 2,
    paddingBottom: 30,
  },

  emptyListContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  /* NOTIFICATION */

  notificationCard: {
    width: "100%",
    marginBottom: 10,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  unreadNotificationCard: {
    borderColor: C.accent + "45",
    backgroundColor: C.surface,
  },

  notificationPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.995 }],
  },

  /* ICON */

  iconContainer: {
    width: 43,
    height: 43,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginRight: 12,
  },

  /* CONTENT */

  notificationContent: {
    flex: 1,
    minWidth: 0,
  },

  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  notificationTitle: {
    flex: 1,
    marginRight: 8,
    fontFamily: F,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: C.text,
  },

  rightHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },

  notificationTime: {
    fontFamily: F,
    fontSize: 10,
    color: C.textMuted,
    marginRight: 7,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
    marginRight: 7,
  },

  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonPressed: {
    backgroundColor: C.errorBg,
  },

  notificationBody: {
    fontFamily: F,
    fontSize: 12.5,
    lineHeight: 19,
    color: C.textSec,
  },

  /* LOADING */

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    fontFamily: F,
    fontSize: 13,
    color: C.textSec,
  },

  /* EMPTY */

  emptyContainer: {
    flex: 1,
    minHeight: 350,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontFamily: F,
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    marginBottom: 5,
  },

  emptyText: {
    fontFamily: F,
    fontSize: 12,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
