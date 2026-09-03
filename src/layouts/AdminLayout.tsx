import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  User,
  Building2,
  Briefcase,
  BarChart2,
  Bell,
  Settings,
  LogOut,
  Shield,
  Search,
  Layers,
  Wrench,
  Flag,
  Menu,
  X,
} from "lucide-react";
import { C, F } from "../constants/tokens";
import { useAuth } from "../context/AuthContext";

const NAV = [
  {
    to: "/admin/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  null,
  {
    to: "/admin/students",
    icon: User,
    label: "Students",
  },
  {
    to: "/admin/companies",
    icon: Building2,
    label: "Companies",
  },
  {
    to: "/admin/jobs",
    icon: Briefcase,
    label: "Jobs",
  },
  null,
  {
    to: "/admin/categories",
    icon: Layers,
    label: "Categories",
  },
  {
    to: "/admin/skills",
    icon: Wrench,
    label: "Skills",
  },
  null,
  {
    to: "/admin/analytics",
    icon: BarChart2,
    label: "Reports & Analytics",
  },
  {
    to: "/admin/reports",
    icon: Flag,
    label: "Abuse Reports",
  },
  {
    to: "/admin/system-logs",
    icon: Shield,
    label: "System Logs",
  },
  {
    to: "/admin/notifications",
    icon: Bell,
    label: "Notifications",
  },
  {
    to: "/admin/settings",
    icon: Settings,
    label: "Settings",
  },
];

function Sidebar({
  admin,
  onClose,
}: {
  admin: any;
  onClose?: () => void;
}) {
  const { logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav("/login");
    onClose?.();
  };

  return (
    <>
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
              background: C.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Shield size={18} color="#fff" />
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
              {admin?.name || "Admin"}
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
              Admin
            </p>
          </div>
        </div>

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
            badge,
          } = item;

          return (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin/dashboard"}
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

              {badge && badge > 0 && (
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
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

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
  admin,
  onMenu,
}: {
  admin: any;
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
      <button
        onClick={onMenu}
        className="hidden"
        type="button"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: C.textSec,
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
          flexShrink: 0,
        }}
      >
        <Menu size={21} />
      </button>

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
            placeholder="Search platform..."
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

      <NavLink
        to="/admin/settings"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: C.accentLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Shield
            size={16}
            style={{
              color: C.accent,
            }}
          />
        </div>

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
              {admin?.name || "Admin"}
            </span>

            <span
              style={{
                fontFamily: F,
                fontSize: 10,
                color: C.textSec,
              }}
            >
              Admin
            </span>
          </div>
        </div>
      </NavLink>
    </div>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState<any>(null);

  const { role } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("cb_user");

    if (storedUser) {
      try {
        setAdmin(JSON.parse(storedUser));
      } catch {
        setAdmin(null);
      }
    }
  }, []);

  useEffect(() => {
    if (role && role !== "admin") {
      nav("/login");
    }
  }, [role, nav]);

  if (role !== "admin") {
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
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className="flex"
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
          admin={admin}
          onClose={undefined}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
          style={{
            width: 272,
            maxWidth: "85vw",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          <Sidebar
            admin={admin}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}

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
          admin={admin}
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
