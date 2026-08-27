import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, F } from "../../constants/tokens";
import { API, getAdminApplications } from "../../imports/api";

type Application = {
  id: number;
  application_id?: number;
  name?: string;
  email?: string;
  applied_at?: string;
  job_id?: number;
  job_post_id?: number;
  job_title?: string;
  status?: string;
  created_at?: string;
  student_name?: string;
  applicant_name?: string;
  student?: { id?: number; name?: string; email?: string };
  applicant?: { id?: number; name?: string; email?: string };
  job?: { id?: number; job_id?: number; title?: string } | string;
  job_post?: { id?: number; title?: string };
};

const applicantName = (item: Application) =>
  item.name ?? item.student?.name ?? item.applicant?.name ?? item.student_name ?? item.applicant_name ?? "Unnamed applicant";

const applicantEmail = (item: Application) =>
  item.email ?? item.student?.email ?? item.applicant?.email ?? "No email provided";

const applicationDate = (value?: string) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const extractApplications = (value: any): Application[] => {
  const payload = value?.data ?? value ?? {};
  const candidates = [
    payload,
    payload?.applications,
    payload?.applicants,
    payload?.recent_applicants,
    payload?.items,
    payload?.data,
    payload?.data?.data,
    payload?.data?.applications,
    payload?.data?.applicants,
  ];
  return candidates.find(Array.isArray) ?? [];
};

const belongsToJob = (item: Application, selectedJobId: string, selectedJobTitle?: string) => {
  const jobObject = typeof item.job === "object" ? item.job : undefined;
  const applicationJobId =
    item.job_id ??
    item.job_post_id ??
    jobObject?.id ??
    jobObject?.job_id ??
    item.job_post?.id;
  if (applicationJobId != null) return String(applicationJobId) === String(selectedJobId);
  const applicationJobTitle = item.job_title ?? jobObject?.title ?? (typeof item.job === "string" ? item.job : undefined);
  return Boolean(selectedJobTitle && applicationJobTitle && applicationJobTitle.trim().toLowerCase() === selectedJobTitle.trim().toLowerCase());
};

export default function AdminJobApplicants() {
  const { jobId, jobTitle } = useLocalSearchParams<{ jobId: string; jobTitle?: string }>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [applicationsResult, detailsResult, jobApplicantsResult, jobApplicationsResult] = await Promise.allSettled([
        getAdminApplications(),
        API.get(`/admin/jobs/${jobId}/moderation`),
        API.get(`/admin/jobs/${jobId}/applicants`),
        API.get(`/admin/jobs/${jobId}/applications`),
      ]);

      const allApplications = applicationsResult.status === "fulfilled"
        ? extractApplications(applicationsResult.value)
        : [];
      const matchingApplications = allApplications.filter(item => belongsToJob(item, jobId, jobTitle));

      const details = detailsResult.status === "fulfilled"
        ? detailsResult.value?.data?.job ?? detailsResult.value?.data?.data ?? detailsResult.value?.data
        : null;
      const scopedApplicants = extractApplications({
        applicants:
          details?.applicants ??
          details?.recent_applicants ??
          details?.applications,
      });

      const endpointApplicants = [jobApplicantsResult, jobApplicationsResult].flatMap(result =>
        result.status === "fulfilled" ? extractApplications(result.value) : [],
      );

      const merged = [...matchingApplications, ...scopedApplicants, ...endpointApplicants].filter(
        (item, index, array) => {
          const identifier = item.application_id ?? item.id;
          if (identifier == null) return true;
          return array.findIndex(candidate =>
            String(candidate.application_id ?? candidate.id) === String(identifier),
          ) === index;
        },
      );
      setItems(merged);
      setError("");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Could not load job applicants.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jobId, jobTitle]);

  useEffect(() => { void load(); }, [load]);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(false); }} />}
      >
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel="Back to job details"
            style={styles.iconButton}
            onPress={() => router.navigate({ pathname: "/admin/JobDetails" as any, params: { id: jobId } })}
          >
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Job Applicants</Text>
            <Text style={styles.subtitle} numberOfLines={2}>{jobTitle || "Selected job"}</Text>
          </View>
          <View style={styles.countBadge}><Text style={styles.countText}>{items.length}</Text></View>
        </View>

        {loading ? (
          <View style={styles.state}><ActivityIndicator color={C.accent} /><Text style={styles.stateText}>Loading applicants...</Text></View>
        ) : error ? (
          <View style={styles.state}><Ionicons name="cloud-offline-outline" size={34} color={C.error} /><Text style={styles.stateText}>{error}</Text><TouchableOpacity style={styles.retry} onPress={() => void load()}><Text style={styles.retryText}>Retry</Text></TouchableOpacity></View>
        ) : items.length === 0 ? (
          <View style={styles.state}><Ionicons name="people-outline" size={38} color={C.textMuted} /><Text style={styles.emptyTitle}>No applicants yet</Text><Text style={styles.stateText}>No students have applied for this job.</Text></View>
        ) : items.map((item, index) => (
          <View key={`application-${item.application_id ?? item.id ?? index}-${index}`} style={styles.card}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{applicantName(item).charAt(0).toUpperCase()}</Text></View>
            <View style={styles.cardCopy}>
              <Text style={styles.name}>{applicantName(item)}</Text>
              <Text style={styles.email}>{applicantEmail(item)}</Text>
              <Text style={styles.date}>Applied {applicationDate(item.applied_at ?? item.created_at)}</Text>
            </View>
            <View style={styles.status}><Text style={styles.statusText}>{item.status ?? "Applied"}</Text></View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:C.bg},content:{paddingHorizontal:16,paddingBottom:35},header:{minHeight:70,flexDirection:"row",alignItems:"center",gap:10,marginBottom:14},iconButton:{width:44,height:44,alignItems:"center",justifyContent:"center"},headerCopy:{flex:1},title:{fontFamily:F,fontSize:22,fontWeight:"900",color:C.text},subtitle:{fontFamily:F,fontSize:12,color:C.textSec,marginTop:3},countBadge:{minWidth:36,height:36,borderRadius:18,backgroundColor:C.accentLight,alignItems:"center",justifyContent:"center"},countText:{fontFamily:F,fontSize:13,fontWeight:"800",color:C.accent},card:{backgroundColor:C.surface,borderWidth:1,borderColor:C.border,borderRadius:15,padding:14,marginBottom:10,flexDirection:"row",alignItems:"center",gap:11},avatar:{width:46,height:46,borderRadius:13,backgroundColor:C.accentLight,alignItems:"center",justifyContent:"center"},avatarText:{fontFamily:F,fontSize:18,fontWeight:"900",color:C.accent},cardCopy:{flex:1},name:{fontFamily:F,fontSize:14,fontWeight:"800",color:C.text},email:{fontFamily:F,fontSize:11,color:C.textSec,marginTop:3},date:{fontFamily:F,fontSize:10,color:C.textMuted,marginTop:5},status:{paddingHorizontal:8,paddingVertical:6,borderRadius:99,backgroundColor:C.infoBg},statusText:{fontFamily:F,fontSize:9,fontWeight:"800",color:C.info},state:{minHeight:330,alignItems:"center",justifyContent:"center",gap:10,paddingHorizontal:25},stateText:{fontFamily:F,fontSize:12,lineHeight:18,color:C.textSec,textAlign:"center"},emptyTitle:{fontFamily:F,fontSize:16,fontWeight:"800",color:C.text},retry:{backgroundColor:C.accent,borderRadius:10,paddingHorizontal:18,paddingVertical:10},retryText:{fontFamily:F,fontSize:12,fontWeight:"800",color:"#fff"},
});
