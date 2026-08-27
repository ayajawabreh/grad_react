import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { C, F } from "../../constants/tokens";
import { useSavedJobs } from "../../context/SavedJobsContext";

interface Job {
  id: string | number;
  title?: string;
  company?:
    | string
    | {
        id?: string | number;
        name?: string;
        company_name?: string;
      };
  location?: string;
  salary?: string | number;
  employment_type?: string;
  work_mode?: string;
  description?: string;
  saved?: boolean;
  match?: number;
}

function JobCard({
  job,
  onView,
  onSave,
}: {
  job: Job;
  onView: () => void;
  onSave: (
    id: string | number,
    isSavedNow: boolean
  ) => void;
}) {
  const [saved, setSaved] = useState(
    job.saved ?? true
  );

  const companyName =
    typeof job.company === "string"
      ? job.company
      : job.company?.company_name || job.company?.name || "Unknown Company";

  const salary = job.salary != null && job.salary !== "" && !Number.isNaN(Number(job.salary))
    ? `$${Number(job.salary).toLocaleString()}`
    : job.salary || "Competitive";

  const handleSave = () => {
    const nextSaved = !saved;

    setSaved(nextSaved);
    onSave(job.id, nextSaved);
  };

  return (
    <View style={styles.jobCard}>
      <View style={styles.jobTop}>
        <View style={styles.companyLogo}>
          <Text style={styles.companyLogoText}>
            {companyName
              ? companyName.charAt(0).toUpperCase()
              : "?"}
          </Text>
        </View>

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.saveIcon,
              saved && styles.saveIconActive,
            ]}
          >
            {saved ? "♥" : "♡"}
          </Text>
        </Pressable>
      </View>

      <Text
        style={styles.jobTitle}
        numberOfLines={2}
      >
        {job.title || "Untitled Job"}
      </Text>

      {!!companyName && (
        <Text
          style={styles.company}
          numberOfLines={1}
        >
          {companyName}
        </Text>
      )}

      {!!job.location && (
        <Text
          style={styles.location}
          numberOfLines={1}
        >
          📍 {job.location}
        </Text>
      )}

      <View style={styles.detailsRow}>
        {!!job.employment_type && (
          <View style={styles.detailBadge}>
            <Text style={styles.detailText}>
              {job.employment_type}
            </Text>
          </View>
        )}

        {!!job.work_mode && (
          <View style={styles.detailBadge}>
            <Text style={styles.detailText}>
              {job.work_mode}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.salary}>{salary}</Text>

      <Pressable
        onPress={onView}
        style={({ pressed }) => [
          styles.viewButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.viewButtonText}>
          View Job
        </Text>
      </Pressable>
    </View>
  );
}

export default function SavedJobs() {
  const router = useRouter();
  const { jobs, loading, error, refreshSavedJobs: load, setJobSaved } = useSavedJobs();

  function handleToggleSave(
    jobId: string | number,
    isSavedNow: boolean
  ) {
    void setJobSaved(jobId, isSavedNow).catch(() => {
      // The provider restores the authoritative list when the request fails.
    });
  }

  function handleViewJob(
    jobId: string | number
  ) {
    router.push({
      pathname: "/(student)/JobDetails",
      params: {
        id: String(jobId),
        from: "saved",
      },
    } as any);
  }

  function handleBrowseJobs() {
    router.push(
      "/(student)/JobDiscovery" as any
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Saved Jobs</Text>
          {!loading && <View style={styles.countBadge}><Text style={styles.countText}>{jobs.length}</Text></View>}
        </View>

        <Text style={styles.subtitle}>
          Jobs you saved for later
        </Text>
      </View>

      {loading ? (
        <View style={styles.messageCard}>
          <ActivityIndicator
            size="small"
            color={C.accent}
          />

          <Text style={styles.messageText}>
            Loading...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.messageCard}>
          <Text style={styles.errorText}>
            {error}
          </Text>

          <Pressable
            onPress={load}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.retryText}>
              Try Again
            </Text>
          </Pressable>
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.messageCard}>
          <Text style={styles.emptyIcon}>
            ♡
          </Text>

          <Text style={styles.emptyTitle}>
            No Saved Jobs
          </Text>

          <Text style={styles.messageText}>
            No saved jobs yet. Browse jobs
            and save ones you like!
          </Text>

          <Pressable
            onPress={handleBrowseJobs}
            style={({ pressed }) => [
              styles.browseButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.browseButtonText}>
              Browse Jobs
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.jobsGrid}>
          {jobs.map((job) => (
            <JobCard
              key={String(job.id)}
              job={job}
              onView={() =>
                handleViewJob(job.id)
              }
              onSave={(
                id,
                isSavedNow
              ) =>
                handleToggleSave(
                  id,
                  isSavedNow
                )
              }
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 24,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  countBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.accentLight,
  },

  countText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "800",
    color: C.accent,
  },

  title: {
    fontFamily: F,
    fontSize: 24,
    fontWeight: "900",
    color: C.text,
  },

  subtitle: {
    marginTop: 6,
    fontFamily: F,
    fontSize: 13,
    color: C.textSec,
  },

  jobsGrid: {
    gap: 16,
  },

  jobCard: {
    width: "100%",
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  jobTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  companyLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },

  companyLogoText: {
    fontFamily: F,
    fontSize: 17,
    fontWeight: "800",
    color: C.accent,
  },

  saveButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
  },

  saveIcon: {
    fontSize: 21,
    color: C.textSec,
  },

  saveIconActive: {
    color: C.accent,
  },

  jobTitle: {
    fontFamily: F,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    color: C.text,
  },

  company: {
    fontFamily: F,
    fontSize: 13,
    color: C.textSec,
    marginTop: 5,
  },

  location: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    marginTop: 8,
  },

  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12,
  },

  detailBadge: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },

  detailText: {
    fontFamily: F,
    fontSize: 10,
    fontWeight: "600",
    color: C.textSec,
  },

  salary: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "700",
    color: C.success,
    marginTop: 12,
  },

  viewButton: {
    marginTop: 16,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  viewButtonText: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  messageCard: {
    width: "100%",
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  messageText: {
    marginTop: 10,
    fontFamily: F,
    fontSize: 13,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },

  errorText: {
    fontFamily: F,
    fontSize: 13,
    color: C.error,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: C.accent,
  },

  retryText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  emptyIcon: {
    fontSize: 42,
    color: C.accent,
    marginBottom: 8,
  },

  emptyTitle: {
    fontFamily: F,
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
  },

  browseButton: {
    marginTop: 18,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: C.accent,
  },

  browseButtonText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  pressed: {
    opacity: 0.7,
  },
});
