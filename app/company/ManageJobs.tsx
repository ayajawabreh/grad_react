import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { C, F } from "../../constants/tokens";
import { API, deleteJob } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

const supportedStatuses = ["Draft", "Pending Review", "Open", "Changes Requested", "Rejected", "Suspended", "Closed"] as const;
type Filter = "All" | (typeof supportedStatuses)[number];
const jobStatus = (job: any) => String(job.status ?? "Draft");
const applicantCount = (job: any) => Number(
  job.applicants_count ??
  job.applications_count ??
  job.stats?.applicants ??
  (typeof job.applicants === "number" || typeof job.applicants === "string"
    ? job.applicants
    : job.applicants?.length) ??
  0
);
const statusColors: Record<string, { text: string; background: string }> = {
  Open: { text: "#15803D", background: "#DCFCE7" },
  "Pending Review": { text: "#B7791F", background: "#FEF3C7" },
  Draft: { text: "#475569", background: "#F1F5F9" },
  "Changes Requested": { text: "#C2410C", background: "#FFEDD5" },
  Rejected: { text: "#DC2626", background: "#FEE2E2" },
  Suspended: { text: "#DC2626", background: "#FEE2E2" },
  Closed: { text: "#475569", background: "#E2E8F0" },
};
function postedLabel(value?: string) { if (!value) return "Recently posted"; const date = new Date(value); if (Number.isNaN(date.getTime())) return "Recently posted"; const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000)); if (days === 0) return "Posted today"; if (days === 1) return "Posted yesterday"; if (days < 7) return `Posted ${days} days ago`; const weeks = Math.floor(days / 7); return `Posted ${weeks} ${weeks === 1 ? "week" : "weeks"} ago`; }

