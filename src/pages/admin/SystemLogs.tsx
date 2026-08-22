import { useEffect, useMemo, useState } from "react";
import { Activity, BriefcaseBusiness, Clock3, Search, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { C, F } from "../../constants/tokens";
import { getAdminSystemLogs } from "../../imports/api";

function eventStyle(title: string) {
  const value = title.toLowerCase();
  if (value.includes("reject") || value.includes("delete")) return { Icon: ShieldCheck, color: C.error, bg: C.errorBg, label: "Moderation" };
  if (value.includes("job")) return { Icon: BriefcaseBusiness, color: C.info, bg: C.infoBg, label: "Job" };
  if (value.includes("student") || value.includes("company")) return { Icon: UserRound, color: C.purple, bg: C.purpleBg, label: "Account" };
  if (value.includes("skill") || value.includes("categor")) return { Icon: Sparkles, color: C.accentHover, bg: C.accentLight, label: "Content" };
  return { Icon: Activity, color: C.success, bg: C.successBg, label: "System" };
}

export default function AdminSystemLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAdminSystemLogs()
      .then((response) => {
        const data = response?.data ?? response;
        setLogs(Array.isArray(data) ? data : data?.logs ?? data?.data ?? []);
      })
      .catch((error) => console.error("Failed to load system logs:", error))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) => `${log.message ?? ""} ${log.action ?? ""} ${log.event ?? ""} ${log.user?.name ?? ""}`.toLowerCase().includes(query));
  }, [logs, search]);

  const todayCount = logs.filter((log) => {
    if (!log.created_at) return false;
    const date = new Date(log.created_at);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }).length;

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 800, margin: 0 }}>System Logs</h1>
          <p style={{ color: C.textSec, fontSize: 14, margin: "6px 0 0" }}>Recent administrative and platform activity</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Stat label="Total activity" value={logs.length} icon={Activity} color={C.info} bg={C.infoBg} />
          <Stat label="Today" value={todayCount} icon={Clock3} color={C.success} bg={C.successBg} />
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 3px 16px rgba(47,52,60,.04)" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div><div style={{ fontSize: 14, fontWeight: 750 }}>Activity timeline</div><div style={{ color: C.textMuted, fontSize: 11, marginTop: 3 }}>Newest events appear first</div></div>
          <div style={{ width: 250, maxWidth: "48%", display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg }}>
            <Search size={15} color={C.textMuted} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity..." style={{ width: "100%", border: 0, outline: 0, background: "transparent", color: C.text, fontFamily: F, fontSize: 12 }} />
          </div>
        </div>

        {loading ? <Empty text="Loading system activity..." /> : filtered.length === 0 ? <Empty text={search ? "No activity matches your search." : "No system logs found."} /> : (
          <div style={{ padding: "6px 18px" }}>
            {filtered.map((log, index) => {
              const title = log.message ?? log.action ?? log.event ?? "System event";
              const { Icon, color, bg, label } = eventStyle(title);
              const date = log.created_at ? new Date(log.created_at) : null;
              return (
                <div key={log.id ?? index} style={{ position: "relative", display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: "13px 0", borderBottom: index < filtered.length - 1 ? `1px solid ${C.divider}` : "none" }}>
                  {index < filtered.length - 1 && <div style={{ position: "absolute", left: 21, top: 46, bottom: -14, width: 1, background: C.border }} />}
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: bg, color, display: "grid", placeItems: "center", position: "relative", zIndex: 1 }}><Icon size={18} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span><span style={{ padding: "3px 7px", borderRadius: 99, background: bg, color, fontSize: 9, fontWeight: 750 }}>{label}</span></div>
                    <div style={{ color: C.textMuted, fontSize: 11, marginTop: 5 }}>{log.description ?? log.details ?? (log.user?.name ? `Performed by ${log.user.name}` : "Platform activity")}</div>
                  </div>
                  <div style={{ textAlign: "right", color: C.textSec, fontSize: 11, whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: 650, color: C.text }}>{date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</div>
                    <div style={{ marginTop: 4 }}>{date ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, color, bg }: any) {
  return <div style={{ minWidth: 125, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "10px 13px", display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 32, height: 32, borderRadius: 9, background: bg, color, display: "grid", placeItems: "center" }}><Icon size={15} /></div><div><div style={{ fontSize: 16, fontWeight: 800 }}>{value}</div><div style={{ color: C.textMuted, fontSize: 9 }}>{label}</div></div></div>;
}

function Empty({ text }: { text: string }) {
  return <div style={{ padding: 45, textAlign: "center", color: C.textSec, fontSize: 13 }}><Activity size={28} color={C.textMuted} style={{ marginBottom: 10 }} /><div>{text}</div></div>;
}
