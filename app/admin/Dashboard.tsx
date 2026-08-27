import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { C, F } from "../../constants/tokens";
import { getAdminDashboard } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

type IconName = keyof typeof Ionicons.glyphMap;
const unwrap = (value: any) => value?.data?.data ?? value?.data ?? value ?? {};
function num(source: any, ...keys: string[]) { for (const key of keys) if (source?.[key] != null && source[key] !== "") return Number(source[key]) || 0; return 0; }

export default function AdminDashboard() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const load = useCallback(async (refresh = false) => { if (refresh) setRefreshing(true); else setLoading(true); setError(false); try { setData(unwrap(await getAdminDashboard())); } catch { setError(true); } finally { setLoading(false); setRefreshing(false); } }, []);
  useSyncRefresh(["admin", "applications"], () => load(true));
  useEffect(() => { void load(); }, [load]);

  const stats = data.statistics ?? data.stats ?? data.overview ?? data;
  const review = data.needs_review ?? data.needsReview ?? {};
  const activity = useMemo(() => { const raw = data.platform_activity ?? data.activity ?? data.chart ?? []; return (Array.isArray(raw) ? raw : []).map((item: any, index: number) => ({ label: String(item.month ?? item.label ?? item.name ?? `P${index + 1}`), value: num(item, "value", "count", "total") })); }, [data]);
  const chart = activity.length ? activity : ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((label) => ({ label, value: 0 }));
  const max = Math.max(...chart.map((item) => item.value), 1);
  const cards = [
    ["Students", num(stats, "total_students", "students", "totalStudents"), "people-outline", C.info, C.infoBg],
    ["Companies", num(stats, "total_companies", "companies", "totalCompanies"), "business-outline", C.accentHover, C.accentLight],
    ["Live Jobs", num(stats, "active_jobs", "live_jobs", "total_jobs", "jobs"), "briefcase-outline", C.accent, C.accentLight],
    ["Hires", num(stats, "total_hires", "hires", "accepted"), "trophy-outline", C.success, C.successBg],
  ] as const;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={C.accent} /><Text style={styles.loading}>Loading platform overview...</Text></View>;
  if (error && !Object.keys(data).length) return <View style={styles.center}><Ionicons name="cloud-offline-outline" size={38} color={C.error} /><Text style={styles.errorTitle}>Could not load dashboard</Text><Pressable style={styles.retry} onPress={() => void load()}><Text style={styles.retryText}>Try Again</Text></Pressable></View>;

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={C.accent} />}>
    <View style={styles.header}><View style={{ flex: 1 }}><Text style={styles.title}>Platform Overview</Text><Text style={styles.subtitle}>CareerBridge admin dashboard — real-time platform insights</Text></View><View style={styles.headerIcon}><Ionicons name="analytics-outline" size={23} color={C.accentHover} /></View></View>
    <View style={styles.statsGrid}>{cards.map(([label, value, icon, color, bg]) => <View key={label} style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: bg }]}><Ionicons name={icon} size={20} color={color} /></View><Text style={styles.statValue}>{value.toLocaleString()}</Text><Text style={styles.statLabel}>{label}</Text></View>)}</View>
    <View style={styles.section}><View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Platform Activity</Text><Text style={styles.sectionSub}>Activity across recent periods</Text></View><Ionicons name="trending-up-outline" size={20} color={C.accent} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>{chart.map((item, index) => <View key={`${item.label}-${index}`} style={styles.column}><Text style={styles.chartValue}>{item.value}</Text><View style={styles.track}><View style={[styles.bar, { height: item.value ? Math.max(18, item.value / max * 125) : 5 }]} /></View><Text style={styles.chartLabel}>{item.label}</Text></View>)}</ScrollView></View>
    <View style={styles.section}><Text style={styles.sectionTitle}>Quick Actions</Text><View style={styles.actions}><Action label="Review Companies" icon="business-outline" color={C.info} bg={C.infoBg} path="/admin/Companies" /><Action label="Moderate Jobs" icon="briefcase-outline" color={C.warning} bg={C.warningBg} path="/admin/Jobs" /><Action label="Analytics" icon="analytics-outline" color={C.accent} bg={C.accentLight} path="/admin/Analytics" /><Action label="Reports" icon="warning-outline" color={C.success} bg={C.successBg} path="/admin/Reports" /></View></View>
    <View style={styles.reviews}><Review label="Companies Need Review" value={num(review, "companies", "pending_companies")} icon="clipboard-outline" color={C.warning} bg={C.warningBg} path="/admin/Companies" /><Review label="Jobs Need Review" value={num(review, "jobs", "pending_jobs")} icon="briefcase-outline" color={C.info} bg={C.infoBg} path="/admin/Jobs" /><Review label="Reports" value={num(review, "reports", "abuse_reports", "pending_reports")} icon="shield-outline" color={C.error} bg={C.errorBg} path="/admin/Reports" /></View>
  </ScrollView>;
}

