import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Flag, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import { dismissAdminAbuseReport, getAdminAbuseReports, resolveAdminAbuseReport } from "../../imports/api";
import { useSyncResourceVersion } from "../../sync/useSyncResourceVersion";

export default function AdminReports() {
  const reportsSyncVersion = useSyncResourceVersion("reports");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadReports = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await getAdminAbuseReports({ status: "Pending" });
      const data = response?.data ?? response;
      const list = Array.isArray(data) ? data : data?.recent_reports ?? data?.reports ?? data?.data ?? [];
      setReports(
        list.filter((item: any) =>
          !["resolved", "dismissed", "closed"].includes(
            String(item.status ?? "pending").toLowerCase()
          )
        )
      );
    } catch (error) {
      console.error("Failed to load abuse reports:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, [reportsSyncVersion]);

  const handleAction = async (id: number, action: "resolve" | "dismiss") => {
    try {
      setUpdatingId(id);
      if (action === "resolve") await resolveAdminAbuseReport(id);
      else await dismissAdminAbuseReport(id);
      setReports((current) => current.filter((item) => item.id !== id));
      toast.success(
        action === "resolve"
          ? "Report resolved successfully"
          : "Report dismissed successfully",
        {
          description:
            action === "resolve"
              ? "The report was marked as resolved and removed from the open reports list."
              : "The report was dismissed and removed from the open reports list.",
        }
      );
    } catch (error: any) {
      console.error(`Failed to ${action} abuse report:`, error);
      const message = String(error?.response?.data?.message || "");
      if (/already closed/i.test(message)) {
        setReports((current) => current.filter((item) => item.id !== id));
        toast.info("Report was already closed", {
          description: "The reports list has been updated.",
        });
        void loadReports(false);
        return;
      }
      toast.error(
        action === "resolve"
          ? "Could not resolve the report"
          : "Could not dismiss the report",
        { description: error?.response?.data?.message }
      );
    } finally { setUpdatingId(null); }
  };

  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "-";

  return (
    <div style={{ fontFamily: F, color: C.text }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 25, fontWeight: 800, margin: 0 }}>Abuse Reports</h1>
        <p style={{ color: C.textSec, fontSize: 14, margin: "6px 0 0" }}>Review and manage user-submitted safety reports</p>
      </div>

      <section style={{ display: "grid", gap: 14 }}>
        {loading ? (
          <p style={emptyStyle}>Loading abuse reports...</p>
        ) : reports.length === 0 ? (
          <div style={emptyStyle}><Flag size={30} color={C.textMuted} /><p style={{ margin: "12px 0 0" }}>No open abuse reports.</p></div>
        ) : reports.map((item) => {
          const reporter = item.reporter?.name ?? item.reporter_name ?? "Unknown reporter";
          const reported = item.reported_entity_name ?? item.reported_user?.name ?? `${item.entity_type ?? "Entity"} #${item.entity_id ?? "-"}`;
          const risk = item.risk_level ?? "Not classified";
          return (
            <article key={item.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20, boxShadow: "0 2px 12px rgba(47,52,60,.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", paddingBottom: 15, borderBottom: `1px solid ${C.divider}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: C.errorBg, color: C.error, display: "grid", placeItems: "center" }}><ShieldAlert size={18} /></div>
                  <div><div style={{ fontSize: 13, fontWeight: 750 }}>Report #{item.id}</div><div style={{ display: "flex", alignItems: "center", gap: 5, color: C.textMuted, fontSize: 11, marginTop: 3 }}><CalendarDays size={12} />{formatDate(item.created_at)}</div></div>
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  <Badge text={item.status ?? "Pending"} color={C.warning} background={C.warningBg} />
                  <Badge text={`${risk} risk`} color={risk === "High" ? C.error : C.info} background={risk === "High" ? C.errorBg : C.infoBg} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 34px minmax(0,1fr)", alignItems: "center", gap: 12, margin: "18px 0" }}>
                <Person label="Reporter" name={reporter} color={C.info} background={C.infoBg} />
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.bg, display: "grid", placeItems: "center", color: C.textMuted }}><ArrowRight size={15} /></div>
                <Person label="Reported user" name={reported} color={C.error} background={C.errorBg} />
              </div>

              <div style={{ padding: "13px 15px", borderRadius: 12, background: C.bg, borderLeft: `3px solid ${C.warning}` }}>
                <div style={{ color: C.textMuted, fontSize: 10, fontWeight: 750, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Report reason</div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>{item.reason ?? "No reason provided"}</div>
                {item.description && item.description !== item.reason && <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: C.textSec }}>{item.description}</div>}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 16 }}>
                <Btn size="sm" v="outline" onClick={() => handleAction(item.id, "dismiss")} disabled={updatingId === item.id}>{updatingId === item.id ? "Updating..." : "Dismiss"}</Btn>
                <Btn size="sm" v="secondary" onClick={() => handleAction(item.id, "resolve")} disabled={updatingId === item.id}>{updatingId === item.id ? "Updating..." : "Resolve Report"}</Btn>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

const emptyStyle = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 42, margin: 0, color: C.textSec, textAlign: "center" as const };

function Badge({ text, color, background }: { text: string; color: string; background: string }) {
  return <span style={{ padding: "5px 10px", borderRadius: 99, background, color, fontSize: 10, fontWeight: 750 }}>{text}</span>;
}

function Person({ label, name, color, background }: { label: string; name: string; color: string; background: string }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}><div style={{ width: 38, height: 38, borderRadius: "50%", background, color, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{name.trim().charAt(0).toUpperCase() || "?"}</div><div style={{ minWidth: 0 }}><div style={{ color: C.textMuted, fontSize: 10, marginBottom: 3 }}>{label}</div><div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div></div></div>;
}
