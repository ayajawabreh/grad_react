import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { C, F } from "../../constants/tokens";
import { Btn, SBadge } from "../../components/ui";
import { Briefcase, Clock, TrendingUp, Trophy } from "lucide-react";
import {
  fetchMyApplications,
  ApiApplication,
  ApplicationStats,
} from "../../imports/jobs";

const FILTERS = [
  "All",
  "Applied",
  "Shortlisted",
  "Interview",
  "Hired",
  "Rejected",
] as const;

const COLORS = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
];

function pickColor(seed: number) {
  return COLORS[seed % COLORS.length];
}

export default function Applications() {
  const nav = useNavigate();
  const [filter, setFilter] = useState("All");

  const [apps, setApps] = useState<ApiApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    active: 0,
    interviews: 0,
    offers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    fetchMyApplications()
      .then((res) => {
        setApps(res.applications);
        setStats(res.stats);
      })
      .catch(() => setError("Failed to load applications"))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "All"
      ? apps
      : apps.filter((a) => a.status === filter);

  const statItems = [
    {
      label: "Total",
      value: stats.total,
      icon: Briefcase,
      color: C.info,
    },
    {
      label: "Active",
      value: stats.active,
      icon: Clock,
      color: C.accent,
    },
    {
      label: "Interviews",
      value: stats.interviews,
      icon: TrendingUp,
      color: C.purple,
    },
    {
      label: "Offers",
      value: stats.offers,
      icon: Trophy,
      color: C.success,
    },
  ];

  return (
    <div
      style={{
        fontFamily: F,
        color: C.text,
        paddingBottom: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: 26 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 700,
              color: C.text,
            }}
          >
            My Applications
          </h1>

          <p
            style={{
              margin: "7px 0 0",
              fontSize: 14,
              color: C.textSec,
            }}
          >
            Track your job application progress
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 24,
          }}
        >
          {statItems.map((s) => (
            <div
              key={s.label}
              style={{
                background: C.surface,
                borderRadius: 16,
                padding: "15px 17px",
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: `${s.color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <s.icon size={17} color={s.color} />
              </div>

              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 21,
                    fontWeight: 700,
                    lineHeight: 1.1,
                  }}
                >
                  {s.value}
                </p>

                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 12,
                    color: C.textSec,
                  }}
                >
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "7px 15px",
                borderRadius: 99,
                border: `1px solid ${
                  filter === f ? C.accent : C.border
                }`,
                background:
                  filter === f ? C.accentLight : C.surface,
                color:
                  filter === f ? C.accentHover : C.textSec,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: F,
                transition: "all 0.15s",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div
            style={{
              background: C.surface,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: 50,
              textAlign: "center",
              color: C.textMuted,
              fontSize: 14,
            }}
          >
            Loading...
          </div>
        ) : error ? (
          <div
            style={{
              background: C.surface,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: 50,
              textAlign: "center",
              color: C.textMuted,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              background: C.surface,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: 50,
              textAlign: "center",
              color: C.textMuted,
              fontSize: 14,
            }}
          >
            No applications found
          </div>
        ) : (
          <div
            style={{
              background: C.surface,
              borderRadius: 18,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
          >
            {filtered.map((app, i) => {
              const color = pickColor(app.job_post_id);

              return (
                <div
                  key={app.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 18px",
                    borderBottom:
                      i < filtered.length - 1
                        ? `1px solid ${C.divider}`
                        : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "transparent";
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      background: `${color}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 15,
                      color,
                      flexShrink: 0,
                    }}
                  >
                    {app.company?.[0] ?? "?"}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: 13.5,
                        color: C.text,
                      }}
                    >
                      {app.title}
                    </p>

                    <p
                      style={{
                        margin: "3px 0 0",
                        fontSize: 12,
                        color: C.textSec,
                      }}
                    >
                      {app.company}
                    </p>
                  </div>

                  <SBadge s={app.status} />

                  <span
                    style={{
                      fontSize: 11.5,
                      color: C.textMuted,
                      minWidth: 90,
                      textAlign: "right",
                    }}
                  >
                    {app.date}
                  </span>

                  <Btn
                    v="outline"
                    size="sm"
                    onClick={() =>
                      nav(`/student/jobs/${app.job_post_id}`)
                    }
                  >
                    View
                  </Btn>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
