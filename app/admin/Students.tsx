import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSyncRefresh } from "../../context/SyncContext";
import {
  AlertCircle,
  Award,
  Ban,
  CalendarDays,
  CheckCircle2,
  Download,
  Filter,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  School,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react-native";

import { C, F } from "../../constants/tokens";
import { API } from "../../imports/api";
import { downloadCsv } from "../../lib/download";

type Student = {
  id: number;
  user_id?: number;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  university?: string | null;
  major?: string | null;
  graduation_year?: number | null;
  phone?: string | null;
  profile_completion?: number | null;
  verification_status?: string | null;
  account_status?: string | null;
  verification_score?: number | null;
  recommendation?: string | null;
  email_verified?: boolean;
  joined?: string | null;
  created_at?: string | null;
};

type StudentDetails = Student & {
  gpa?: number | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
  bio?: string | null;
  headline?: string | null;
  location?: string | null;
};

type StudentAction = "approve" | "reject" | "suspend" | "restore" | "activate";

const FILTERS = ["", "Approved", "Pending", "Rejected", "Suspended"];

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadStudents = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError("");
      const params: Record<string, string> = {};
      if (query.trim()) params.search = query.trim();
      if (statusFilter) params.status = statusFilter;
      const response = await API.get("/admin/students", { params });
      const data = response.data?.students ?? response.data?.data ?? response.data ?? [];
      setStudents(Array.isArray(data) ? data : []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Could not load students.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query, statusFilter]);
  useSyncRefresh(["admin", "student"], () => loadStudents(false));

  useEffect(() => {
    const timer = setTimeout(() => loadStudents(), 300);
    return () => clearTimeout(timer);
  }, [loadStudents]);

  const visibleStudents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return students;
    return students.filter((student) =>
      [student.name, student.email, student.university, student.major]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [query, students]);

  const viewStudent = async (student: Student) => {
    setSelectedStudent(student);
    setDetailsLoading(true);
    try {
      const response = await API.get(`/admin/students/${student.id}`);
      setSelectedStudent(response.data?.student ?? response.data?.data ?? student);
    } catch (requestError: any) {
      Alert.alert("Error", requestError?.response?.data?.message ?? "Could not load student details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const runAction = async (student: Student, action: StudentAction) => {
    setUpdatingId(student.id);
    try {
      await API.patch(`/admin/students/${student.id}/${action}`);
      const nextStatus = action === "approve" ? "Approved" : action === "reject" ? "Rejected" : undefined;
      const nextAccount = action === "suspend" ? "Suspended" : action === "restore" || action === "activate" ? "Active" : undefined;
      setStudents((current) => current.map((item) => item.id === student.id ? { ...item, verification_status: nextStatus ?? item.verification_status, account_status: nextAccount ?? item.account_status } : item));
      setSelectedStudent((current) => current?.id === student.id ? { ...current, verification_status: nextStatus ?? current.verification_status, account_status: nextAccount ?? current.account_status } : current);
      Alert.alert("Success", `Student ${action} completed successfully.`);
      loadStudents(false);
    } catch (requestError: any) {
      Alert.alert("Error", requestError?.response?.data?.message ?? `Could not ${action} student.`);
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmAction = (student: Student, action: StudentAction) => {
    Alert.alert(
      `${action.charAt(0).toUpperCase()}${action.slice(1)} student?`,
      `This will ${action} ${student.name || "this student"}.`,
      [{ text: "Cancel", style: "cancel" }, { text: action.charAt(0).toUpperCase() + action.slice(1), style: action === "reject" || action === "suspend" ? "destructive" : "default", onPress: () => runAction(student, action) }]
    );
  };

  const exportStudents = async () => {
    if (!students.length) {
      Alert.alert("No data", "There are no students to export.");
      return;
    }
    await downloadCsv(
      students.map((student, index) => ({
        No: index + 1,
        Name: student.name ?? "Unknown Student",
        Email: student.email ?? "",
        University: student.university ?? "",
        Major: student.major ?? "",
        "Graduation Year": student.graduation_year ?? "",
        "Verification Status": student.verification_status ?? "Pending",
        "Account Status": student.account_status ?? "Active",
        "Verification Score": student.verification_score ?? "",
        "Email Verified": student.email_verified ? "Yes" : "No",
        Phone: student.phone ?? "",
        "Profile Completion": student.profile_completion == null ? "" : `${student.profile_completion}%`,
        Joined: student.joined ?? student.created_at ?? "",
      })),
      "CareerBridge_Students_Report.csv"
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Student Management</Text>
        <Text style={styles.subtitle}>Manage registered students on the platform</Text>
        <View style={styles.toolbar}>
          <Pressable style={styles.toolButton} onPress={() => setFilterVisible(true)}>
            <Filter size={17} color={C.text} />
            <Text style={styles.toolText}>{statusFilter || "Filter"}</Text>
          </Pressable>
          <Pressable style={styles.toolButton} onPress={exportStudents}>
            <Download size={17} color={C.text} />
            <Text style={styles.toolText}>Export Excel</Text>
          </Pressable>
        </View>
        <View style={styles.searchBox}>
          <Search size={18} color={C.textMuted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search students..." placeholderTextColor={C.textMuted} style={styles.searchInput} autoCapitalize="none" />
          {!!query && <Pressable onPress={() => setQuery("")}><X size={17} color={C.textMuted} /></Pressable>}
        </View>
      </View>

      {loading ? (
        <State icon={<ActivityIndicator size="large" color={C.accent} />} text="Loading students..." />
      ) : error ? (
        <State icon={<AlertCircle size={34} color={C.error} />} text={error} action="Try again" onPress={() => loadStudents()} />
      ) : (
        <FlatList
          data={visibleStudents}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStudents(false); }} tintColor={C.accent} />}
          ListEmptyComponent={<State icon={<UserRound size={36} color={C.textMuted} />} text="No students found." />}
          renderItem={({ item }) => (
            <StudentCard student={item} busy={updatingId === item.id} onView={() => viewStudent(item)} onAction={(action) => confirmAction(item, action)} />
          )}
        />
      )}

      <FilterModal visible={filterVisible} selected={statusFilter} onClose={() => setFilterVisible(false)} onSelect={(value) => { setStatusFilter(value); setFilterVisible(false); }} />
      <DetailsModal student={selectedStudent} loading={detailsLoading} busy={updatingId === selectedStudent?.id} onClose={() => setSelectedStudent(null)} onAction={(action) => selectedStudent && confirmAction(selectedStudent, action)} />
    </SafeAreaView>
  );
}

function StudentCard({ student, busy, onView, onAction }: { student: Student; busy: boolean; onView: () => void; onAction: (action: StudentAction) => void }) {
  const suspended = student.account_status?.toLowerCase() === "suspended";
  const verification = student.verification_status ?? "Pending";
  return (
    <Pressable style={styles.card} onPress={onView}>
      <View style={styles.cardHeader}>
        {student.avatar ? <Image source={{ uri: student.avatar }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarText}>{(student.name || "S").charAt(0).toUpperCase()}</Text></View>}
        <View style={styles.cardIdentity}>
          <Text style={styles.studentName}>{student.name || "Unknown Student"}</Text>
          <Text style={styles.studentEmail} numberOfLines={1}>{student.email || "No email"}</Text>
        </View>
        <StatusBadge value={suspended ? "Suspended" : verification} />
      </View>
      <InfoRow icon={<School size={14} color={C.textMuted} />} label={student.university || "University not provided"} />
      <InfoRow icon={<GraduationCap size={14} color={C.textMuted} />} label={[student.major, student.graduation_year].filter(Boolean).join(" · ") || "Academic information not provided"} />
      <InfoRow icon={<CalendarDays size={14} color={C.textMuted} />} label={`Joined ${student.joined || student.created_at || "-"}`} />
      <View style={styles.actions}>
        <ActionButton label="View" onPress={onView} />
        {busy ? <ActivityIndicator color={C.accent} /> : suspended ? <><ActionButton label="Restore" tone="success" onPress={() => onAction("restore")} /><ActionButton label="Activate" onPress={() => onAction("activate")} /></> : verification === "Pending" ? <><ActionButton label="Approve" tone="success" onPress={() => onAction("approve")} /><ActionButton label="Reject" tone="danger" onPress={() => onAction("reject")} /></> : <ActionButton label="Suspend" tone="danger" onPress={() => onAction("suspend")} />}
      </View>
    </Pressable>
  );
}

function DetailsModal({ student, loading, busy, onClose, onAction }: { student: StudentDetails | null; loading: boolean; busy: boolean; onClose: () => void; onAction: (action: StudentAction) => void }) {
  if (!student) return null;
  const open = (url?: string | null) => url && Linking.openURL(url.startsWith("http") ? url : `https://${url}`);
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.detailsSheet}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}><Text style={styles.modalTitle}>{student.name || "Student Details"}</Text><Text style={styles.studentEmail}>{student.email}</Text></View>
            <Pressable style={styles.closeButton} onPress={onClose}><X size={20} color={C.text} /></Pressable>
          </View>
          {loading ? <State icon={<ActivityIndicator color={C.accent} />} text="Loading details..." /> : (
            <ScrollView contentContainerStyle={styles.detailsContent} showsVerticalScrollIndicator={false}>
              <SectionTitle icon={<ShieldCheck size={16} color={C.accentHover} />} title="Account & Verification" />
              <View style={styles.detailGrid}>
                <Detail label="Verification" value={student.verification_status || "Pending"} />
                <Detail label="Account" value={student.account_status || "Active"} />
                <Detail label="Score" value={student.verification_score} />
                <Detail label="Email" value={student.email_verified ? "Verified" : "Not verified"} />
              </View>
              <SectionTitle icon={<GraduationCap size={16} color={C.accentHover} />} title="Academic Information" />
              <View style={styles.detailGrid}>
                <Detail label="University" value={student.university} />
                <Detail label="Major" value={student.major} />
                <Detail label="Graduation Year" value={student.graduation_year} />
                <Detail label="GPA" value={student.gpa} />
              </View>
              <SectionTitle icon={<UserRound size={16} color={C.accentHover} />} title="Contact Information" />
              <DetailLine icon={<Mail size={15} color={C.textMuted} />} value={student.email} />
              <DetailLine icon={<Phone size={15} color={C.textMuted} />} value={student.phone} />
              <DetailLine icon={<MapPin size={15} color={C.textMuted} />} value={student.location} />
              <SectionTitle icon={<Globe size={16} color={C.accentHover} />} title="Professional Links" />
              <View style={styles.linkRow}>
                {!!student.linkedin && <ActionButton label="LinkedIn" onPress={() => open(student.linkedin)} />}
                {!!student.github && <ActionButton label="GitHub" onPress={() => open(student.github)} />}
                {!!student.portfolio && <ActionButton label="Portfolio" onPress={() => open(student.portfolio)} />}
                {!student.linkedin && !student.github && !student.portfolio && <Text style={styles.mutedText}>No professional links.</Text>}
              </View>
              <SectionTitle icon={<Award size={16} color={C.accentHover} />} title="About Student" />
              <Detail label="Headline" value={student.headline} full />
              <Detail label="Bio" value={student.bio} full />
              <Detail label="Recommendation" value={student.recommendation} full />
              <View style={styles.modalActions}>
                {busy ? <ActivityIndicator color={C.accent} /> : student.account_status?.toLowerCase() === "suspended" ? <><ActionButton label="Restore" tone="success" onPress={() => onAction("restore")} /><ActionButton label="Activate" onPress={() => onAction("activate")} /></> : <ActionButton label="Suspend" tone="danger" onPress={() => onAction("suspend")} />}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function FilterModal({ visible, selected, onClose, onSelect }: { visible: boolean; selected: string; onClose: () => void; onSelect: (value: string) => void }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable style={styles.modalBackdrop} onPress={onClose}><View style={styles.filterSheet}><Text style={styles.modalTitle}>Filter by status</Text>{FILTERS.map((value) => <Pressable key={value || "all"} style={[styles.filterOption, selected === value && styles.filterSelected]} onPress={() => onSelect(value)}><Text style={[styles.filterText, selected === value && styles.filterSelectedText]}>{value || "All Students"}</Text>{selected === value && <CheckCircle2 size={18} color={C.accentHover} />}</Pressable>)}</View></Pressable></Modal>;
}

function StatusBadge({ value }: { value: string }) {
  const lower = value.toLowerCase();
  const danger = lower === "rejected" || lower === "suspended";
  const success = lower === "approved" || lower === "active";
  return <View style={[styles.badge, { backgroundColor: danger ? C.errorBg : success ? C.successBg : C.warningBg }]}>{danger ? <Ban size={11} color={C.error} /> : success ? <CheckCircle2 size={11} color={C.success} /> : <AlertCircle size={11} color={C.warning} />}<Text style={{ color: danger ? C.error : success ? C.success : C.warning, fontSize: 10, fontWeight: "700" }}>{value}</Text></View>;
}

function ActionButton({ label, tone = "normal", onPress }: { label: string; tone?: "normal" | "success" | "danger"; onPress: () => void }) {
  return <Pressable onPress={(event) => { event.stopPropagation(); onPress(); }} style={[styles.actionButton, tone === "success" && styles.successButton, tone === "danger" && styles.dangerButton]}><Text style={[styles.actionText, tone === "success" && { color: C.success }, tone === "danger" && { color: C.error }]}>{label}</Text></Pressable>;
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) { return <View style={styles.infoRow}>{icon}<Text style={styles.infoText} numberOfLines={1}>{label}</Text></View>; }
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) { return <View style={styles.sectionTitle}>{icon}<Text style={styles.sectionTitleText}>{title}</Text></View>; }
function Detail({ label, value, full }: { label: string; value?: unknown; full?: boolean }) { return <View style={[styles.detail, full && { width: "100%" }]}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value == null || value === "" ? "—" : String(value)}</Text></View>; }
function DetailLine({ icon, value }: { icon: React.ReactNode; value?: unknown }) { return <View style={styles.detailLine}>{icon}<Text style={styles.detailValue}>{value == null || value === "" ? "—" : String(value)}</Text></View>; }
function State({ icon, text, action, onPress }: { icon: React.ReactNode; text: string; action?: string; onPress?: () => void }) { return <View style={styles.state}>{icon}<Text style={styles.stateText}>{text}</Text>{action && onPress && <ActionButton label={action} onPress={onPress} />}</View>; }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 17, paddingTop: 16, paddingBottom: 12 },
  title: { fontFamily: F, fontSize: 25, fontWeight: "800", color: C.text, marginTop: 7 },
  subtitle: { fontFamily: F, fontSize: 13, color: C.textSec, marginTop: 5 },
  toolbar: { flexDirection: "row", gap: 9, marginTop: 16 },
  toolButton: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 13, borderWidth: 1, borderColor: C.border, borderRadius: 11, backgroundColor: C.surface },
  toolText: { fontFamily: F, color: C.text, fontSize: 12, fontWeight: "700" },
  searchBox: { height: 48, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.surface, paddingHorizontal: 13, marginTop: 12 },
  searchInput: { flex: 1, fontFamily: F, color: C.text, fontSize: 14 },
  list: { paddingHorizontal: 17, paddingBottom: 40, gap: 11 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 17, padding: 15 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 13 },
  avatarFallback: { width: 44, height: 44, borderRadius: 13, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: F, color: C.accentHover, fontSize: 16, fontWeight: "800" },
  cardIdentity: { flex: 1, minWidth: 0 },
  studentName: { fontFamily: F, color: C.text, fontSize: 15, fontWeight: "800" },
  studentEmail: { fontFamily: F, color: C.textSec, fontSize: 11, marginTop: 3 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 4 },
  infoText: { flex: 1, fontFamily: F, color: C.textSec, fontSize: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 7, marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: C.divider },
  actionButton: { minHeight: 34, paddingHorizontal: 11, borderWidth: 1, borderColor: C.border, borderRadius: 9, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  successButton: { backgroundColor: C.successBg, borderColor: C.successBg },
  dangerButton: { backgroundColor: C.errorBg, borderColor: C.errorBg },
  actionText: { fontFamily: F, color: C.text, fontSize: 11, fontWeight: "700" },
  state: { flex: 1, minHeight: 240, alignItems: "center", justifyContent: "center", gap: 11, padding: 28 },
  stateText: { fontFamily: F, color: C.textSec, fontSize: 13, textAlign: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "#11182799", justifyContent: "flex-end" },
  detailsSheet: { maxHeight: "92%", backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  modalHeader: { flexDirection: "row", alignItems: "center", padding: 18, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontFamily: F, color: C.text, fontSize: 18, fontWeight: "800" },
  closeButton: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  detailsContent: { padding: 17, paddingBottom: 38 },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12, marginBottom: 9 },
  sectionTitleText: { fontFamily: F, color: C.text, fontSize: 14, fontWeight: "800" },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  detail: { width: "48%", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  detailLabel: { fontFamily: F, color: C.textMuted, fontSize: 10, marginBottom: 5 },
  detailValue: { fontFamily: F, color: C.text, fontSize: 12, lineHeight: 18 },
  detailLine: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  linkRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mutedText: { fontFamily: F, color: C.textMuted, fontSize: 12 },
  modalActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  filterSheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 19, paddingBottom: 32 },
  filterOption: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 13, borderRadius: 11, marginTop: 6 },
  filterSelected: { backgroundColor: C.accentLight },
  filterText: { fontFamily: F, color: C.text, fontSize: 14 },
  filterSelectedText: { color: C.accentHover, fontWeight: "800" },
});
