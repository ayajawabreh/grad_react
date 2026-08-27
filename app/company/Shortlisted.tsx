import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { C, F } from "../../constants/tokens";
import { getShortlistedApplicants } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

function unwrapApplicants(value: any): any[] {
  const result = value?.data?.data ?? value?.data ?? value?.applicants ?? value ?? [];
  return Array.isArray(result) ? result : [];
}

function candidateFrom(item: any) {
  const student = item.student ?? item.user ?? item.applicant ?? {};
  const name = student.name ?? item.name ?? "Candidate";
  return {
    id: item.application_id ?? item.id ?? student.id,
    name,
    email: student.email ?? item.email ?? "",
    headline: student.headline ?? student.major ?? item.headline ?? "Shortlisted candidate",
    university: student.university ?? item.university ?? "",
    match: Number(item.match_score ?? item.match ?? item.ai_match_score ?? 0),
    status: item.status ?? "Shortlisted",
  };
}

export default function Shortlisted() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (!id) {
      setApplicants([]);
      setLoading(false);
      return;
    }
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      setApplicants(unwrapApplicants(await getShortlistedApplicants(Number(id))));
    } catch {
      Alert.alert("Unable to load candidates", "Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);
  useSyncRefresh("applications", () => load(false));

  useEffect(() => { void load(); }, [load]);

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
        const candidate = candidateFrom(item);
        return (
          <View key={String(candidate.id)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{candidate.name.charAt(0).toUpperCase()}</Text></View>
              <View style={styles.candidateCopy}>
                <Text style={styles.name} numberOfLines={1}>{candidate.name}</Text>
                <Text style={styles.headline} numberOfLines={2}>{candidate.headline}</Text>
              </View>
              <View style={styles.shortlistedBadge}><Ionicons name="bookmark" size={11} color={C.accentHover} /><Text style={styles.shortlistedText}>{candidate.status}</Text></View>
            </View>

            {!!candidate.university && <View style={styles.infoRow}><Ionicons name="school-outline" size={15} color={C.textMuted} /><Text style={styles.infoText}>{candidate.university}</Text></View>}
            {!!candidate.email && <View style={styles.infoRow}><Ionicons name="mail-outline" size={15} color={C.textMuted} /><Text style={styles.infoText} numberOfLines={1}>{candidate.email}</Text></View>}

            <View style={styles.cardFooter}>
              <View style={styles.matchBadge}><Ionicons name="sparkles-outline" size={14} color={C.accentHover} /><Text style={styles.matchText}>{candidate.match}% match</Text></View>
              <Pressable
                style={styles.viewButton}
                onPress={() => router.push({ pathname: "/company/CandidateDetails", params: { id: String(candidate.id) } })}
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
  card: { backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 17, padding: 15, marginBottom: 12 }, cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 11 }, avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" }, avatarText: { color: C.accentHover, fontSize: 18, fontWeight: "900", fontFamily: F }, candidateCopy: { flex: 1 }, name: { color: C.text, fontSize: 15, fontWeight: "800", fontFamily: F }, headline: { color: C.textSec, fontSize: 11, lineHeight: 16, marginTop: 4, fontFamily: F }, shortlistedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.accentLight, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 }, shortlistedText: { color: C.accentHover, fontSize: 9, fontWeight: "800", fontFamily: F }, infoRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 11 }, infoText: { flex: 1, color: C.textSec, fontSize: 11, fontFamily: F }, cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: C.divider }, matchBadge: { flexDirection: "row", alignItems: "center", gap: 5 }, matchText: { color: C.accentHover, fontSize: 11, fontWeight: "800", fontFamily: F }, viewButton: { minHeight: 39, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 13 }, viewText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", fontFamily: F },
  emptyCard: { alignItems: "center", backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 18, paddingHorizontal: 24, paddingVertical: 38 }, emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" }, emptyTitle: { color: C.text, fontSize: 16, fontWeight: "800", marginTop: 15, fontFamily: F }, emptyText: { color: C.textSec, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 7, fontFamily: F }, applicantsButton: { minHeight: 42, justifyContent: "center", backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 16, marginTop: 18 }, applicantsButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", fontFamily: F },
});
