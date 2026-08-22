import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { trendData } from "../../constants/data";
import { StatCard } from "../../components/ui";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Building2,
  Briefcase,
  Trophy,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";
import { getAdminDashboard } from "../../imports/api";

type DashboardData = {
  statistics?: {
    total_students?: number;
    total_companies?: number;
    active_jobs?: number;
    total_hires?: number;
  };
  needs_review?: {
    companies?: number;
    jobs?: number;
    reports?: number;
    total?: number;
  };
};

export default function AdminDashboard() {
  const nav = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await getAdminDashboard();

        setData(response?.data ?? response);
      } catch (error) {
        console.error("Failed to load admin dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const statistics = data?.statistics ?? {};
  const needsReview = data?.needs_review ?? {};

  const quickActions = [
    {
      label: "Review Companies",
      path: "/admin/companies",
      color: C.info,
      bg: C.infoBg,
    },
    {
      label: "Moderate Jobs",
      path: "/admin/jobs",
      color: C.warning,
      bg: C.warningBg,
    },
    {
      label: "Analytics",
      path: "/admin/analytics",
      color: C.purple,
      bg: C.purpleBg,
    },
    {
      label: "Reports",
      path: "/admin/reports",
      color: C.success,
      bg: C.successBg,
    },
  ];

  const summaryCards = [
    {
      label: "Companies Need Review",
      value: needsReview.companies ?? 0,
      icon: ClipboardList,
      color: C.warning,
      path: "/admin/companies",
    },
    {
      label: "Jobs Need Review",
      value: needsReview.jobs ?? 0,
      icon: Briefcase,
      color: C.info,
      path: "/admin/jobs",
    },
    {
      label: "Reports",
      value: needsReview.reports ?? 0,
      icon: ShieldAlert,
      color: C.error,
      path: "/admin/reports",
    },
  ];

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            margin: 0,
            fontFamily: F,
          }}
        >
          Platform Overview
        </h1>

        <p
          style={{
            color: C.textSec,
            marginTop: 6,
            fontSize: 13,
            fontWeight: 400,
            fontFamily: F,
          }}
        >
          CareerBridge admin dashboard — real-time platform insights
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Students"
          value={
            loading ? "..." : String(statistics.total_students ?? 0)
          }
          trend="+8%"
          icon={Users}
          color={C.info}
        />

        <StatCard
          label="Companies"
          value={
            loading ? "..." : String(statistics.total_companies ?? 0)
          }
          trend="+12%"
          icon={Building2}
          color={C.accent}
        />

        <StatCard
          label="Live Jobs"
          value={
            loading ? "..." : String(statistics.active_jobs ?? 0)
          }
          trend="+5%"
          icon={Briefcase}
          color={C.purple}
        />

        <StatCard
          label="Hires"
          value={
            loading ? "..." : String(statistics.total_hires ?? 0)
          }
          trend="+18%"
          icon={Trophy}
          color={C.success}
        />
      </div>

      <div
        style={{
          background: C.surface,
          borderRadius: 20,
          padding: 24,
          border: `1px solid ${C.border}`,
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 700,
            margin: "0 0 20px",
            fontFamily: F,
          }}
        >
          Platform Activity
        </h2>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={trendData.map((d) => ({
              ...d,
              v: d.v * 8,
            }))}
            margin={{
              top: 4,
              right: 4,
              left: -16,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="adminGrad"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={C.purple}
                  stopOpacity={0.25}
                />
                <stop
                  offset="95%"
                  stopColor={C.purple}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={C.divider}
            />

            <XAxis
              dataKey="month"
              tick={{
                fontSize: 12,
                fill: C.textSec,
                fontFamily: F,
                fontWeight: 400,
              }}
            />

            <YAxis
              tick={{
                fontSize: 12,
                fill: C.textSec,
                fontFamily: F,
                fontWeight: 400,
              }}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                fontFamily: F,
                fontSize: 12,
              }}
            />

            <Area
              type="monotone"
              dataKey="v"
              stroke={C.purple}
              strokeWidth={2}
              fill="url(#adminGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          background: C.surface,
          borderRadius: 20,
          padding: 24,
          border: `1px solid ${C.border}`,
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 700,
            margin: "0 0 16px",
            fontFamily: F,
          }}
        >
          Quick Actions
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => nav(action.path)}
              style={{
                padding: "18px 16px",
                borderRadius: 14,
                border: `1px solid ${C.border}`,
                background: action.bg,
                cursor: "pointer",
                fontFamily: F,
                fontSize: 13,
                fontWeight: 600,
                color: action.color,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = action.color;
                e.currentTarget.style.boxShadow = `0 4px 16px ${action.color}22`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        {summaryCards.map((summary) => {
          const Icon = summary.icon;

          return (
            <div
              key={summary.label}
              onClick={() => nav(summary.path)}
              style={{
                background: C.surface,
                borderRadius: 18,
                padding: 20,
                border: `1px solid ${C.border}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = summary.color;
                e.currentTarget.style.boxShadow = `0 4px 16px ${summary.color}18`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${summary.color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={20} color={summary.color} />
              </div>

              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 700,
                    fontFamily: F,
                  }}
                >
                  {loading ? "..." : summary.value}
                </p>

                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 400,
                    color: C.textSec,
                    fontFamily: F,
                  }}
                >
                  {summary.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
