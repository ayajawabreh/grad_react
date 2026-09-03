import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, G, LinearGradient, Line, Path, Stop, Text as SvgText } from "react-native-svg";
import { C, F } from "../../constants/tokens";
import { getAdminAnalytics, getAdminDashboard } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

type IconName = keyof typeof Ionicons.glyphMap;
const unwrap = (value: any) => value?.data?.data ?? value?.data ?? value ?? {};
function num(source: any, ...keys: string[]) { for (const key of keys) if (source?.[key] != null && source[key] !== "") return Number(source[key]) || 0; return 0; }

type ActivityPoint = {
  label: string;
  value: number;
};

function monthLabel(month: string) {
  const date = new Date(`${month}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? month : date.toLocaleString("en", { month: "short" });
}

export default function AdminDashboard() {
  const [data, setData] = useState<any>({});
  const [platformActivity, setPlatformActivity] = useState<ActivityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (refresh = false) => { if (refresh) setRefreshing(true); else setLoading(true); setError(null); try { const [dashboardResponse, analyticsResponse] = await Promise.all([getAdminDashboard(), getAdminAnalytics("year")]); setData(unwrap(dashboardResponse)); const analytics = unwrap(analyticsResponse); const monthly = Array.isArray(analytics?.trends?.monthly) ? analytics.trends.monthly : []; setPlatformActivity(monthly.slice(-6).map((item: any) => ({ label: monthLabel(String(item.month ?? "")), value: num(item, "students") + num(item, "companies") + num(item, "jobs") + num(item, "applications") + num(item, "interviews") }))); } catch (requestError: any) { const status = requestError?.response?.status; setError(requestError?.response?.data?.message ?? (status === 403 ? "Admin access required." : "Failed to load admin dashboard.")); } finally { setLoading(false); setRefreshing(false); } }, []);
  useSyncRefresh(["admin", "applications"], () => load(true));
  useEffect(() => { void load(); }, [load]);

  const stats = data.statistics ?? data.stats ?? data.overview ?? data;
  const review = data.needs_review ?? data.needsReview ?? {};
  const cards = [
    ["Students", num(stats, "total_students", "students", "totalStudents"), "people-outline", C.info, C.infoBg],
    ["Companies", num(stats, "total_companies", "companies", "totalCompanies"), "business-outline", C.accentHover, C.accentLight],
    ["Live Jobs", num(stats, "active_jobs", "live_jobs", "total_jobs", "jobs"), "briefcase-outline", C.accent, C.accentLight],
    ["Hires", num(stats, "total_hires", "hires", "accepted"), "trophy-outline", C.success, C.successBg],
  ] as const;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={C.accent} /><Text style={styles.loading}>Loading platform overview...</Text></View>;
  if (error && !Object.keys(data).length) return <View style={styles.center}><Ionicons name="cloud-offline-outline" size={38} color={C.error} /><Text style={styles.errorTitle}>{error}</Text><Pressable style={styles.retry} onPress={() => void load()}><Text style={styles.retryText}>Try Again</Text></Pressable></View>;

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={C.accent} />}>
    <View style={styles.header}><View style={{ flex: 1 }}><Text style={styles.title}>Platform Overview</Text><Text style={styles.subtitle}>CareerBridge admin dashboard — real-time platform insights</Text></View><View style={styles.headerIcon}><Ionicons name="analytics-outline" size={23} color={C.accentHover} /></View></View>
    {error ? <View style={styles.errorBanner}><Ionicons name="alert-circle-outline" size={17} color={C.error} /><Text style={styles.errorBannerText}>{error}</Text></View> : null}
    <View style={styles.statsGrid}>{cards.map(([label, value, icon, color, bg]) => <View key={label} style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: bg }]}><Ionicons name={icon} size={20} color={color} /></View><Text style={styles.statValue}>{value.toLocaleString()}</Text><Text style={styles.statLabel}>{label}</Text></View>)}</View>
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Platform Activity</Text>
      <AreaActivityChart data={platformActivity} />
    </View>
    <View style={styles.section}><Text style={styles.sectionTitle}>Quick Actions</Text><View style={styles.actions}><Action label="Review Companies" icon="business-outline" color={C.info} bg={C.infoBg} path="/admin/Companies" /><Action label="Moderate Jobs" icon="briefcase-outline" color={C.warning} bg={C.warningBg} path="/admin/Jobs" /><Action label="Analytics" icon="analytics-outline" color={C.accent} bg={C.accentLight} path="/admin/Analytics" /><Action label="Reports" icon="warning-outline" color={C.success} bg={C.successBg} path="/admin/Reports" /></View></View>
    <View style={styles.reviews}><Review label="Companies Need Review" value={num(review, "companies", "pending_companies")} icon="clipboard-outline" color={C.warning} bg={C.warningBg} path="/admin/Companies" /><Review label="Jobs Need Review" value={num(review, "jobs", "pending_jobs")} icon="briefcase-outline" color={C.info} bg={C.infoBg} path="/admin/Jobs" /><Review label="Reports" value={num(review, "reports", "abuse_reports", "pending_reports")} icon="shield-outline" color={C.error} bg={C.errorBg} path="/admin/Reports" /></View>
  </ScrollView>;
}

function Action({ label, icon, color, bg, path }: { label: string; icon: IconName; color: string; bg: string; path: any }) { return <Pressable onPress={() => router.push(path)} style={[styles.action, { backgroundColor: bg }]}><View style={styles.actionIcon}><Ionicons name={icon} size={18} color={color} /></View><Text style={[styles.actionText, { color }]}>{label}</Text><Ionicons name="chevron-forward" size={15} color={color} /></Pressable>; }
function Review({ label, value, icon, color, bg, path }: { label: string; value: number; icon: IconName; color: string; bg: string; path: any }) { return <Pressable onPress={() => router.push(path)} style={styles.review}><View style={[styles.reviewIcon, { backgroundColor: bg }]}><Ionicons name={icon} size={19} color={color} /></View><View style={{ flex: 1 }}><Text style={styles.reviewValue}>{value}</Text><Text style={styles.reviewLabel}>{label}</Text></View><Ionicons name="chevron-forward" size={17} color={C.textMuted} /></Pressable>; }

function AreaActivityChart({ data }: { data: ActivityPoint[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const width = 540;
  const height = 240;
  const left = 42;
  const right = 18;
  const top = 12;
  const bottom = 34;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const highest = Math.max(...data.map((item) => item.value), 0);
  const yMax = Math.max(4, Math.ceil(highest / 4) * 4);
  const sectionValue = yMax / 4;
  const spacing = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth;
  const points = data.map((item, index) => ({
    ...item,
    x: left + (data.length > 1 ? index * spacing : plotWidth / 2),
    y: top + plotHeight - (item.value / yMax) * plotHeight,
  }));

  const linePath = points.length
    ? points.slice(1).reduce((path, point, index) => {
        const previous = points[index];
        const controlX = (previous.x + point.x) / 2;
        return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
      }, `M ${points[0].x} ${points[0].y}`)
    : "";
  const baseline = top + plotHeight;
  const areaPath = points.length ? `${linePath} L ${points.at(-1)!.x} ${baseline} L ${points[0].x} ${baseline} Z` : "";
  const selectedPoint = selected === null ? null : points[selected];

  if (!data.length) {
    return <View style={styles.chartEmpty}><Ionicons name="analytics-outline" size={28} color={C.textMuted} /><Text style={styles.chartEmptyText}>No analytics data yet.</Text></View>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
      <View style={{ width, height }}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#713CFF" stopOpacity={0.18} />
              <Stop offset="1" stopColor="#713CFF" stopOpacity={0.02} />
            </LinearGradient>
          </Defs>
          {Array.from({ length: 5 }, (_, index) => {
            const y = top + (plotHeight / 4) * index;
            const value = Math.round(yMax - sectionValue * index);
            return (
              <G key={`horizontal-${index}`}>
                <Line x1={left} y1={y} x2={width - right} y2={y} stroke="#E9E7EE" strokeWidth={1} strokeDasharray="4 5" />
                <SvgText x={left - 8} y={y + 3} fill="#9CA3AF" fontSize={9} textAnchor="end">{value}</SvgText>
              </G>
            );
          })}
          {points.map((point, index) => (
            <Line key={`vertical-${index}`} x1={point.x} y1={top} x2={point.x} y2={baseline} stroke="#E9E7EE" strokeWidth={1} strokeDasharray="4 5" />
          ))}
          <Line x1={left} y1={baseline} x2={width - right} y2={baseline} stroke="#9CA3AF" strokeWidth={1} />
          <Line x1={left} y1={top} x2={left} y2={baseline} stroke="#9CA3AF" strokeWidth={1} />
          <Path d={areaPath} fill="url(#activityFill)" />
          <Path d={linePath} fill="none" stroke="#713CFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point) => <SvgText key={`label-${point.label}`} x={point.x} y={height - 11} fill="#6B7280" fontSize={10} textAnchor="middle">{point.label}</SvgText>)}
        </Svg>
        {points.map((point, index) => (
          <Pressable key={`touch-${point.label}`} onPress={() => setSelected(index)} style={[styles.chartTouch, { left: Math.max(left, point.x - spacing / 2), width: Math.min(spacing, width - right - Math.max(left, point.x - spacing / 2)) }]} />
        ))}
        {selectedPoint ? (
          <View pointerEvents="none" style={[styles.tooltip, { left: Math.min(width - 112, Math.max(left, selectedPoint.x - 46)), top: Math.max(3, selectedPoint.y - 55) }]}>
            <Text style={styles.tooltipMonth}>{selectedPoint.label}</Text>
            <Text style={styles.tooltipValue}>{selectedPoint.value.toLocaleString()}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg }, content: { padding: 16, paddingBottom: 40 }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: C.bg }, loading: { color: C.textSec, fontSize: 12, fontFamily: F }, errorTitle: { color: C.text, fontSize: 16, fontWeight: "800", fontFamily: F }, retry: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, backgroundColor: C.accent }, retryText: { color: "#fff", fontSize: 11, fontWeight: "800", fontFamily: F },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }, title: { color: C.text, fontSize: 24, fontWeight: "900", fontFamily: F }, subtitle: { color: C.textSec, fontSize: 11, lineHeight: 16, marginTop: 5, fontFamily: F }, headerIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: C.accentLight },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 11, marginBottom: 14, borderRadius: 11, backgroundColor: C.errorBg }, errorBannerText: { flex: 1, color: C.error, fontSize: 11, lineHeight: 16, fontFamily: F },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 }, statCard: { width: "48.5%", minHeight: 124, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }, statIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" }, statValue: { color: C.text, fontSize: 23, fontWeight: "900", marginTop: 12, fontFamily: F }, statLabel: { color: C.textSec, fontSize: 11, marginTop: 3, fontFamily: F },
  section: { padding: 15, marginBottom: 16, borderRadius: 17, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }, sectionTitle: { color: C.text, fontSize: 14, fontWeight: "800", fontFamily: F },
  chartCard: { marginBottom: 16, paddingTop: 16, paddingBottom: 10, borderRadius: 20, borderWidth: 1, borderColor: "#E5E1DC", backgroundColor: "#FFFFFF", overflow: "hidden" }, chartTitle: { paddingHorizontal: 16, marginBottom: 8, color: "#111827", fontSize: 16, fontWeight: "700", fontFamily: F }, chartScroll: { paddingHorizontal: 4 }, chartEmpty: { height: 240, alignItems: "center", justifyContent: "center", gap: 9 }, chartEmptyText: { color: C.textMuted, fontSize: 11, fontFamily: F }, chartTouch: { position: "absolute", top: 0, height: 240 }, tooltip: { position: "absolute", minWidth: 92, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, backgroundColor: "#20123F", shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 }, tooltipMonth: { color: "#D9CBFF", fontSize: 9, fontWeight: "700", fontFamily: F }, tooltipValue: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", marginTop: 2, fontFamily: F },
  actions: { gap: 9, marginTop: 14 }, action: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: C.border }, actionIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: C.surface }, actionText: { flex: 1, fontSize: 11, fontWeight: "800", fontFamily: F },
  reviews: { gap: 10 }, review: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: 11, padding: 13, borderRadius: 15, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }, reviewIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" }, reviewValue: { color: C.text, fontSize: 18, fontWeight: "900", fontFamily: F }, reviewLabel: { color: C.textSec, fontSize: 10, marginTop: 3, fontFamily: F },
});