export default function ManageJobs() {
  const { notice, noticeStatus, noticeDetails, refreshKey } = useLocalSearchParams<{ notice?: string; noticeStatus?: string; noticeDetails?: string; refreshKey?: string }>();
  const [jobs, setJobs] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [search, setSearch] = useState(""); const [filter, setFilter] = useState<Filter>("All");
  const [visibleNotice, setVisibleNotice] = useState("");
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const load = useCallback(async (refresh = false) => { if (refresh) setRefreshing(true); else setLoading(true); try { const response = await API.get("/company/jobs", { params: { _: Date.now() } }); setJobs(Array.isArray(response.data) ? response.data : []); } catch (error: any) { Alert.alert("Unable to load jobs", error?.response?.data?.message ?? "Please try again."); } finally { setLoading(false); setRefreshing(false); } }, []);
  useSyncRefresh(["jobs", "applications"], () => load(true));
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => { if (!notice) return; setVisibleNotice(String(notice)); const timer = setTimeout(() => setVisibleNotice(""), noticeStatus === "Open" ? 4500 : 8000); return () => clearTimeout(timer); }, [notice, noticeStatus, refreshKey]);
  const visibleJobs = useMemo(() => { const query = search.trim().toLowerCase(); return jobs.filter((job) => { const status = jobStatus(job); const supported = supportedStatuses.includes(status as any); const matchesFilter = filter === "All" || status === filter; const matchesSearch = !query || [job.title, job.location, job.department].some((value) => String(value ?? "").toLowerCase().includes(query)); return supported && matchesFilter && matchesSearch; }); }, [filter, jobs, search]);
  const published = jobs.filter((job) => jobStatus(job) === "Open").length; const applicants = jobs.reduce((sum, job) => sum + applicantCount(job), 0);
  const remove = (job: any) => {
    if (applicantCount(job) > 0) {
      setDeleteBlocked(true);
      return;
    }

    Alert.alert("Delete job", `Delete ${job.title || "this job"}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const previous = jobs;
          setJobs((current) => current.filter((item) => String(item.id) !== String(job.id)));
          try {
            await deleteJob(job.id);
          } catch (error: any) {
            setJobs(previous);
            if (error?.response?.status === 422) {
              setDeleteBlocked(true);
              void load(true);
              return;
            }
            Alert.alert("Could not delete job", error?.response?.data?.message ?? "Please try again.");
          }
        },
      },
    ]);
  };
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={C.accent} /><Text style={styles.loadingText}>Loading jobs...</Text></View>;
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={C.accent} />}>
      {visibleNotice ? (
        <View style={[styles.notice, noticeStatus === "Open" ? styles.noticeSuccess : styles.noticePending]}>
          <Ionicons name={noticeStatus === "Open" ? "checkmark-circle-outline" : "information-circle-outline"} size={20} color={noticeStatus === "Open" ? "#15803D" : "#B45309"} />
          <View style={styles.noticeCopy}>
            <Text style={[styles.noticeTitle, { color: noticeStatus === "Open" ? "#15803D" : "#B45309" }]}>{noticeStatus === "Open" ? "Job published successfully" : "Job submitted for admin review"}</Text>
            <Text style={[styles.noticeText, { color: noticeStatus === "Open" ? "#166534" : "#92400E" }]}>{visibleNotice}</Text>
            {noticeDetails ? <Text style={[styles.noticeDetails, { color: noticeStatus === "Open" ? "#166534" : "#92400E" }]}>{noticeDetails}</Text> : null}
          </View>
        </View>
      ) : null}
      <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.heading}>Manage Jobs</Text><Text style={styles.subtitle}>View and manage your job listings</Text></View><Pressable style={styles.create} onPress={() => router.push("/company/CreateJob")}><Ionicons name="add" size={18} color="#FFFFFF" /><Text style={styles.createText}>Post New Job</Text></Pressable></View>
      <View style={styles.statsRow}><Stat value={jobs.length} label="Total" /><Stat value={published} label="Open" /><Stat value={applicants} label="Applicants" /></View>
      <View style={styles.searchBox}><Ionicons name="search-outline" size={19} color={C.textMuted} /><TextInput value={search} onChangeText={setSearch} placeholder="Search jobs..." placeholderTextColor={C.textMuted} style={styles.searchInput} />{!!search && <Pressable onPress={() => setSearch("")}><Ionicons name="close-circle" size={19} color={C.textMuted} /></Pressable>}</View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{(["All", ...supportedStatuses] as Filter[]).map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</ScrollView>
      {visibleJobs.length === 0 ? <View style={styles.empty}><Ionicons name="briefcase-outline" size={38} color={C.textMuted} /><Text style={styles.emptyTitle}>No jobs found</Text><Text style={styles.subtitle}>Try another search or create a new job.</Text></View> : visibleJobs.map((job) => (
        <View style={styles.card} key={job.id}>
          <View style={styles.cardTop}><View style={styles.jobIcon}><Text style={styles.jobIconText}>{String(job.title ?? "J").charAt(0).toUpperCase()}</Text></View><View style={styles.jobCopy}><Text style={styles.title} numberOfLines={2}>{job.title || "Untitled job"}</Text><Text style={styles.meta} numberOfLines={1}>{[job.department, job.employment_type ?? job.job_type].filter(Boolean).join(" · ") || job.location || "Job listing"}</Text></View><View style={[styles.statusBadge, { backgroundColor: (statusColors[jobStatus(job)] ?? statusColors.Draft).background }]}><Text style={[styles.statusText, { color: (statusColors[jobStatus(job)] ?? statusColors.Draft).text }]}>{jobStatus(job)}</Text></View></View>
          <View style={styles.detailsRow}><Text style={styles.detailText}>{applicantCount(job)} applicants</Text><Text style={styles.detailText}>{Number(job.views ?? job.views_count ?? 0)} views</Text><Text style={styles.detailText}>{postedLabel(job.created_at ?? job.published_at)}</Text></View>
          <View style={styles.actions}><Pressable style={styles.viewButton} onPress={() => router.push({ pathname: "/company/JobDetails", params: { id: String(job.id) } })}><Text style={styles.viewText}>View</Text></Pressable><Pressable style={styles.outlineButton} onPress={() => router.push({ pathname: "/company/EditJob", params: { id: String(job.id) } })}><Ionicons name="create-outline" size={16} color={C.text} /><Text style={styles.outlineText}>Edit</Text></Pressable><Pressable style={styles.deleteButton} onPress={() => remove(job)}><Ionicons name="trash-outline" size={16} color={C.error} /><Text style={styles.deleteText}>Delete</Text></Pressable></View>
        </View>
      ))}
      <Modal visible={deleteBlocked} transparent animationType="fade" onRequestClose={() => setDeleteBlocked(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.blockedModal}>
            <View style={styles.modalTopRow}>
              <View style={styles.warningIcon}><Ionicons name="warning-outline" size={28} color="#EF4444" /></View>
              <Pressable accessibilityLabel="Close warning" hitSlop={12} onPress={() => setDeleteBlocked(false)}><Ionicons name="close" size={22} color="#9CA3AF" /></Pressable>
            </View>
            <Text style={styles.modalTitle}>Delete Job Listing?</Text>
            <Text style={styles.modalDescription}>Jobs with applicants cannot be deleted. You can close the job instead.</Text>
            <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={19} color="#DC2626" /><Text style={styles.errorBoxText}>Cannot delete a job that has applicants.</Text></View>
            <View style={styles.modalActions}><Pressable style={styles.cancelButton} onPress={() => setDeleteBlocked(false)}><Text style={styles.cancelButtonText}>Cancel</Text></Pressable></View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
function Stat({ value, label }: { value: number; label: string }) { return <View style={styles.statCard}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg }, content: { padding: 18, paddingBottom: 40 }, center: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", gap: 10 }, loadingText: { color: C.textSec, fontFamily: F }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }, headerCopy: { flex: 1 }, heading: { fontSize: 25, fontWeight: "900", color: C.text, fontFamily: F }, subtitle: { color: C.textSec, fontSize: 12, marginTop: 4, fontFamily: F }, create: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.accent, paddingHorizontal: 12, minHeight: 42, borderRadius: 11 }, createText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", fontFamily: F }, statsRow: { flexDirection: "row", gap: 9, marginBottom: 16 }, statCard: { flex: 1, minHeight: 72, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14 }, statValue: { color: C.text, fontSize: 21, fontWeight: "900", fontFamily: F }, statLabel: { color: C.textSec, fontSize: 11, fontFamily: F }, searchBox: { height: 47, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 13 }, searchInput: { flex: 1, color: C.text, fontSize: 13, fontFamily: F }, filters: { gap: 8, paddingVertical: 12 }, filter: { minHeight: 39, justifyContent: "center", paddingHorizontal: 17, borderRadius: 11, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }, filterActive: { backgroundColor: C.accentLight, borderColor: C.accent }, filterText: { color: C.textSec, fontSize: 12, fontWeight: "700", fontFamily: F }, filterTextActive: { color: C.accentHover },
  notice: { marginBottom: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderRadius: 14, flexDirection: "row", alignItems: "flex-start", gap: 10 }, noticeSuccess: { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" }, noticePending: { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }, noticeCopy: { flex: 1, gap: 3 }, noticeTitle: { fontFamily: F, fontSize: 14, fontWeight: "800" }, noticeText: { fontFamily: F, fontSize: 12, lineHeight: 18, fontWeight: "600" }, noticeDetails: { fontFamily: F, fontSize: 11, lineHeight: 17 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 17, padding: 15, marginBottom: 12 }, cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 11 }, jobIcon: { width: 45, height: 45, borderRadius: 12, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" }, jobIconText: { color: C.accentHover, fontSize: 18, fontWeight: "900", fontFamily: F }, jobCopy: { flex: 1 }, title: { color: C.text, fontSize: 15, fontWeight: "800", fontFamily: F }, meta: { color: C.textSec, fontSize: 11, marginTop: 4, fontFamily: F }, statusBadge: { backgroundColor: C.successBg, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 }, statusText: { color: C.success, fontSize: 10, fontWeight: "800", fontFamily: F }, detailsRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 14 }, detailText: { color: C.textSec, fontSize: 11, fontFamily: F }, actions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 15 }, viewButton: { minHeight: 39, justifyContent: "center", paddingHorizontal: 16, borderRadius: 10, backgroundColor: C.accent }, viewText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", fontFamily: F }, outlineButton: { minHeight: 39, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1, borderColor: C.border }, outlineText: { color: C.text, fontSize: 12, fontWeight: "700", fontFamily: F }, deleteButton: { minHeight: 39, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8 }, deleteText: { color: C.error, fontSize: 12, fontWeight: "700", fontFamily: F }, empty: { alignItems: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 17, padding: 30, marginTop: 4 }, emptyTitle: { color: C.text, fontSize: 16, fontWeight: "800", marginTop: 10, fontFamily: F },
  modalOverlay: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "rgba(15, 23, 42, 0.45)" }, blockedModal: { width: "100%", maxWidth: 470, alignSelf: "center", backgroundColor: "#FFFFFF", borderRadius: 22, padding: 26 }, modalTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, warningIcon: { width: 54, height: 54, borderRadius: 14, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" }, modalTitle: { marginTop: 20, color: "#1F2937", fontSize: 20, fontWeight: "800", fontFamily: F }, modalDescription: { marginTop: 12, color: "#6B7280", fontSize: 14, lineHeight: 22, fontFamily: F }, errorBox: { marginTop: 20, minHeight: 54, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#FCA5A5", borderRadius: 12, backgroundColor: "#FEF2F2" }, errorBoxText: { flex: 1, color: "#B91C1C", fontSize: 13, fontFamily: F }, modalActions: { marginTop: 20, flexDirection: "row", justifyContent: "flex-end" }, cancelButton: { minHeight: 46, justifyContent: "center", paddingHorizontal: 22, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 11, backgroundColor: "#FFFFFF" }, cancelButtonText: { color: "#1F2937", fontSize: 14, fontWeight: "800", fontFamily: F },
});
