import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard, Building2, Plus, Briefcase, Users, BarChart2,
  Calendar, MessageSquare, Bell, Settings, LogOut, Search, Menu, X
} from "lucide-react";
import { C, F } from "../constants/tokens";
import { useAuth } from "../context/AuthContext";
import { getCompanyProfile } from "../imports/api";

const NAV = [
  { to: "/company/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/company/profile", icon: Building2, label: "Company Profile" },
  null,
  { to: "/company/jobs/create", icon: Plus, label: "Create Job", accent: true },
  { to: "/company/jobs", icon: Briefcase, label: "My Jobs" },
  { to: "/company/applicants", icon: Users, label: "Applicants", badge: 12 },
  { to: "/company/interviews", icon: Calendar, label: "Interviews", badge: 3 },
  null,
  { to: "/company/reports", icon: BarChart2, label: "Reports" },
  { to: "/company/messages", icon: MessageSquare, label: "Messages", badge: 4 },
  { to: "/company/notifications", icon: Bell, label: "Notifications", badge: 7 },
  null,
  { to: "/company/settings", icon: Settings, label: "Settings" },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { logout } = useAuth();
  const nav = useNavigate();

  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    getCompanyProfile()
      .then((data) => setCompany(data))
      .catch((error) => console.log(error));
  }, []);

  const companyName = company?.name || "Company";

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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: C.dark,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 900, fontFamily: F }}>
              {companyName.substring(0, 2).toUpperCase()}
            </span>
          </div>

          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.text,
                margin: 0,
                fontFamily: F,
              }}
            >
              {companyName}
            </p>

            <p
              style={{
                fontSize: 11,
                color: C.textSec,
                margin: 0,
                fontFamily: F,
              }}
            >
              Company Account
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.textMuted,
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, overflow: "auto", padding: "12px 10px" }}>
        {NAV.map((item, i) => {
          if (!item)
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

          const { to, icon: Icon, label, badge, accent } = item as any;

          return (
            <NavLink
              key={to}
              to={to}
              end={to.endsWith("/dashboard")}
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
                  : accent
                  ? C.dark + "08"
                  : "transparent",
                color: isActive
                  ? C.accent
                  : accent
                  ? C.dark
                  : C.textSec,
                fontFamily: F,
                fontSize: 13,
                fontWeight: isActive ? 600 : accent ? 600 : 400,
                marginBottom: 2,
              })}
            >
              <Icon size={16} />

              <span style={{ flex: 1 }}>{label}</span>

              {badge && (
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
                    fontFamily: F,
                  }}
                >
                  {badge}
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

function TopBar({ onMenu }: { onMenu: () => void }) {
  const nav = useNavigate();

  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    getCompanyProfile()
      .then((data) => setCompany(data))
      .catch((error) => console.log(error));
  }, []);

  const companyName = company?.name || "Company";

  return (
    <div
      style={{
        height: 60,
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 28px",
        flexShrink: 0,
      }}
    >
      <button
        onClick={onMenu}
        className="lg:hidden"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: C.textSec,
        }}
      >
        <Menu size={20} />
      </button>

      <div style={{ flex: 1, maxWidth: 380 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 12,
            background: C.bg,
            border: `1px solid ${C.border}`,
          }}
        >
          <Search size={14} style={{ color: C.textMuted }} />

          <input
            placeholder="Search candidates, jobs..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 13,
              color: C.text,
              background: "transparent",
              fontFamily: F,
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginLeft: "auto",
        }}
      >
        <button
          onClick={() => nav("/company/jobs/create")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 10,
            background: C.accent,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            fontFamily: F,
          }}
        >
          <Plus size={14} />
          Post a Job
        </button>

        <NavLink to="/company/notifications" style={{ textDecoration: "none" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.textSec,
              position: "relative",
            }}
          >
            <Bell size={17} />

            <span
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: C.error,
                border: "1.5px solid white",
              }}
            />
          </div>
        </NavLink>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 10px 4px 4px",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: C.dark,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", fontFamily: F }}>
              {companyName.substring(0, 2).toUpperCase()}
            </span>
          </div>

          <div className="hidden sm:block">
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.text,
                margin: 0,
                fontFamily: F,
              }}
            >
              {companyName}
            </p>

            <p
              style={{
                fontSize: 11,
                color: C.textSec,
                margin: 0,
                fontFamily: F,
              }}
            >
              Recruiter
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompanyLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role } = useAuth();
  const nav = useNavigate();

  if (role !== "company") {
    nav("/login");
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: C.bg,
        fontFamily: F,
      }}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className="hidden lg:flex"
        style={{
          width: 256,
          flexShrink: 0,
          background: C.surface,
          borderRight: `1px solid ${C.border}`,
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div
          className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
          style={{
            width: 272,
            background: C.surface,
            display: "flex",
            flexDirection: "column",
            boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <TopBar onMenu={() => setSidebarOpen(true)} />

        <main
          style={{
            flex: 1,
            overflow: "auto",
            padding: "32px",
            background: C.bg,
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}