import { useEffect, useState } from "react";
import {
  UserPlus,
  Calendar,
  TrendingUp,
  Bell,
  Star,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { C, F } from "../../constants/tokens";
import { LucideIcon } from "lucide-react";
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
  icon: LucideIcon;
  title: string;
  body: string;
  time: string;
  read: boolean;
  color: string;
}

const iconFor = (title: string): { icon: LucideIcon; color: string } => {
  const t = title.toLowerCase();

  if (t.includes("interview")) return { icon: Calendar, color: C.purple };

  if (
    t.includes("shortlist") ||
    t.includes("published") ||
    t.includes("confirmed")
  ) {
    return { icon: CheckCircle2, color: C.success };
  }

  if (t.includes("flag") || t.includes("awaiting") || t.includes("alert")) {
    return { icon: AlertCircle, color: C.warning };
  }

  if (t.includes("trend") || t.includes("milestone") || t.includes("report")) {
    return { icon: TrendingUp, color: C.accent };
  }

  if (t.includes("registration") || t.includes("application")) {
    return { icon: UserPlus, color: C.info };
  }

  if (t.includes("view")) {
    return { icon: Star, color: C.warning };
  }

  return { icon: Bell, color: C.accent };
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      setError("");

      const data = await getNotifications();

      setItems(data.notifications.map(mapToNotif));
      setUnreadCount(data.unread_count);
    } catch (err) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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
        console.log("🔥 REALTIME EVENT:", payload);

        const newNotification = payload.new as any;

        const { icon, color } = iconFor(newNotification.title);

        const notification: Notif = {
          id: newNotification.id,
          icon,
          title: newNotification.title,
          body: newNotification.message,
          time: "Just now",
          read: newNotification.is_read,
          color,
        };

        setItems((prev) => [
          notification,
          ...prev,
        ]);

        setUnreadCount((prev) => prev + 1);
      }
    )
    .subscribe((status) => {
      console.log("REALTIME STATUS:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  const handleMarkAsRead = async (id: number) => {
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );

    setUnreadCount((prev) => Math.max(prev - 1, 0));

    try {
      await markNotificationAsRead(id);
    } catch {
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setItems((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
        }))
      );

      setUnreadCount(0);

      await markAllNotificationsAsRead();
    } catch {
      fetchNotifications();
    }
  };

  const handleDelete = async (id: number) => {
    const oldItems = items;

    setItems((prev) =>
      prev.filter((n) => n.id !== id)
    );

    try {
      await deleteNotification(id);
    } catch {
      setItems(oldItems);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: C.textSec,
          fontFamily: F,
        }}
      >
        Loading notifications...
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: C.text,
              margin: "0 0 4px",
              fontFamily: F,
            }}
          >
            Notifications
          </h1>

          <p
            style={{
              fontSize: 14,
              color: C.textSec,
              margin: 0,
              fontFamily: F,
            }}
          >
            {unreadCount} unread
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            style={{
              color: C.accent,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: F,
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            background: C.warning + "18",
            color: C.warning,
            borderRadius: 10,
          }}
        >
          {error}
        </div>
      )}

      {items.length === 0 && (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: C.textMuted,
          }}
        >
          No notifications right now
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 720,
        }}
      >
        {items.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.read && handleMarkAsRead(n.id)}
            style={{
              padding: "18px 24px",
              borderRadius: 16,
              border: `1px solid ${
                n.read ? C.border : C.accent + "40"
              }`,
              background: C.surface,
              display: "flex",
              gap: 14,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: n.color + "18",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <n.icon size={16} color={n.color} />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <p
                  style={{
                    fontWeight: 700,
                    margin: 0,
                    fontFamily: F,
                  }}
                >
                  {n.title}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <span>{n.time}</span>

                  {!n.read && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: C.accent,
                      }}
                    />
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <p
                style={{
                  color: C.textSec,
                  fontSize: 13,
                  margin: 4,
                  fontFamily: F,
                }}
              >
                {n.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}