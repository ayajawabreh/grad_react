import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  fetchApplicants,
  type UiApplicant,
  updateApplicationStatus,
} from "../../imports/applicants";

import { resolveMediaUrl, shortlistApplicant } from "../../imports/api";
import { fetchInterviews } from "../../imports/interviews";

import ScheduleInterviewModal from "./ScheduleInterviewModal";
import BulkScheduleModal from "./BulkScheduleModal";
import { useSyncRefresh } from "../../context/SyncContext";

const COLORS = {
  bg: "#F8F8F6",
  surface: "#FFFFFF",
  text: "#181B1F",
  textSec: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  divider: "#F1F2F4",

  accent: "#C8A46A",
  accentDark: "#A67C37",
  accentLight: "#F5EDD8",

  success: "#22C55E",
  successLight: "#ECFDF5",

  error: "#EF4444",
  errorLight: "#FEF2F2",

  purple: "#C8A46A",
};

function ApplicantAvatar({ applicant }: { applicant: UiApplicant }) {
  const [imageFailed, setImageFailed] = useState(false);
  const avatarUri = resolveMediaUrl(applicant.avatar);
  const initial = applicant.name?.trim()?.charAt(0)?.toUpperCase() || "?";

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUri]);

  if (!avatarUri || imageFailed) {
    return (
      <View style={styles.avatarFallback}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: avatarUri }}
      style={styles.avatar}
      resizeMode="cover"
      onError={() => setImageFailed(true)}
    />
  );
}

