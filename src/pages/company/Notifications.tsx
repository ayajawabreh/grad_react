import { useEffect, useState } from "react";
import { UserPlus, Calendar, TrendingUp, Bell, Star, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { C, F } from "../../constants/tokens";
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
  icon: React.ComponentType<any>;
  title: string;
  body: string;
  time: string;
  read: boolean;
  color: string;
}

const iconFor = (title: string): { icon: React.ComponentType<any>; color: string } => {
  const t = title.toLowerCase();
  if (t.includes("interview")) return { icon: Calendar, color: C.purple };
  if (t.includes("shortlist") || t.includes("published") || t.includes("confirmed")) return { icon: CheckCircle2, color: C.success };
  if (t.includes("flag") || t.includes("awaiting") || t.includes("alert")) return { icon: AlertCircle, color: C.warning };
  if (t.includes("trend") || t.includes("milestone") || t.includes("report")) return { icon: TrendingUp, color: C.accent };
  if (t.includes("registration") || t.includes("application")) return { icon: UserPlus, color: C.info };
  if (t.includes("view")) return { icon: Star, color: C.warning };
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

export default function Notifications() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getNotifications();
      setItems(data.notifications.map(mapToNotif));
    } catch (err) {
      setError("Failed to load notifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

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
          console.log("🔥 NOTIFICATION EVENT:", payload);
        }
      )
      .subscribe((status) => {
        console.log("Notification realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  const handleRead = async (id: number) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error(err);
      loadNotifications();
    }
  };

  const handleReadAll = async () => {
    const prevItems = items;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error(err);
      setItems(prevItems);
    }
  };

  const handleDelete = async (id: number) => {
    const prevItems = items;
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotification(id);
    } catch (err) {
      console.error(err);
      setItems(prevItems);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.textSec, fontFamily: F }}>
        Loading notifications...
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: "0 0 4px", fontFamily: F }}>
            Notifications
          </h1>
          <p style={{ fontSize: 14, color: C.textSec, margin: 0, fontFamily: F }}>
            {unreadCount} unread
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleReadAll}
            style={{ fontSize: 13, fontWeight: 600, color: C.accent, background: "none", border: "none", cursor: "pointer", fontFamily: F }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: C.warning + "18", color: C.warning, fontSize: 13, fontFamily: F, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {items.length === 0 && !error && (
        <div style={{ padding: 40, textAlign: "center", color: C.textMuted, fontFamily: F }}>
          No notifications right now
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 720 }}>
        {items.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.read && handleRead(n.id)}
            style={{
              padding: "18px 24px",
              borderRadius: 16,
              border: `1px solid ${n.read ? C.border : C.accent + "40"}`,
              background: C.surface,
              display: "flex",
              gap: 14,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: n.color + "18",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <n.icon size={16} style={{ color: n.color }} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 3px", fontFamily: F }}>
                  {n.title}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F }}>
                    {n.time}
                  </span>
                  {!n.read && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent }} />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n.id);
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}
                  >
                    <Trash2 size={13} style={{ color: C.textMuted }} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 13, color: C.textSec, margin: 0, lineHeight: 1.5, fontFamily: F }}>
                {n.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}