function Action({ label, icon, color, bg, path }: { label: string; icon: IconName; color: string; bg: string; path: any }) { return <Pressable onPress={() => router.push(path)} style={[styles.action, { backgroundColor: bg }]}><View style={styles.actionIcon}><Ionicons name={icon} size={18} color={color} /></View><Text style={[styles.actionText, { color }]}>{label}</Text><Ionicons name="chevron-forward" size={15} color={color} /></Pressable>; }
function Review({ label, value, icon, color, bg, path }: { label: string; value: number; icon: IconName; color: string; bg: string; path: any }) { return <Pressable onPress={() => router.push(path)} style={styles.review}><View style={[styles.reviewIcon, { backgroundColor: bg }]}><Ionicons name={icon} size={19} color={color} /></View><View style={{ flex: 1 }}><Text style={styles.reviewValue}>{value}</Text><Text style={styles.reviewLabel}>{label}</Text></View><Ionicons name="chevron-forward" size={17} color={C.textMuted} /></Pressable>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg }, content: { padding: 16, paddingBottom: 40 }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: C.bg }, loading: { color: C.textSec, fontSize: 12, fontFamily: F }, errorTitle: { color: C.text, fontSize: 16, fontWeight: "800", fontFamily: F }, retry: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, backgroundColor: C.accent }, retryText: { color: "#fff", fontSize: 11, fontWeight: "800", fontFamily: F },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }, title: { color: C.text, fontSize: 24, fontWeight: "900", fontFamily: F }, subtitle: { color: C.textSec, fontSize: 11, lineHeight: 16, marginTop: 5, fontFamily: F }, headerIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: C.accentLight },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 }, statCard: { width: "48.5%", minHeight: 124, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }, statIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" }, statValue: { color: C.text, fontSize: 23, fontWeight: "900", marginTop: 12, fontFamily: F }, statLabel: { color: C.textSec, fontSize: 11, marginTop: 3, fontFamily: F },
  section: { padding: 15, marginBottom: 16, borderRadius: 17, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }, sectionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 }, sectionTitle: { color: C.text, fontSize: 14, fontWeight: "800", fontFamily: F }, sectionSub: { color: C.textSec, fontSize: 10, marginTop: 4, fontFamily: F },
  chart: { minWidth: "100%", height: 190, alignItems: "flex-end", gap: 8, paddingTop: 8 }, column: { width: 44, height: "100%", alignItems: "center", justifyContent: "flex-end" }, chartValue: { color: C.accent, fontSize: 9, fontWeight: "700", marginBottom: 5, fontFamily: F }, track: { width: 26, flex: 1, justifyContent: "flex-end", backgroundColor: C.accentLight, borderTopLeftRadius: 8, borderTopRightRadius: 8, overflow: "hidden" }, bar: { width: "100%", backgroundColor: C.accent, borderTopLeftRadius: 8, borderTopRightRadius: 8 }, chartLabel: { color: C.textSec, fontSize: 9, marginTop: 7, fontFamily: F },
  actions: { gap: 9, marginTop: 14 }, action: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: C.border }, actionIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: C.surface }, actionText: { flex: 1, fontSize: 11, fontWeight: "800", fontFamily: F },
  reviews: { gap: 10 }, review: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: 11, padding: 13, borderRadius: 15, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }, reviewIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" }, reviewValue: { color: C.text, fontSize: 18, fontWeight: "900", fontFamily: F }, reviewLabel: { color: C.textSec, fontSize: 10, marginTop: 3, fontFamily: F },
});
