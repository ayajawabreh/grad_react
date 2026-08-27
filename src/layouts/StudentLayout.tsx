import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  User,
  FileText,
  Search,
  BookmarkCheck,
  Sparkles,
  ClipboardList,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Bot,
  Menu,
  X,
} from "lucide-react";
import { C, F } from "../constants/tokens";
import { useAuth } from "../context/AuthContext";
import { API } from "../imports/api";
import { getConversations } from "../imports/messages";
import { supabase } from "../lib/supabase";
import { useSyncResourceVersion } from "../sync/useSyncResourceVersion";

const NAV = [
  {
    to: "/student/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    to: "/student/profile",
    icon: User,
    label: "Profile",
  },
  {
    to: "/student/resume",
    icon: FileText,
    label: "Resume Builder",
  },
  null,
  {
    to: "/student/jobs",
    icon: Search,
    label: "Browse Jobs",
  },
  {
    to: "/student/saved",
    icon: BookmarkCheck,
    label: "Saved Jobs",
  },
  {
    to: "/student/recommended",
    icon: Sparkles,
    label: "Suggested Jobs",
  },
  {
    to: "/student/applications",
    icon: ClipboardList,
    label: "Applications",
  },
  null,
  {
    to: "/student/messages",
    icon: MessageSquare,
    label: "Messages",
  },
  {
    to: "/student/notifications",
    icon: Bell,
    label: "Notifications",
  },
  {
    to: "/student/ai",
    icon: Bot,
    label: "AI Assistant",
  },
  null,
  {
    to: "/student/settings",
    icon: Settings,
    label: "Settings",
  },
];

function Sidebar({
  student,
  unreadMessages,
  onUnreadReset,
  onClose,
}: {
  student: any;
  unreadMessages: number;
  onUnreadReset: () => void;
  onClose?: () => void;
}) {
  const { logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav("/login");
    onClose?.();
  };

  useEffect(() => {
    const handleReset = () => {
      onUnreadReset();
    };

    window.addEventListener("messages:unread-reset", handleReset);

    return () => {
      window.removeEventListener(
        "messages:unread-reset",
        handleReset
      );
    };
  }, [onUnreadReset]);

  return (
    <>
      {/* Sidebar Header */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <img
              src={
                student?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  student?.name || "User"
                )}`
              }
              alt="Avatar"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.text,
                margin: 0,
                fontFamily: F,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {student?.name || "Student"}
            </p>

            <p
              style={{
                fontSize: 11,
                color: C.textSec,
                margin: 0,
                fontFamily: F,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {student?.univ || ""}
            </p>
          </div>
        </div>

        {/* Close button - mobile only */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.textMuted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "12px 10px",
        }}
      >
        {NAV.map((item, i) => {
          if (!item) {
            return (
              <div
                key={i}
                style={{
                  height: 1,
                  background: C.divider,
                  margin: "6px 8px",
                }}
              />
            );
          }

          const {
            to,
            icon: Icon,
            label,
          } = item;

          const isMessages = label === "Messages";

          const currentBadge = isMessages
            ? unreadMessages
            : 0;

          return (
            <NavLink
              key={to}
              to={to}
              end={to === "/student/dashboard"}
              onClick={onClose}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 12,
                textDecoration: "none",
                background: isActive
                  ? C.accentLight
                  : "transparent",
                color: isActive
                  ? C.accent
                  : C.textSec,
                fontFamily: F,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                marginBottom: 2,
                minWidth: 0,
              })}
            >
              <Icon size={16} />

              <span
                style={{
                  flex: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {label}
              </span>

              {isMessages && currentBadge > 0 && (
                <span
                  style={{
                    minWidth: 20,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 9,
                    background: C.accent,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {currentBadge > 99
                    ? "99+"
                    : currentBadge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div
        style={{
          padding: "10px 10px 16px",
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 12px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: "transparent",
            color: C.error,
            fontFamily: F,
            fontSize: 13,
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  );
}

function TopBar({
  student,
  onMenu,
}: {
  student: any;
  onMenu: () => void;
}) {
  return (
    <div
      style={{
        height: 68,
        borderBottom: `1px solid ${C.border}`,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
        flexShrink: 0,
      }}
    >
      {/* Mobile Menu Button */}
      <button
        onClick={onMenu}
        className="lg:hidden"
        type="button"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: C.textSec,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
          flexShrink: 0,
        }}
      >
        <Menu size={21} />
      </button>

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: C.bg || "#f8fafc",
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: "8px 12px",
            maxWidth: 400,
            width: "100%",
          }}
        >
          <Search
            size={14}
            style={{
              color: C.textMuted,
              flexShrink: 0,
            }}
          />

          <input
            placeholder="Search jobs, companies..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: F,
              width: "100%",
              minWidth: 0,
              fontSize: 13,
              color: C.text,
            }}
          />
        </div>
      </div>

      {/* Profile */}
      <NavLink
        to="/student/profile"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <img
          src={
            student?.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              student?.name || "User"
            )}`
          }
          alt="Profile"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            objectFit: "cover",
          }}
        />

        <div className="hidden sm:flex">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontFamily: F,
                fontSize: 12,
                fontWeight: 600,
                color: C.text,
              }}
            >
              {student?.name || "Student"}
            </span>

            <span
              style={{
                fontFamily: F,
                fontSize: 10,
                color: C.textSec,
              }}
            >
              Student
            </span>
          </div>
        </div>
      </NavLink>
    </div>
  );
}

