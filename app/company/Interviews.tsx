import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { C, F } from "../../constants/tokens";
import { cancelInterview, completeInterview, deleteInterview, fetchInterviews, updateInterview } from "../../imports/interviews";
import { useSyncRefresh } from "../../context/SyncContext";

type Filter = "All" | "Upcoming" | "Completed" | "Cancelled";

function unwrap(value: any): any[] {
  const result = value?.data?.data ?? value?.data?.interviews ?? value?.data ?? value ?? [];
  return Array.isArray(result) ? result : [];
}

function statusOf(item: any) {
  const status = String(item.status ?? "Scheduled");
  if (["scheduled", "pending", "upcoming"].includes(status.toLowerCase())) return "Upcoming";
  if (["complete", "completed"].includes(status.toLowerCase())) return "Completed";
  if (["cancel", "cancelled", "canceled"].includes(status.toLowerCase())) return "Cancelled";
  return status;
}

function formatDate(value?: string) {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function CompanyInterviews() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [selected, setSelected] = useState<any | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ date: "", time: "", duration: "30", type: "Online", place: "" });

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      setInterviews(unwrap(await fetchInterviews()));
    } catch {
      Alert.alert("Unable to load interviews", "Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useSyncRefresh("interviews", () => load(true));

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => interviews.filter((item) => filter === "All" || statusOf(item) === filter), [filter, interviews]);
  const upcoming = interviews.filter((item) => statusOf(item) === "Upcoming").length;
  const completed = interviews.filter((item) => statusOf(item) === "Completed").length;

  const changeStatus = async (interview: any, action: "complete" | "cancel") => {
    setBusyId(interview.id);
    try {
      if (action === "complete") await completeInterview(interview.id); else await cancelInterview(interview.id);
      setSelected(null);
      await load();
    } catch {
      Alert.alert("Could not update interview", "Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const openDetails = (item: any) => {
    setSelected(item);
    setEditing(false);
  };

  const startEditing = () => {
    const rawDate = String(selected?.interview_date ?? selected?.date ?? selected?.scheduled_at ?? "");
    const [datePart = "", timePart = ""] = rawDate.replace("T", " ").split(" ");
    const type = String(selected?.type ?? selected?.interview_type ?? "Online");
    setEditForm({
      date: datePart,
      time: String(selected?.time ?? selected?.interview_time ?? selected?.start_time ?? timePart).slice(0, 5),
      duration: String(selected?.duration ?? 30),
      type,
      place: String(type.toLowerCase() === "online" ? selected?.meeting_link ?? "" : selected?.location ?? ""),
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected || !editForm.date.trim() || !editForm.time.trim()) {
      Alert.alert("Missing details", "Please enter the interview date and time.");
      return;
    }
    setBusyId(selected.id);
    try {
      await updateInterview(selected.id, {
        interview_date: `${editForm.date.trim()} ${editForm.time.trim()}`,
        duration: Number(editForm.duration) || 30,
        type: editForm.type,
        meeting_link: editForm.type === "Online" ? editForm.place.trim() : "",
        location: editForm.type === "Onsite" ? editForm.place.trim() : "",
        status: "Scheduled",
      });
      setSelected(null);
      setEditing(false);
      await load();
    } catch {
      Alert.alert("Could not update interview", "Please check the details and try again.");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = () => {
    if (!selected) return;
    Alert.alert("Delete interview?", "This interview will be permanently removed.", [
      { text: "Keep", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        setBusyId(selected.id);
        try {
          await deleteInterview(selected.id);
          setSelected(null);
          await load();
        } catch {
          Alert.alert("Could not delete interview", "Please try again.");
        } finally {
          setBusyId(null);
        }
      } },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={C.accent} /><Text style={styles.loadingText}>Loading interviews...</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={C.accent} />}>
      <View style={styles.header}><View><Text style={styles.heading}>Interviews</Text><Text style={styles.subtitle}>Manage your scheduled candidate interviews</Text></View><View style={styles.headerIcon}><Ionicons name="calendar-outline" size={24} color={C.accentHover} /></View></View>

      <View style={styles.statsRow}><Stat value={interviews.length} label="Total" icon="calendar-outline" /><Stat value={upcoming} label="Upcoming" icon="time-outline" /><Stat value={completed} label="Completed" icon="checkmark-circle-outline" /></View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{(["All", "Upcoming", "Completed", "Cancelled"] as Filter[]).map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</ScrollView>

      {visible.length === 0 ? (
        <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="calendar-clear-outline" size={36} color={C.accentHover} /></View><Text style={styles.emptyTitle}>No {filter === "All" ? "" : filter.toLowerCase()} interviews</Text><Text style={styles.emptyText}>Scheduled interviews will appear here.</Text><Pressable style={styles.browseButton} onPress={() => router.push("/company/Applicants")}><Text style={styles.browseText}>Browse Applicants</Text></Pressable></View>
      ) : visible.map((item) => {
        const name = item.candidate?.name ?? item.student?.name ?? item.application?.student?.name ?? "Candidate";
        const job = item.job?.title ?? item.job_post?.title ?? item.job_title ?? "Position not specified";
        const date = item.date ?? item.interview_date ?? item.scheduled_at;
        const time = item.time ?? item.interview_time ?? item.start_time ?? "Time pending";
        const type = item.type ?? item.interview_type ?? "Interview";
        const status = statusOf(item);
        const candidateId = item.application_id ?? item.application?.id ?? item.candidate?.id;
        const isBusy = busyId === item.id;
        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}><View style={styles.avatar}><Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text></View><View style={styles.cardCopy}><Text style={styles.name}>{name}</Text><Text style={styles.job} numberOfLines={1}>{job}</Text></View><Pressable onPress={() => openDetails(item)} style={[styles.statusBadge, status === "Completed" && styles.completedBadge, status === "Cancelled" && styles.cancelledBadge]}><Text style={[styles.statusText, status === "Completed" && styles.completedText, status === "Cancelled" && styles.cancelledText]}>{status === "Upcoming" ? "Scheduled" : status}</Text><Ionicons name="chevron-forward" size={12} color={status === "Completed" ? C.success : status === "Cancelled" ? C.error : C.accentHover} /></Pressable></View>
            <View style={styles.detailsCard}><Detail icon="calendar-outline" text={formatDate(date)} /><Detail icon="time-outline" text={String(time)} /><Detail icon={String(type).toLowerCase() === "online" ? "videocam-outline" : "location-outline"} text={String(type)} /></View>
            <View style={styles.actions}>
              {candidateId && <Pressable style={styles.profileButton} onPress={() => router.push({ pathname: "/company/CandidateDetails", params: { id: String(candidateId) } })}><Ionicons name="person-outline" size={15} color={C.text} /><Text style={styles.profileText}>Candidate</Text></Pressable>}
              {!!item.meeting_link && <Pressable style={styles.profileButton} onPress={() => void Linking.openURL(item.meeting_link)}><Ionicons name="videocam-outline" size={15} color={C.text} /><Text style={styles.profileText}>Join</Text></Pressable>}
              {status === "Upcoming" && <><Pressable disabled={isBusy} style={styles.completeButton} onPress={() => void changeStatus(item, "complete")}>{isBusy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <><Ionicons name="checkmark" size={16} color="#FFFFFF" /><Text style={styles.completeText}>Complete</Text></>}</Pressable><Pressable disabled={isBusy} style={styles.cancelButton} onPress={() => void changeStatus(item, "cancel")}><Ionicons name="close" size={16} color={C.error} /><Text style={styles.cancelText}>Cancel</Text></Pressable></>}
            </View>
          </View>
        );
      })}
      <InterviewDetailsModal interview={selected} editing={editing} form={editForm} setForm={setEditForm} busy={selected ? busyId === selected.id : false} onClose={() => { setSelected(null); setEditing(false); }} onEdit={startEditing} onStopEdit={() => setEditing(false)} onSave={() => void saveEdit()} onCancel={() => selected && void changeStatus(selected, "cancel")} onComplete={() => selected && void changeStatus(selected, "complete")} onDelete={confirmDelete} />
    </ScrollView>
  );
}

function InterviewDetailsModal({ interview, editing, form, setForm, busy, onClose, onEdit, onStopEdit, onSave, onCancel, onComplete, onDelete }: any) {
  if (!interview) return null;
  const name = interview.candidate?.name ?? interview.student?.name ?? interview.application?.student?.name ?? "Candidate";
  const job = interview.job?.title ?? interview.job_post?.title ?? interview.job_title ?? "Position not specified";
  const rawDate = interview.date ?? interview.interview_date ?? interview.scheduled_at;
  const time = interview.time ?? interview.interview_time ?? interview.start_time ?? String(rawDate ?? "").split(/[T ]/)[1]?.slice(0, 5) ?? "Time pending";
  const type = interview.type ?? interview.interview_type ?? "Interview";
  const status = statusOf(interview);
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalOverlay}><View style={styles.modalSheet}><View style={styles.modalHandle} /><View style={styles.modalHeader}><View><Text style={styles.modalTitle}>{editing ? "Edit Interview" : "Interview Details"}</Text><Text style={styles.modalSubtitle}>{editing ? "Update the schedule and meeting details" : "Review and manage this interview"}</Text></View><Pressable style={styles.closeButton} onPress={onClose}><Ionicons name="close" size={20} color={C.text} /></Pressable></View>{editing ? <ScrollView keyboardShouldPersistTaps="handled"><Input label="Date" placeholder="YYYY-MM-DD" value={form.date} onChangeText={(date: string) => setForm({ ...form, date })} /><Input label="Time" placeholder="HH:MM" value={form.time} onChangeText={(time: string) => setForm({ ...form, time })} /><Input label="Duration (minutes)" keyboardType="number-pad" value={form.duration} onChangeText={(duration: string) => setForm({ ...form, duration })} /><Text style={styles.inputLabel}>Interview Type</Text><View style={styles.typeRow}>{["Online", "Onsite"].map((value) => <Pressable key={value} onPress={() => setForm({ ...form, type: value, place: "" })} style={[styles.typeButton, form.type === value && styles.typeButtonActive]}><Text style={[styles.typeText, form.type === value && styles.typeTextActive]}>{value}</Text></Pressable>)}</View><Input label={form.type === "Online" ? "Meeting Link" : "Location"} value={form.place} onChangeText={(place: string) => setForm({ ...form, place })} /><View style={styles.modalActions}><Pressable style={styles.secondaryAction} onPress={onStopEdit}><Text style={styles.secondaryActionText}>Cancel</Text></Pressable><Pressable disabled={busy} style={styles.saveAction} onPress={onSave}>{busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveActionText}>Save Changes</Text>}</Pressable></View></ScrollView> : <><View style={styles.personRow}><View style={styles.largeAvatar}><Text style={styles.largeAvatarText}>{String(name).charAt(0).toUpperCase()}</Text></View><View style={styles.personCopy}><Text style={styles.personName}>{name}</Text><Text style={styles.personJob}>{job}</Text></View><View style={styles.scheduledPill}><Text style={styles.scheduledPillText}>{status === "Upcoming" ? "Scheduled" : status}</Text></View></View><View style={styles.infoList}><Info label="Type" value={String(type)} /><Info label="Date" value={formatDate(rawDate)} /><Info label="Time" value={String(time)} /><Info label="Duration" value={`${interview.duration ?? 30} min`} /><Info label="Status" value={status === "Upcoming" ? "Scheduled" : status} last /></View><View style={styles.modalActions}><Pressable style={styles.secondaryAction} onPress={onEdit}><Ionicons name="create-outline" size={16} color={C.text} /><Text style={styles.secondaryActionText}>Edit</Text></Pressable>{status === "Upcoming" && <Pressable disabled={busy} style={styles.cancelAction} onPress={onCancel}><Text style={styles.cancelActionText}>Cancel</Text></Pressable>}{status === "Upcoming" && <Pressable disabled={busy} style={styles.completeAction} onPress={onComplete}><Text style={styles.completeActionText}>Complete</Text></Pressable>}</View><Pressable disabled={busy} style={styles.deleteAction} onPress={onDelete}><Ionicons name="trash-outline" size={16} color={C.error} /><Text style={styles.deleteActionText}>Delete Interview</Text></Pressable></>}</View></View></Modal>;
}

function Input({ label, ...props }: any) { return <View style={styles.inputGroup}><Text style={styles.inputLabel}>{label}</Text><TextInput {...props} placeholderTextColor={C.textMuted} style={styles.input} /></View>; }
function Info({ label, value, last = false }: { label: string; value: string; last?: boolean }) { return <View style={[styles.infoRow, last && styles.infoRowLast]}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }

function Stat({ value, label, icon }: { value: number; label: string; icon: keyof typeof Ionicons.glyphMap }) { return <View style={styles.stat}><Ionicons name={icon} size={17} color={C.accentHover} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function Detail({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) { return <View style={styles.detail}><Ionicons name={icon} size={16} color={C.textMuted} /><Text style={styles.detailText}>{text}</Text></View>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg }, content: { padding: 16, paddingBottom: 40 }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: C.bg }, loadingText: { color: C.textSec, fontSize: 12, fontFamily: F }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }, heading: { color: C.text, fontSize: 25, fontWeight: "900", fontFamily: F }, subtitle: { color: C.textSec, fontSize: 11, marginTop: 4, fontFamily: F }, headerIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" }, statsRow: { flexDirection: "row", gap: 8 }, stat: { flex: 1, minHeight: 84, alignItems: "center", justifyContent: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14 }, statValue: { color: C.text, fontSize: 19, fontWeight: "900", marginTop: 4, fontFamily: F }, statLabel: { color: C.textSec, fontSize: 10, marginTop: 2, fontFamily: F }, filters: { gap: 8, paddingVertical: 14 }, filter: { minHeight: 39, justifyContent: "center", paddingHorizontal: 16, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }, filterActive: { backgroundColor: C.accentLight, borderColor: C.accent }, filterText: { color: C.textSec, fontSize: 12, fontWeight: "700", fontFamily: F }, filterTextActive: { color: C.accentHover },
  card: { backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 17, padding: 15, marginBottom: 12 }, cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 }, avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" }, avatarText: { color: C.accentHover, fontSize: 17, fontWeight: "900", fontFamily: F }, cardCopy: { flex: 1 }, name: { color: C.text, fontSize: 15, fontWeight: "800", fontFamily: F }, job: { color: C.textSec, fontSize: 11, marginTop: 4, fontFamily: F }, statusBadge: { flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: C.accentLight, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 }, statusText: { color: C.accentHover, fontSize: 9, fontWeight: "800", fontFamily: F }, completedBadge: { backgroundColor: C.successBg }, completedText: { color: C.success }, cancelledBadge: { backgroundColor: C.errorBg }, cancelledText: { color: C.error }, detailsCard: { gap: 9, marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: C.bg }, detail: { flexDirection: "row", alignItems: "center", gap: 8 }, detailText: { flex: 1, color: C.textSec, fontSize: 11, fontFamily: F }, actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 7, marginTop: 14 }, profileButton: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, borderWidth: 1, borderColor: C.border, borderRadius: 10 }, profileText: { color: C.text, fontSize: 11, fontWeight: "700", fontFamily: F }, completeButton: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 12, backgroundColor: C.accent, borderRadius: 10 }, completeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", fontFamily: F }, cancelButton: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: "#FECACA", borderRadius: 10 }, cancelText: { color: C.error, fontSize: 11, fontWeight: "700", fontFamily: F },
  empty: { alignItems: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 34 }, emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" }, emptyTitle: { color: C.text, fontSize: 16, fontWeight: "800", marginTop: 14, fontFamily: F }, emptyText: { color: C.textSec, fontSize: 12, marginTop: 6, fontFamily: F }, browseButton: { minHeight: 41, justifyContent: "center", backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 15, marginTop: 17 }, browseText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", fontFamily: F },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.48)" }, modalSheet: { maxHeight: "90%", backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: 30 }, modalHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 16 }, modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }, modalTitle: { color: C.text, fontSize: 20, fontWeight: "900", fontFamily: F }, modalSubtitle: { color: C.textSec, fontSize: 11, marginTop: 4, fontFamily: F }, closeButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }, personRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingBottom: 18 }, largeAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" }, largeAvatarText: { color: C.accentHover, fontSize: 20, fontWeight: "900", fontFamily: F }, personCopy: { flex: 1 }, personName: { color: C.text, fontSize: 16, fontWeight: "800", fontFamily: F }, personJob: { color: C.textSec, fontSize: 11, lineHeight: 16, marginTop: 3, fontFamily: F }, scheduledPill: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, backgroundColor: C.accentLight }, scheduledPillText: { color: C.accentHover, fontSize: 9, fontWeight: "800", fontFamily: F }, infoList: { borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 13 }, infoRow: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: C.divider }, infoRowLast: { borderBottomWidth: 0 }, infoLabel: { color: C.textSec, fontSize: 11, fontFamily: F }, infoValue: { flex: 1, textAlign: "right", color: C.text, fontSize: 12, fontWeight: "700", fontFamily: F }, modalActions: { flexDirection: "row", gap: 8, marginTop: 18 }, secondaryAction: { flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1, borderColor: C.border, borderRadius: 11 }, secondaryActionText: { color: C.text, fontSize: 11, fontWeight: "800", fontFamily: F }, cancelAction: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", backgroundColor: C.errorBg, borderRadius: 11 }, cancelActionText: { color: C.error, fontSize: 11, fontWeight: "800", fontFamily: F }, completeAction: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", backgroundColor: C.successBg, borderRadius: 11 }, completeActionText: { color: C.success, fontSize: 11, fontWeight: "800", fontFamily: F }, deleteAction: { minHeight: 43, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 }, deleteActionText: { color: C.error, fontSize: 11, fontWeight: "700", fontFamily: F }, inputGroup: { marginBottom: 14 }, inputLabel: { color: C.text, fontSize: 11, fontWeight: "700", marginBottom: 7, fontFamily: F }, input: { minHeight: 45, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, borderRadius: 11, paddingHorizontal: 12, color: C.text, fontSize: 12, fontFamily: F }, typeRow: { flexDirection: "row", gap: 8, marginBottom: 14 }, typeButton: { flex: 1, minHeight: 43, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border, borderRadius: 10 }, typeButtonActive: { backgroundColor: C.accentLight, borderColor: C.accent }, typeText: { color: C.textSec, fontSize: 11, fontWeight: "700", fontFamily: F }, typeTextActive: { color: C.accentHover }, saveAction: { flex: 1.5, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: C.accent }, saveActionText: { color: "#fff", fontSize: 11, fontWeight: "800", fontFamily: F },
});
