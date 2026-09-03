import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { C, F } from "../../constants/tokens";
import { cancelInterview, completeInterview, createInterviewFeedback, fetchInterviewFeedback, fetchInterviews, updateInterview, updateInterviewFeedback } from "../../imports/interviews";
import { useSyncRefresh } from "../../context/SyncContext";
import { resolveMediaUrl } from "../../imports/api";

type Filter = "All" | "Upcoming" | "Completed" | "Cancelled";

function statusOf(item: any) {
  const status = String(item.status ?? "Scheduled");
  if (status === "Scheduled") return "Upcoming";
  if (["complete", "completed"].includes(status.toLowerCase())) return "Completed";
  if (["cancel", "cancelled", "canceled"].includes(status.toLowerCase())) return "Cancelled";
  return status;
}

function formatTime(value?: string) {
  if (!value) return "Time pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function localDateAndTime(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

function formatClockTime(value?: string) {
  const [hoursValue, minutesValue] = String(value ?? "").split(":");
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return "Select Time";
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function CandidateAvatar({ interview, large = false }: { interview: any; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const uri = resolveMediaUrl(interview.avatar);
  const initial = interview.candidate_name?.trim()?.charAt(0)?.toUpperCase() || "?";

  useEffect(() => setFailed(false), [uri]);

  if (!uri || failed) {
    return <View style={large ? styles.largeAvatar : styles.avatar}><Text style={large ? styles.largeAvatarText : styles.avatarText}>{initial}</Text></View>;
  }

  return <Image source={{ uri }} style={large ? styles.largeAvatarImage : styles.avatarImage} resizeMode="cover" onError={() => setFailed(true)} />;
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
  const [feedback, setFeedback] = useState<any | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ technical_score: "", communication_score: "", final_decision: "", notes: "" });

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const response = await fetchInterviews();
      setInterviews(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      Alert.alert("Unable to load interviews", error?.response?.data?.message ?? "Failed to load interviews.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useSyncRefresh("interviews", () => load(true));

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const visible = useMemo(() => interviews.filter((item) => filter === "All" || statusOf(item) === filter), [filter, interviews]);
  const upcoming = interviews.filter((item) => statusOf(item) === "Upcoming").length;
  const completed = interviews.filter((item) => statusOf(item) === "Completed").length;

  const changeStatus = async (interview: any, action: "complete" | "cancel") => {
    setBusyId(interview.id);
    try {
      const response = action === "complete"
        ? await completeInterview(interview.id)
        : await cancelInterview(interview.id);
      setSelected(null);
      await load();
      Alert.alert(
        "Success",
        action === "cancel"
          ? `${response.data?.message ?? "Interview cancelled successfully."}\nCandidate notification processed.`
          : response.data?.message ?? "Interview completed successfully."
      );
    } catch (error: any) {
      Alert.alert("Could not update interview", error?.response?.data?.message ?? "Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const loadFeedback = useCallback(async (interviewId: number) => {
    setFeedbackLoading(true);
    try {
      const response = await fetchInterviewFeedback(interviewId);
      setFeedback(response.data);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setFeedback(null);
        return;
      }
      Alert.alert("Unable to load feedback", error?.response?.data?.message ?? "Failed to load interview feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  const openDetails = (item: any) => {
    setSelected(item);
    setEditing(false);
    setFeedback(null);
    if (item.status === "Completed") void loadFeedback(item.id);
  };

  const openFeedbackForm = (edit = false) => {
    setEditingFeedback(edit);
    setFeedbackForm(edit && feedback ? {
      technical_score: String(feedback.technical_score ?? ""),
      communication_score: String(feedback.communication_score ?? ""),
      final_decision: String(feedback.final_decision ?? ""),
      notes: String(feedback.notes ?? ""),
    } : { technical_score: "", communication_score: "", final_decision: "", notes: "" });
    setFeedbackModalVisible(true);
  };

  const saveFeedback = async () => {
    if (!selected || selected.status !== "Completed") return;
    const technicalScore = Number(feedbackForm.technical_score);
    const communicationScore = Number(feedbackForm.communication_score);
    if (!Number.isInteger(technicalScore) || technicalScore < 0 || technicalScore > 100) {
      Alert.alert("Invalid score", "Technical score must be between 0 and 100.");
      return;
    }
    if (!Number.isInteger(communicationScore) || communicationScore < 0 || communicationScore > 100) {
      Alert.alert("Invalid score", "Communication score must be between 0 and 100.");
      return;
    }
    if (!feedbackForm.final_decision) {
      Alert.alert("Final decision required", "Please select a final decision.");
      return;
    }
    const payload = { technical_score: technicalScore, communication_score: communicationScore, final_decision: feedbackForm.final_decision, notes: feedbackForm.notes.trim() || null };
    setSavingFeedback(true);
    try {
      const response = editingFeedback
        ? await updateInterviewFeedback(selected.id, payload)
        : await createInterviewFeedback(selected.id, payload);
      setFeedback(response.data?.feedback ?? response.data);
      setFeedbackModalVisible(false);
      Alert.alert(
        "Success",
        `${response.data?.message ?? "Feedback submitted successfully."}\nCandidate notification processed.`
      );
      await load();
    } catch (error: any) {
      const data = error?.response?.data;
      const firstError = data?.errors ? Object.values(data.errors).flat()[0] : null;
      Alert.alert("Unable to save feedback", String(firstError ?? data?.message ?? "Failed to save feedback."));
      if (data?.message === "Feedback already exists.") {
        await loadFeedback(selected.id);
        setFeedbackModalVisible(false);
      }
    } finally {
      setSavingFeedback(false);
    }
  };

  const startEditing = () => {
    const rawDate = String(selected?.interview_date ?? "");
    const localValue = localDateAndTime(rawDate);
    const type = String(selected?.type ?? "Online");
    setEditForm({
      date: localValue.date,
      time: localValue.time,
      duration: String(selected?.duration ?? "30").replace(/[^\d]/g, "") || "30",
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
      const response = await updateInterview(selected.id, {
        interview_date: `${editForm.date.trim()} ${editForm.time.trim()}`,
        duration: Number(editForm.duration) || 30,
        type: editForm.type,
        meeting_link: editForm.type === "Online" ? editForm.place.trim() || null : null,
        location: editForm.type === "Onsite" ? editForm.place.trim() || null : null,
      });
      setSelected(null);
      setEditing(false);
      await load();
      Alert.alert(
        "Interview rescheduled",
        `${response.data?.message ?? "Interview updated successfully."}\nCandidate notification processed.`
      );
    } catch (error: any) {
      Alert.alert("Could not update interview", error?.response?.data?.message ?? "Please check the details and try again.");
    } finally {
      setBusyId(null);
    }
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
        const name = item.candidate_name || "Unknown Candidate";
        const job = item.job_title || "Position not specified";
        const date = item.interview_date;
        const time = formatTime(item.interview_date);
        const type = item.type || "Interview";
        const status = statusOf(item);
        const candidateId = item.application_id;
        const isBusy = busyId === item.id;
        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}><CandidateAvatar interview={item} /><View style={styles.cardCopy}><Text style={styles.name}>{name}</Text><Text style={styles.headline} numberOfLines={1}>{item.headline || "Candidate"}</Text><Text style={styles.job} numberOfLines={1}>{job}</Text></View><Pressable onPress={() => openDetails(item)} style={[styles.statusBadge, status === "Completed" && styles.completedBadge, status === "Cancelled" && styles.cancelledBadge]}><Text style={[styles.statusText, status === "Completed" && styles.completedText, status === "Cancelled" && styles.cancelledText]}>{status === "Upcoming" ? "Scheduled" : status}</Text><Ionicons name="chevron-forward" size={12} color={status === "Completed" ? C.success : status === "Cancelled" ? C.error : C.accentHover} /></Pressable></View>
            <View style={styles.detailsCard}><Detail icon="calendar-outline" text={formatDate(date)} /><Detail icon="time-outline" text={String(time)} /><Detail icon={String(type).toLowerCase() === "online" ? "videocam-outline" : "location-outline"} text={String(type)} /></View>
            <View style={styles.actions}>
              {candidateId && <Pressable style={styles.profileButton} onPress={() => router.push({ pathname: "/company/CandidateDetails", params: { id: String(candidateId) } })}><Ionicons name="person-outline" size={15} color={C.text} /><Text style={styles.profileText}>Candidate</Text></Pressable>}
              {!!item.meeting_link && <Pressable style={styles.profileButton} onPress={() => void Linking.openURL(item.meeting_link)}><Ionicons name="videocam-outline" size={15} color={C.text} /><Text style={styles.profileText}>Join</Text></Pressable>}
              {status === "Upcoming" && <><Pressable disabled={isBusy} style={styles.completeButton} onPress={() => void changeStatus(item, "complete")}>{isBusy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <><Ionicons name="checkmark" size={16} color="#FFFFFF" /><Text style={styles.completeText}>Complete</Text></>}</Pressable><Pressable disabled={isBusy} style={styles.cancelButton} onPress={() => void changeStatus(item, "cancel")}><Ionicons name="close" size={16} color={C.error} /><Text style={styles.cancelText}>Cancel</Text></Pressable></>}
            </View>
          </View>
        );
      })}
      <InterviewDetailsModal interview={feedbackModalVisible ? null : selected} editing={editing} form={editForm} setForm={setEditForm} busy={selected ? busyId === selected.id : false} feedback={feedback} feedbackLoading={feedbackLoading} onAddFeedback={() => openFeedbackForm(false)} onEditFeedback={() => openFeedbackForm(true)} onClose={() => { setSelected(null); setEditing(false); }} onEdit={startEditing} onStopEdit={() => setEditing(false)} onSave={() => void saveEdit()} onCancel={() => selected && void changeStatus(selected, "cancel")} onComplete={() => selected && void changeStatus(selected, "complete")} onDelete={() => selected && void changeStatus(selected, "cancel")} />
      <FeedbackModal visible={feedbackModalVisible} form={feedbackForm} setForm={setFeedbackForm} saving={savingFeedback} editing={editingFeedback} onClose={() => setFeedbackModalVisible(false)} onSave={() => void saveFeedback()} />
    </ScrollView>
  );
}

function InterviewDetailsModal({ interview, editing, form, setForm, busy, feedback, feedbackLoading, onAddFeedback, onEditFeedback, onClose, onEdit, onStopEdit, onSave, onCancel, onComplete, onDelete }: any) {
  const [showTimePicker, setShowTimePicker] = useState(false);
  if (!interview) return null;
  const name = interview.candidate_name || "Unknown Candidate";
  const job = interview.job_title || "Position not specified";
  const rawDate = interview.interview_date;
  const time = formatTime(rawDate);
  const type = interview.type || "Interview";
  const status = statusOf(interview);
  const pickerValue = new Date();
  const [pickerHours, pickerMinutes] = String(form.time || "00:00").split(":").map(Number);
  pickerValue.setHours(Number.isFinite(pickerHours) ? pickerHours : 0, Number.isFinite(pickerMinutes) ? pickerMinutes : 0, 0, 0);
  const handlePickerChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS !== "ios") setShowTimePicker(false);
    if (event?.type === "dismissed" || !selectedTime) return;
    const hours = String(selectedTime.getHours()).padStart(2, "0");
    const minutes = String(selectedTime.getMinutes()).padStart(2, "0");
    setForm({ ...form, time: `${hours}:${minutes}` });
  };
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalOverlay}><View style={styles.modalSheet}><View style={styles.modalHandle} /><View style={styles.modalHeader}><View><Text style={styles.modalTitle}>{editing ? "Edit Interview" : "Interview Details"}</Text><Text style={styles.modalSubtitle}>{editing ? "Update the schedule and meeting details" : "Review and manage this interview"}</Text></View><Pressable style={styles.closeButton} onPress={onClose}><Ionicons name="close" size={20} color={C.text} /></Pressable></View>{editing ? <ScrollView keyboardShouldPersistTaps="handled"><Input label="Date" placeholder="YYYY-MM-DD" value={form.date} onChangeText={(date: string) => setForm({ ...form, date })} /><Text style={styles.inputLabel}>Time</Text>{Platform.OS === "ios" ? <View style={styles.timePickerButton}><Ionicons name="time-outline" size={18} color={C.textSec} /><DateTimePicker value={pickerValue} mode="time" display="compact" locale="en-US" onChange={handlePickerChange} style={styles.compactTimePicker} /></View> : <><Pressable style={styles.timePickerButton} onPress={() => setShowTimePicker(true)}><Ionicons name="time-outline" size={18} color={C.textSec} /><Text style={styles.timePickerText}>{formatClockTime(form.time)}</Text></Pressable>{showTimePicker ? <DateTimePicker value={pickerValue} mode="time" display="default" is24Hour={false} onChange={handlePickerChange} /> : null}</>}<Input label="Duration (minutes)" keyboardType="number-pad" value={form.duration} onChangeText={(duration: string) => setForm({ ...form, duration })} /><Text style={styles.inputLabel}>Interview Type</Text><View style={styles.typeRow}>{["Online", "Onsite"].map((value) => <Pressable key={value} onPress={() => setForm({ ...form, type: value, place: "" })} style={[styles.typeButton, form.type === value && styles.typeButtonActive]}><Text style={[styles.typeText, form.type === value && styles.typeTextActive]}>{value}</Text></Pressable>)}</View><Input label={form.type === "Online" ? "Meeting Link" : "Location"} value={form.place} onChangeText={(place: string) => setForm({ ...form, place })} /><View style={styles.modalActions}><Pressable style={styles.secondaryAction} onPress={() => { setShowTimePicker(false); onStopEdit(); }}><Text style={styles.secondaryActionText}>Cancel</Text></Pressable><Pressable disabled={busy} style={styles.saveAction} onPress={onSave}>{busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveActionText}>Save Changes</Text>}</Pressable></View></ScrollView> : <ScrollView showsVerticalScrollIndicator={false}><View style={styles.personRow}><CandidateAvatar interview={interview} large /><View style={styles.personCopy}><Text style={styles.personName}>{name}</Text><Text style={styles.personJob}>{interview.headline || "Candidate"}</Text><Text style={styles.personJob}>{job}</Text></View><View style={styles.scheduledPill}><Text style={styles.scheduledPillText}>{status === "Upcoming" ? "Scheduled" : status}</Text></View></View><View style={styles.infoList}><Info label="Type" value={String(type)} /><Info label="Date" value={formatDate(rawDate)} /><Info label="Time" value={String(time)} /><Info label="Duration" value={String(interview.duration ?? "30 min")} /><Info label="Status" value={status === "Upcoming" ? "Scheduled" : status} last /></View>{interview.status === "Completed" ? <FeedbackSection feedback={feedback} loading={feedbackLoading} onAdd={onAddFeedback} onEdit={onEditFeedback} /> : null}<View style={styles.modalActions}><Pressable style={styles.secondaryAction} onPress={onEdit}><Ionicons name="create-outline" size={16} color={C.text} /><Text style={styles.secondaryActionText}>Edit</Text></Pressable>{status === "Upcoming" && <Pressable disabled={busy} style={styles.cancelAction} onPress={onCancel}><Text style={styles.cancelActionText}>Cancel</Text></Pressable>}{status === "Upcoming" && <Pressable disabled={busy} style={styles.completeAction} onPress={onComplete}><Text style={styles.completeActionText}>Complete</Text></Pressable>}</View><Pressable disabled={busy} style={styles.deleteAction} onPress={onDelete}><Ionicons name="trash-outline" size={16} color={C.error} /><Text style={styles.deleteActionText}>Delete Interview</Text></Pressable></ScrollView>}</View></View></Modal>;
}