export default function StudentLayout() {
  const profileSyncVersion = useSyncResourceVersion("student");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [student, setStudent] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const { role } = useAuth();
  const nav = useNavigate();

  const loadUnreadMessages = async () => {
    try {
      const data = await getConversations();

      const conversations = Array.isArray(data)
        ? data
        : (data as any)?.data ?? [];

      const total = conversations.reduce(
        (sum: number, conversation: any) =>
          sum + Number(conversation.unread || 0),
        0
      );

      setUnreadMessages(total);
    } catch (error) {
      console.error(
        "Failed to load unread messages:",
        error
      );
    }
  };

  useEffect(() => {
    API.get("/student/profile")
      .then((res) => {
        setStudent(res.data);
      })
      .catch((err) => {
        console.error(
          "Failed to load student profile:",
          err
        );
      });
  }, [profileSyncVersion]);

  useEffect(() => {
    if (role && role !== "student") {
      nav("/login");
    }
  }, [role, nav]);

  useEffect(() => {
    if (role !== "student") return;

    loadUnreadMessages();

    const channel = supabase
      .channel("student_sidebar_message_events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_events",
        },
        (payload) => {
          const newMessage = payload.new as any;

          if (!newMessage?.receiver_id) return;

          setUnreadMessages((prev) => prev + 1);
        }
      )
      .subscribe();

    const handleReset = () => {
      loadUnreadMessages();
    };

    window.addEventListener(
      "messages:unread-reset",
      handleReset
    );

    const interval = window.setInterval(() => {
      loadUnreadMessages();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);

      window.removeEventListener(
        "messages:unread-reset",
        handleReset
      );

      window.clearInterval(interval);
    };
  }, [role]);

  if (role !== "student") {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg || "#f8fafc",
        fontFamily: F,
        display: "flex",
      }}
    >
      {/* Dark overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div
        className="hidden lg:flex"
        style={{
          width: 240,
          flexShrink: 0,
          background: "#fff",
          borderRight: `1px solid ${C.border}`,
          flexDirection: "column",
          overflow: "hidden",
          height: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        <Sidebar
          student={student}
          unreadMessages={unreadMessages}
          onUnreadReset={loadUnreadMessages}
        />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
          style={{
            width: 272,
            maxWidth: "85vw",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            boxShadow:
              "4px 0 24px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          <Sidebar
            student={student}
            unreadMessages={unreadMessages}
            onUnreadReset={loadUnreadMessages}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TopBar
          student={student}
          onMenu={() => setSidebarOpen(true)}
        />

        <main
          style={{
            flex: 1,
            overflow: "auto",
            padding: "32px",
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
