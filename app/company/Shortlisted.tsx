import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { C, F } from "../../constants/tokens";
import { API, resolveMediaUrl } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

type ShortlistedCandidate = {
  id: number;
  status: string;
  job?: { id?: number; title?: string | null } | null;
  student?: { name?: string | null; email?: string | null; avatar?: string | null; headline?: string | null; university?: string | null; major?: string | null; gpa?: string | null; location?: string | null } | null;
  skills?: unknown[];
  shortlisted_at?: string | null;
};

function CandidateAvatar({ item }: { item: ShortlistedCandidate }) {
  const [failed, setFailed] = useState(false);
  const uri = resolveMediaUrl(item.student?.avatar);
  const initial = item.student?.name?.trim()?.charAt(0)?.toUpperCase() || "?";

  useEffect(() => setFailed(false), [uri]);

  if (!uri || failed) {
    return <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>;
  }

  return <Image source={{ uri }} style={styles.avatarImage} resizeMode="cover" onError={() => setFailed(true)} />;
}

export default function Shortlisted() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [applicants, setApplicants] = useState<ShortlistedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const response = await API.get("/company/shortlisted", { params: { _: Date.now() } });
      setApplicants(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      Alert.alert("Unable to load candidates", error?.response?.data?.message ?? "Failed to load shortlisted candidates.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useSyncRefresh("applications", () => load(false));
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const remove = (item: ShortlistedCandidate) => Alert.alert(
    "Remove from shortlist?",
    `${item.student?.name || "This candidate"} will return to Applied status.`,
    [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        const previous = applicants;
        setApplicants((current) => current.filter((candidate) => candidate.id !== item.id));
        try {
          await API.delete(`/company/applications/${item.id}/shortlist`);
        } catch (error: any) {
          setApplicants(previous);
          Alert.alert("Unable to remove candidate", error?.response?.data?.message ?? "Please try again.");
        }
      } },
    ],
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={C.accent} /><Text style={styles.loadingText}>Loading shortlisted candidates...</Text></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={C.accent} />}
    >
      <Pressable
        style={styles.backRow}
        onPress={() => id ? router.replace({ pathname: "/company/JobDetails", params: { id } }) : router.back()}
      >
        <Ionicons name="arrow-back" size={19} color={C.text} />
        <Text style={styles.backText}>Back to Job Details</Text>
      </Pressable>

      <View style={styles.header}>
        <View style={styles.headerIcon}><Ionicons name="bookmark" size={22} color={C.accentHover} /></View>
        <View style={styles.headerCopy}>
          <Text style={styles.heading}>Shortlisted Candidates</Text>
          <Text style={styles.subtitle}>Review the strongest candidates for this job</Text>
        </View>
        <View style={styles.countBadge}><Text style={styles.countText}>{applicants.length}</Text></View>
      </View>

      {applicants.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}><Ionicons name="people-outline" size={35} color={C.accentHover} /></View>
          <Text style={styles.emptyTitle}>No shortlisted candidates yet</Text>
          <Text style={styles.emptyText}>Candidates you shortlist for this job will appear here.</Text>
          <Pressable style={styles.applicantsButton} onPress={() => router.push("/company/Applicants")}>
            <Text style={styles.applicantsButtonText}>Browse Applicants</Text>
          </Pressable>
        </View>
      ) : applicants.map((item) => {
        const student = item.student ?? {};
        return (
          <View key={String(item.id)} style={styles.card}>
            <View style={styles.cardHeader}>
              <CandidateAvatar item={item} />
              <View style={styles.candidateCopy}>
                <Text style={styles.name} numberOfLines={1}>{student.name || "Candidate"}</Text>
                <Text style={styles.headline} numberOfLines={2}>{student.headline || "Candidate"}</Text>
              </View>
              <View style={styles.shortlistedBadge}><Ionicons name="bookmark" size={11} color={C.accentHover} /><Text style={styles.shortlistedText}>{item.status || "Shortlisted"}</Text></View>
            </View>

            {!!item.job?.title && <View style={styles.infoRow}><Ionicons name="briefcase-outline" size={15} color={C.textMuted} /><Text style={styles.infoText}>{item.job.title}</Text></View>}
            {!!student.university && <View style={styles.infoRow}><Ionicons name="school-outline" size={15} color={C.textMuted} /><Text style={styles.infoText}>{[student.university, student.major].filter(Boolean).join(" · ")}</Text></View>}
            {!!student.email && <View style={styles.infoRow}><Ionicons name="mail-outline" size={15} color={C.textMuted} /><Text style={styles.infoText} numberOfLines={1}>{student.email}</Text></View>}

            <View style={styles.cardFooter}>
              <Pressable style={styles.removeButton} onPress={() => remove(item)}><Ionicons name="bookmark-outline" size={14} color={C.error} /><Text style={styles.removeText}>Remove</Text></Pressable>
              <Pressable
                style={styles.viewButton}
                onPress={() => router.push({ pathname: "/company/CandidateDetails", params: { id: String(item.id) } })}
              >
                <Text style={styles.viewText}>View Profile</Text><Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg }, content: { padding: 16, paddingBottom: 40 }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: C.bg, padding: 24 }, loadingText: { color: C.textSec, fontSize: 12, fontFamily: F }, backRow: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 7, marginBottom: 16 }, backText: { color: C.text, fontSize: 12, fontWeight: "700", fontFamily: F }, header: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 18 }, headerIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" }, headerCopy: { flex: 1 }, heading: { color: C.text, fontSize: 22, fontWeight: "900", fontFamily: F }, subtitle: { color: C.textSec, fontSize: 11, lineHeight: 16, marginTop: 3, fontFamily: F }, countBadge: { minWidth: 34, height: 34, borderRadius: 17, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }, countText: { color: C.text, fontSize: 13, fontWeight: "900", fontFamily: F },
  card: { backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 17, padding: 15, marginBottom: 12 }, cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 11 }, avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" }, avatarImage: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#F1F5F9" }, avatarText: { color: C.accentHover, fontSize: 18, fontWeight: "900", fontFamily: F }, candidateCopy: { flex: 1 }, name: { color: C.text, fontSize: 15, fontWeight: "800", fontFamily: F }, headline: { color: C.textSec, fontSize: 11, lineHeight: 16, marginTop: 4, fontFamily: F }, shortlistedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.accentLight, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 }, shortlistedText: { color: C.accentHover, fontSize: 9, fontWeight: "800", fontFamily: F }, infoRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 11 }, infoText: { flex: 1, color: C.textSec, fontSize: 11, fontFamily: F }, cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: C.divider }, removeButton: { minHeight: 39, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8 }, removeText: { color: C.error, fontSize: 11, fontWeight: "800", fontFamily: F }, viewButton: { minHeight: 39, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 13 }, viewText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", fontFamily: F },
  emptyCard: { alignItems: "center", backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 18, paddingHorizontal: 24, paddingVertical: 38 }, emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" }, emptyTitle: { color: C.text, fontSize: 16, fontWeight: "800", marginTop: 15, fontFamily: F }, emptyText: { color: C.textSec, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 7, fontFamily: F }, applicantsButton: { minHeight: 42, justifyContent: "center", backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 16, marginTop: 18 }, applicantsButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", fontFamily: F },
});