function FeedbackSection({ feedback, loading, onAdd, onEdit }: any) {
  return <View style={styles.feedbackSection}><View style={styles.feedbackHeader}><Text style={styles.feedbackHeading}>Feedback</Text>{!loading && !feedback ? <Pressable style={styles.addFeedbackButton} onPress={onAdd}><Ionicons name="add" size={15} color="#FFFFFF" /><Text style={styles.addFeedbackText}>Add Feedback</Text></Pressable> : null}</View>{loading ? <ActivityIndicator color={C.accent} /> : feedback ? <View style={styles.feedbackCard}><View style={styles.scoreRow}><View style={styles.scoreBox}><Text style={styles.scoreLabel}>Technical Score</Text><Text style={styles.scoreValue}>{feedback.technical_score}/100</Text></View><View style={styles.scoreBox}><Text style={styles.scoreLabel}>Communication Score</Text><Text style={styles.scoreValue}>{feedback.communication_score}/100</Text></View></View><Text style={styles.scoreLabel}>Final Decision</Text><Text style={[styles.decisionValue, { color: feedback.final_decision === "Accepted" ? "#15803D" : "#DC2626" }]}>{feedback.final_decision}</Text>{feedback.notes ? <><Text style={styles.notesLabel}>Notes</Text><Text style={styles.notesText}>{feedback.notes}</Text></> : null}<Pressable style={styles.editFeedbackButton} onPress={onEdit}><Text style={styles.editFeedbackText}>Edit Feedback</Text></Pressable></View> : <View style={styles.emptyFeedback}><Text style={styles.emptyFeedbackText}>No feedback added yet for this interview.</Text></View>}</View>;
}