export default function Applicants() {
  const [query, setQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("All");

  const [candidates, setCandidates] = useState<UiApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedApplication, setSelectedApplication] =
    useState<number | null>(null);

  const [showSchedule, setShowSchedule] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set()
  );

  const [showBulkSchedule, setShowBulkSchedule] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadApplicants = useCallback(async () => {
    const [applicants, interviewsResponse] = await Promise.all([
      fetchApplicants(),
      fetchInterviews(),
    ]);
    const interviews = Array.isArray(interviewsResponse.data) ? interviewsResponse.data : [];
    const withInterviewStatuses = applicants.map((applicant) => {
      const related = interviews
        .filter((interview: any) =>
          String(interview.candidate_name ?? "").trim().toLowerCase() === applicant.name.trim().toLowerCase() &&
          String(interview.job_title ?? "").trim().toLowerCase() === applicant.job.trim().toLowerCase()
        )
        .sort((first: any, second: any) => Number(second.id ?? 0) - Number(first.id ?? 0))[0];
      return { ...applicant, interview_status: related?.status ?? null };
    });
    setCandidates(withInterviewStatuses);
    setError(null);
  }, []);

  useSyncRefresh(["applications", "interviews", "student", "resume"], async () => {
    try {
      await loadApplicants();
    } catch (err) {
      console.error(err);
    }
  });

  // --------------------------------------------------
  // Toast
  // --------------------------------------------------

  const showToast = (message: string) => {
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // --------------------------------------------------
  // Load applicants
  // --------------------------------------------------

  useFocusEffect(useCallback(() => {
    let mounted = true;

    loadApplicants()
      .catch((err) => {
        console.error(err);

        if (mounted) {
          setError("Failed to load applicants");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [loadApplicants]));

  // --------------------------------------------------
  // Filter
  // --------------------------------------------------

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    return candidates.filter((candidate) => {
      const matchQuery =
        !q ||
        candidate.name.toLowerCase().includes(q) ||
        candidate.title.toLowerCase().includes(q) ||
        candidate.job.toLowerCase().includes(q);

      const matchJob =
        jobFilter === "All" ||
        candidate.job === jobFilter;

      return matchQuery && matchJob;
    });
  }, [candidates, query, jobFilter]);

  // --------------------------------------------------
  // Job filters
  // --------------------------------------------------

  const jobOptions = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(candidates.map((candidate) => candidate.job))
      ),
    ];
  }, [candidates]);

  // --------------------------------------------------
  // Selection
  // --------------------------------------------------

  const toggleSelect = (applicationId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(applicationId)) {
        next.delete(applicationId);
      } else {
        next.add(applicationId);
      }

      return next;
    });
  };

  const isAllSelected =
    filtered.length > 0 &&
    filtered.every((candidate) =>
      selectedIds.has(candidate.application_id)
    );

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        new Set(
          filtered.map(
            (candidate) => candidate.application_id
          )
        )
      );
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // --------------------------------------------------
  // Bulk shortlist
  // --------------------------------------------------

  const handleBulkShortlist = async () => {
    try {
      setBulkLoading(true);

      await Promise.all(
        Array.from(selectedIds).map((id) =>
          shortlistApplicant(id)
        )
      );

      clearSelection();

      router.push("/company/Shortlisted");

    } catch (err) {
      console.error(err);

      showToast(
        "Failed to shortlist some candidates"
      );
    } finally {
      setBulkLoading(false);
    }
  };

  // --------------------------------------------------
  // Bulk reject
  // --------------------------------------------------

  const handleBulkReject = () => {
    Alert.alert(
      "Reject Candidates",
      `Reject ${selectedIds.size} candidate(s)?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reject",
          style: "destructive",

          onPress: async () => {
            try {
              setBulkLoading(true);

              await Promise.all(
                Array.from(selectedIds).map((id) =>
                  updateApplicationStatus(
                    id,
                    "Rejected"
                  )
                )
              );

              setCandidates((prev) =>
                prev.map((candidate) =>
                  selectedIds.has(
                    candidate.application_id
                  )
                    ? {
                        ...candidate,
                        status: "Rejected",
                      }
                    : candidate
                )
              );

              showToast(
                "Selected candidates have been rejected."
              );

              clearSelection();

            } catch (err) {
              console.error(err);

              showToast(
                "Failed to reject some candidates"
              );
            } finally {
              setBulkLoading(false);
            }
          },
        },
      ]
    );
  };

  // --------------------------------------------------
  // Bulk schedule success
  // --------------------------------------------------

  const handleBulkScheduleSuccess = () => {
    clearSelection();

    showToast(
      "Interviews scheduled successfully"
    );

    router.push("/company/Interviews");
  };

  // --------------------------------------------------
  // Candidate actions
  // --------------------------------------------------

  const handleViewCandidate = (
    candidate: UiApplicant
  ) => {
    router.push({
      pathname: "/company/CandidateDetails",
      params: { id: String(candidate.application_id) },
    });
  };

  const handleShortlist = async (
    candidate: UiApplicant
  ) => {
    try {
      await shortlistApplicant(candidate.application_id);

      setCandidates((prev) =>
        prev.map((c) =>
          c.application_id === candidate.application_id
            ? {
                ...c,
                status: "Shortlisted",
              }
            : c
        )
      );

      showToast(
        `${candidate.name} has been added to shortlist.`
      );

    } catch (error) {
      console.error(error);

      showToast(
        "Failed to shortlist candidate."
      );
    }
  };

  const handleInterview = (
    candidate: UiApplicant
  ) => {
    console.log(
      "Selected application:",
      candidate.application_id,
      candidate
    );

    setSelectedApplication(
      candidate.application_id ?? candidate.id
    );

    setShowSchedule(true);
  };

  const handleReject = async (
    candidate: UiApplicant
  ) => {
    try {
      await updateApplicationStatus(
        candidate.application_id,
        "Rejected"
      );

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidate.id
            ? {
                ...c,
                status: "Rejected",
              }
            : c
        )
      );

      showToast(
        `${candidate.name} has been rejected. Candidate notification processed.`
      );

    } catch (error: any) {
      console.error(error);

      showToast(
        error?.response?.data?.message ?? "Failed to reject candidate."
      );
    }
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={COLORS.accent}
        />

        <Text style={styles.loadingText}>
          Loading applicants...
        </Text>
      </View>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="alert-circle-outline"
          size={42}
          color={COLORS.error}
        />

        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);

            fetchApplicants()
              .then(setCandidates)
              .catch(() =>
                setError(
                  "Failed to load applicants"
                )
              )
              .finally(() =>
                setLoading(false)
              );
          }}
        >
          <Text style={styles.retryText}>
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  // --------------------------------------------------
  // Candidate card
  // --------------------------------------------------

  const renderCandidate = ({
    item,
  }: {
    item: UiApplicant;
  }) => {
    const selected = selectedIds.has(
      item.application_id
    );
    const displayedStatus = ["Accepted", "Rejected"].includes(item.status)
      ? item.status
      : item.interview_status || item.status;

    return (
      <View style={styles.card}>
        {/* Selection */}

        <Pressable
          style={styles.selectRow}
          onPress={() =>
            toggleSelect(item.application_id)
          }
        >
          <View
            style={[
              styles.checkbox,
              selected &&
                styles.checkboxSelected,
            ]}
          >
            {selected && (
              <Ionicons
                name="checkmark"
                size={14}
                color="#FFFFFF"
              />
            )}
          </View>

          <Text style={styles.selectText}>
            Select
          </Text>
        </Pressable>

        {/* Candidate info */}

        <Pressable
          onPress={() =>
            handleViewCandidate(item)
          }
          style={styles.candidateInfo}
        >
          <ApplicantAvatar applicant={item} />

          <View style={styles.infoContainer}>
            <Text
              style={styles.candidateName}
              numberOfLines={1}
            >
              {item.name}
            </Text>

            <Text
              style={styles.candidateTitle}
              numberOfLines={1}
            >
              {item.title}
            </Text>

            <Text
              style={styles.jobName}
              numberOfLines={1}
            >
              {item.job}
            </Text>
          </View>
        </Pressable>

        {/* Status */}

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              displayedStatus === "Shortlisted" &&
                styles.shortlistedBadge,
              ["Rejected", "Cancelled"].includes(displayedStatus) &&
                styles.rejectedBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                displayedStatus ===
                  "Shortlisted" &&
                  styles.shortlistedText,
                ["Rejected", "Cancelled"].includes(displayedStatus) &&
                  styles.rejectedText,
              ]}
            >
              {displayedStatus}
            </Text>
          </View>
        </View>

        {/* Actions */}

        <View style={styles.actions}>
          <Pressable
            style={styles.viewButton}
            onPress={() =>
              handleViewCandidate(item)
            }
          >
            <Ionicons
              name="eye-outline"
              size={16}
              color={COLORS.text}
            />

            <Text style={styles.viewButtonText}>
              View
            </Text>
          </Pressable>

          <Pressable
            style={styles.shortlistButton}
            onPress={() =>
              handleShortlist(item)
            }
          >
            <Ionicons
              name="bookmark-outline"
              size={16}
              color={COLORS.success}
            />

            <Text
              style={
                styles.shortlistButtonText
              }
            >
              Shortlist
            </Text>
          </Pressable>

          <Pressable
            style={styles.interviewButton}
            onPress={() =>
              handleInterview(item)
            }
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={COLORS.accentDark}
            />

            <Text
              style={styles.interviewText}
            >
              Interview
            </Text>
          </Pressable>

          <Pressable
            style={styles.rejectButton}
            onPress={() =>
              handleReject(item)
            }
          >
            <Ionicons
              name="close-circle-outline"
              size={16}
              color={COLORS.error}
            />
          </Pressable>
        </View>
      </View>
    );
  };

  // --------------------------------------------------
  // Main
  // --------------------------------------------------

  return (
    <View style={styles.container}>

      {/* Toast */}

      {toastMessage && (
        <View style={styles.toast}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={COLORS.success}
          />

          <Text style={styles.toastText}>
            {toastMessage}
          </Text>
        </View>
      )}

      {/* Header */}

      <View style={styles.header}>
        <Text style={styles.title}>
          Applicants
        </Text>

        <Text style={styles.subtitle}>
          {candidates.length} total candidates
        </Text>
      </View>

      {/* Search */}

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color={COLORS.textMuted}
        />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search candidates..."
          placeholderTextColor={
            COLORS.textMuted
          }
          style={styles.searchInput}
        />
      </View>

      {/* Job Filters */}

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={jobOptions}
          keyExtractor={(item) => item}
          contentContainerStyle={
            styles.filtersContent
          }
          renderItem={({ item: job }) => {
            const active =
              jobFilter === job;

            return (
              <Pressable
                onPress={() =>
                  setJobFilter(job)
                }
                style={[
                  styles.filterButton,
                  active &&
                    styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active &&
                      styles.filterTextActive,
                  ]}
                >
                  {job}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Select All */}

      <View style={styles.selectAllContainer}>
        <Pressable
          style={[
            styles.checkbox,
            isAllSelected &&
              styles.checkboxSelected,
          ]}
          onPress={toggleSelectAll}
          disabled={filtered.length === 0}
        >
          {isAllSelected && (
            <Ionicons
              name="checkmark"
              size={14}
              color="#FFFFFF"
            />
          )}
        </Pressable>

        <Pressable
          onPress={toggleSelectAll}
          disabled={filtered.length === 0}
        >
          <Text style={styles.selectAllText}>
            Select All
          </Text>
        </Pressable>

        {selectedIds.size > 0 && (
          <Text style={styles.selectedCount}>
            ({selectedIds.size} selected)
          </Text>
        )}
      </View>

      {/* Candidates */}

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="people-outline"
            size={48}
            color={COLORS.textMuted}
          />

          <Text style={styles.emptyTitle}>
            No applicants found
          </Text>

          <Text style={styles.emptyText}>
            Try changing your search or filter.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) =>
            String(item.id)
          }
          renderItem={renderCandidate}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            selectedIds.size > 0 &&
              styles.listWithActions,
          ]}
        />
      )}

      {/* Bulk Actions */}

      {selectedIds.size > 0 && (
        <View style={styles.bulkActions}>

          <View style={styles.bulkHeader}>
            <Text style={styles.bulkTitle}>
              {selectedIds.size} selected
            </Text>

            <Pressable
              onPress={clearSelection}
              disabled={bulkLoading}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={18}
                color={COLORS.textSec}
              />
            </Pressable>
          </View>

          <View style={styles.bulkButtons}>

            {/* Shortlist */}

            <Pressable
              disabled={bulkLoading}
              onPress={handleBulkShortlist}
              style={[
                styles.bulkButton,
                styles.bulkShortlist,
                bulkLoading &&
                  styles.disabledButton,
              ]}
            >
              <Ionicons
                name="bookmark-outline"
                size={17}
                color={COLORS.success}
              />

              <Text
                style={
                  styles.bulkShortlistText
                }
              >
                Shortlist
              </Text>
            </Pressable>

            {/* Schedule */}

            <Pressable
              disabled={bulkLoading}
              onPress={() =>
                setShowBulkSchedule(true)
              }
              style={[
                styles.bulkButton,
                styles.bulkSchedule,
                bulkLoading &&
                  styles.disabledButton,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={17}
                color={COLORS.text}
              />

              <Text
                style={styles.bulkScheduleText}
              >
                Schedule
              </Text>
            </Pressable>

            {/* Reject */}

            <Pressable
              disabled={bulkLoading}
              onPress={handleBulkReject}
              style={[
                styles.bulkButton,
                styles.bulkReject,
                bulkLoading &&
                  styles.disabledButton,
              ]}
            >
              <Ionicons
                name="close-circle-outline"
                size={17}
                color={COLORS.error}
              />

              <Text
                style={styles.bulkRejectText}
              >
                Reject
              </Text>
            </Pressable>

          </View>
        </View>
      )}

      {/* Single Interview Modal */}

      {showSchedule &&
        selectedApplication && (
          <ScheduleInterviewModal
            applicationId={
              selectedApplication
            }
            onClose={() => {
              setShowSchedule(false);
              setSelectedApplication(null);
            }}
            onSuccess={() => {
              showToast(
                "Interview scheduled successfully. Candidate notification processed."
              );
            }}
          />
        )}

      {/* Bulk Interview Modal */}

      {showBulkSchedule && (
        <BulkScheduleModal
          applicationIds={Array.from(
            selectedIds
          )}
          onClose={() =>
            setShowBulkSchedule(false)
          }
          onSuccess={
            handleBulkScheduleSuccess
          }
        />
      )}

    </View>
  );
}

// ======================================================
// Styles
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSec,
  },

  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSec,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.accentDark,
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.textSec,
  },

  searchContainer: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: COLORS.text,
  },

  filtersContainer: {
    marginBottom: 14,
  },

  filtersContent: {
    gap: 8,
  },

  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },

  filterButtonActive: {
    borderColor: COLORS.accentDark,
    backgroundColor: COLORS.accentLight,
  },

  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSec,
  },

  filterTextActive: {
    color: COLORS.accentDark,
  },

  selectAllContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 14,
  },

  selectAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },

  selectedCount: {
    fontSize: 12,
    color: COLORS.textSec,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },

  checkboxSelected: {
    backgroundColor: COLORS.accentDark,
    borderColor: COLORS.accentDark,
  },

  listContent: {
    paddingBottom: 20,
    gap: 12,
  },

  listWithActions: {
    paddingBottom: 170,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
  },

  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  selectText: {
    fontSize: 12,
    color: COLORS.textSec,
    fontWeight: "600",
  },

  candidateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F1F5F9",
  },

  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6D28D9",
  },

  infoContainer: {
    flex: 1,
  },

  candidateName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  candidateTitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textSec,
  },

  jobName: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  statusRow: {
    marginTop: 12,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: "#F3F4F6",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSec,
  },

  shortlistedBadge: {
    backgroundColor: COLORS.successLight,
  },

  shortlistedText: {
    color: COLORS.success,
  },

  rejectedBadge: {
    backgroundColor: COLORS.errorLight,
  },

  rejectedText: {
    color: COLORS.error,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
  },

  viewButton: {
    flex: 1,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 9,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  viewButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
  },

  shortlistButton: {
    flex: 1,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 9,
    backgroundColor: COLORS.successLight,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },

  shortlistButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.success,
  },

  interviewButton: {
    flex: 1,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 9,
    backgroundColor: COLORS.accentLight,
    borderWidth: 1,
    borderColor: "#E5D4B2",
  },

  interviewText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accentDark,
  },

  rejectButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: COLORS.errorLight,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  emptyText: {
    marginTop: 5,
    fontSize: 13,
    color: COLORS.textMuted,
  },

  toast: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },

  toastText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },

  bulkActions: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 100,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },

  bulkHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  bulkTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  bulkButtons: {
    flexDirection: "row",
    gap: 7,
  },

  bulkButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 10,
    borderWidth: 1,
  },

  bulkShortlist: {
    backgroundColor: COLORS.successLight,
    borderColor: "#A7F3D0",
  },

  bulkShortlistText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.success,
  },

  bulkSchedule: {
    backgroundColor: "#F3F4F6",
    borderColor: COLORS.border,
  },

  bulkScheduleText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
  },

  bulkReject: {
    backgroundColor: COLORS.errorLight,
    borderColor: "#FECACA",
  },

  bulkRejectText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.error,
  },

  disabledButton: {
    opacity: 0.5,
  },
});