function FeedbackModal({ visible, form, setForm, saving, editing, onClose, onSave }: any) {
  const scrollRef = useRef<ScrollView>(null);
  const revealNotes = () => setTimeout(() => scrollRef.current?.scrollTo({ y: 180, animated: true }), 250);
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><KeyboardAvoidingView style={styles.keyboardAvoider} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}><View style={styles.modalOverlay}><View style={styles.feedbackModal}><View style={styles.modalHeader}><View><Text style={styles.modalTitle}>{editing ? "Edit Feedback" : "Add Feedback"}</Text><Text style={styles.modalSubtitle}>Score the completed interview</Text></View><Pressable style={styles.closeButton} onPress={onClose}><Ionicons name="close" size={20} color={C.text} /></Pressable></View><ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"} contentContainerStyle={styles.feedbackScrollContent}><Input label="Technical Score" value={form.technical_score} placeholder="0-100" keyboardType="number-pad" maxLength={3} onChangeText={(value: string) => setForm({ ...form, technical_score: value.replace(/\D/g, "") })} /><Input label="Communication Score" value={form.communication_score} placeholder="0-100" keyboardType="number-pad" maxLength={3} onChangeText={(value: string) => setForm({ ...form, communication_score: value.replace(/\D/g, "") })} /><Text style={styles.inputLabel}>Final Decision</Text><View style={styles.decisionRow}>{["Accepted", "Rejected"].map((decision) => <Pressable key={decision} onPress={() => setForm({ ...form, final_decision: decision })} style={[styles.decisionButton, form.final_decision === decision && (decision === "Accepted" ? styles.acceptedDecision : styles.rejectedDecision)]}><Text style={[styles.decisionButtonText, form.final_decision === decision && styles.selectedDecisionText]}>{decision}</Text></Pressable>)}</View><Text style={styles.inputLabel}>Notes</Text><TextInput value={form.notes} onChangeText={(notes) => setForm({ ...form, notes })} onFocus={revealNotes} placeholder="Add interview notes..." placeholderTextColor={C.textMuted} multiline numberOfLines={5} textAlignVertical="top" style={[styles.input, styles.notesInput]} /><View style={styles.modalActions}><Pressable style={styles.secondaryAction} onPress={onClose}><Text style={styles.secondaryActionText}>Cancel</Text></Pressable><Pressable disabled={saving} style={styles.saveAction} onPress={onSave}>{saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveActionText}>{editing ? "Save Changes" : "Submit Feedback"}</Text>}</Pressable></View></ScrollView></View></View></KeyboardAvoidingView></Modal>;
}

function Input({ label, ...props }: any) { return <View style={styles.inputGroup}><Text style={styles.inputLabel}>{label}</Text><TextInput {...props} placeholderTextColor={C.textMuted} style={styles.input} /></View>; }
function Info({ label, value, last = false }: { label: string; value: string; last?: boolean }) { return <View style={[styles.infoRow, last && styles.infoRowLast]}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }

function Stat({ value, label, icon }: { value: number; label: string; icon: keyof typeof Ionicons.glyphMap }) { return <View style={styles.stat}><Ionicons name={icon} size={17} color={C.accentHover} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function Detail({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) { return <View style={styles.detail}><Ionicons name={icon} size={16} color={C.textMuted} /><Text style={styles.detailText}>{text}</Text></View>; }

const styles = StyleSheet.create({
  keyboardAvoider: { flex: 1 },
  container: { flex: 1, backgroundColor: C.bg }, content: { padding: 16, paddingBottom: 40 }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: C.bg }, loadingText: { color: C.textSec, fontSize: 12, fontFamily: F }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }, heading: { color: C.text, fontSize: 25, fontWeight: "900", fontFamily: F }, subtitle: { color: C.textSec, fontSize: 11, marginTop: 4, fontFamily: F }, headerIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" }, statsRow: { flexDirection: "row", gap: 8 }, stat: { flex: 1, minHeight: 84, alignItems: "center", justifyContent: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14 }, statValue: { color: C.text, fontSize: 19, fontWeight: "900", marginTop: 4, fontFamily: F }, statLabel: { color: C.textSec, fontSize: 10, marginTop: 2, fontFamily: F }, filters: { gap: 8, paddingVertical: 14 }, filter: { minHeight: 39, justifyContent: "center", paddingHorizontal: 16, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }, filterActive: { backgroundColor: C.accentLight, borderColor: C.accent }, filterText: { color: C.textSec, fontSize: 12, fontWeight: "700", fontFamily: F }, filterTextActive: { color: C.accentHover },
  card: { backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 17, padding: 15, marginBottom: 12 }, cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 }, avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" }, avatarImage: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#F1F5F9" }, avatarText: { color: C.accentHover, fontSize: 17, fontWeight: "900", fontFamily: F }, cardCopy: { flex: 1 }, name: { color: C.text, fontSize: 15, fontWeight: "800", fontFamily: F }, headline: { color: C.textSec, fontSize: 11, marginTop: 3, fontFamily: F }, job: { color: C.textSec, fontSize: 11, marginTop: 4, fontFamily: F }, statusBadge: { flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: C.accentLight, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 }, statusText: { color: C.accentHover, fontSize: 9, fontWeight: "800", fontFamily: F }, completedBadge: { backgroundColor: C.successBg }, completedText: { color: C.success }, cancelledBadge: { backgroundColor: C.errorBg }, cancelledText: { color: C.error }, detailsCard: { gap: 9, marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: C.bg }, detail: { flexDirection: "row", alignItems: "center", gap: 8 }, detailText: { flex: 1, color: C.textSec, fontSize: 11, fontFamily: F }, actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 7, marginTop: 14 }, profileButton: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, borderWidth: 1, borderColor: C.border, borderRadius: 10 }, profileText: { color: C.text, fontSize: 11, fontWeight: "700", fontFamily: F }, completeButton: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 12, backgroundColor: C.accent, borderRadius: 10 }, completeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", fontFamily: F }, cancelButton: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: "#FECACA", borderRadius: 10 }, cancelText: { color: C.error, fontSize: 11, fontWeight: "700", fontFamily: F },
  empty: { alignItems: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 34 }, emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" }, emptyTitle: { color: C.text, fontSize: 16, fontWeight: "800", marginTop: 14, fontFamily: F }, emptyText: { color: C.textSec, fontSize: 12, marginTop: 6, fontFamily: F }, browseButton: { minHeight: 41, justifyContent: "center", backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 15, marginTop: 17 }, browseText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", fontFamily: F },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.48)" }, modalSheet: { maxHeight: "90%", backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: 30 }, modalHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 16 }, modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }, modalTitle: { color: C.text, fontSize: 20, fontWeight: "900", fontFamily: F }, modalSubtitle: { color: C.textSec, fontSize: 11, marginTop: 4, fontFamily: F }, closeButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }, personRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingBottom: 18 }, largeAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" }, largeAvatarImage: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#F1F5F9" }, largeAvatarText: { color: C.accentHover, fontSize: 20, fontWeight: "900", fontFamily: F }, personCopy: { flex: 1 }, personName: { color: C.text, fontSize: 16, fontWeight: "800", fontFamily: F }, personJob: { color: C.textSec, fontSize: 11, lineHeight: 16, marginTop: 3, fontFamily: F }, scheduledPill: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, backgroundColor: C.accentLight }, scheduledPillText: { color: C.accentHover, fontSize: 9, fontWeight: "800", fontFamily: F }, infoList: { borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 13 }, infoRow: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: C.divider }, infoRowLast: { borderBottomWidth: 0 }, infoLabel: { color: C.textSec, fontSize: 11, fontFamily: F }, infoValue: { flex: 1, textAlign: "right", color: C.text, fontSize: 12, fontWeight: "700", fontFamily: F }, modalActions: { flexDirection: "row", gap: 8, marginTop: 18 }, secondaryAction: { flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1, borderColor: C.border, borderRadius: 11 }, secondaryActionText: { color: C.text, fontSize: 11, fontWeight: "800", fontFamily: F }, cancelAction: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", backgroundColor: C.errorBg, borderRadius: 11 }, cancelActionText: { color: C.error, fontSize: 11, fontWeight: "800", fontFamily: F }, completeAction: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", backgroundColor: C.successBg, borderRadius: 11 }, completeActionText: { color: C.success, fontSize: 11, fontWeight: "800", fontFamily: F }, deleteAction: { minHeight: 43, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 }, deleteActionText: { color: C.error, fontSize: 11, fontWeight: "700", fontFamily: F }, inputGroup: { marginBottom: 14 }, inputLabel: { color: C.text, fontSize: 11, fontWeight: "700", marginBottom: 7, fontFamily: F }, input: { minHeight: 45, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, borderRadius: 11, paddingHorizontal: 12, color: C.text, fontSize: 12, fontFamily: F }, timePickerButton: { minHeight: 46, marginBottom: 14, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, borderRadius: 11 }, compactTimePicker: { flex: 1, alignSelf: "center" }, timePickerText: { color: C.text, fontSize: 13, fontWeight: "700", fontFamily: F }, typeRow: { flexDirection: "row", gap: 8, marginBottom: 14 }, typeButton: { flex: 1, minHeight: 43, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border, borderRadius: 10 }, typeButtonActive: { backgroundColor: C.accentLight, borderColor: C.accent }, typeText: { color: C.textSec, fontSize: 11, fontWeight: "700", fontFamily: F }, typeTextActive: { color: C.accentHover }, saveAction: { flex: 1.5, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: C.accent }, saveActionText: { color: "#fff", fontSize: 11, fontWeight: "800", fontFamily: F },
  feedbackSection: { marginTop: 18 }, feedbackHeader: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }, feedbackHeading: { color: C.text, fontSize: 15, fontWeight: "900", fontFamily: F }, feedbackCard: { padding: 14, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.bg }, scoreRow: { flexDirection: "row", gap: 10, marginBottom: 14 }, scoreBox: { flex: 1 }, scoreLabel: { color: C.textSec, fontSize: 10, fontFamily: F }, scoreValue: { color: C.text, fontSize: 17, fontWeight: "900", marginTop: 4, fontFamily: F }, decisionValue: { fontSize: 13, fontWeight: "800", marginTop: 4, fontFamily: F }, notesLabel: { color: C.textSec, fontSize: 10, marginTop: 13, fontFamily: F }, notesText: { color: C.text, fontSize: 12, lineHeight: 18, marginTop: 4, fontFamily: F }, editFeedbackButton: { alignSelf: "flex-start", marginTop: 14, paddingVertical: 7 }, editFeedbackText: { color: C.accentHover, fontSize: 12, fontWeight: "800", fontFamily: F }, emptyFeedback: { padding: 14, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.bg }, emptyFeedbackText: { color: C.textSec, fontSize: 12, fontFamily: F }, addFeedbackButton: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.accent }, addFeedbackText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", fontFamily: F }, feedbackModal: { maxHeight: "90%", backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: 30 }, feedbackScrollContent: { paddingBottom: 18 }, decisionRow: { flexDirection: "row", gap: 9, marginBottom: 16 }, decisionButton: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border, borderRadius: 11 }, acceptedDecision: { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" }, rejectedDecision: { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" }, decisionButtonText: { color: C.textSec, fontSize: 12, fontWeight: "700", fontFamily: F }, selectedDecisionText: { color: C.text, fontWeight: "900" }, notesInput: { minHeight: 110, paddingTop: 12 },
});
