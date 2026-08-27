import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Search,
  SlidersHorizontal,
  Check,
} from "lucide-react-native";

import { C, F } from "../../constants/tokens";
import {
  fetchJobs,
  type UiJob,
} from "../../imports/jobs";
import { useSyncRefresh } from "../../context/SyncContext";
import { useSavedJobs } from "../../context/SavedJobsContext";
import { useApplications } from "../../context/ApplicationsContext";

const JOB_TYPES = [
  "Full-Time",
  "Part-Time",
  "Internship",
  "Contract",
];

const WORK_MODES = [
  "Remote",
  "Hybrid",
  "On-site",
];

export default function JobDiscovery() {
  const router = useRouter();
  const { savedJobIds, setJobSaved } = useSavedJobs();
  const { appliedJobIds } = useApplications();

  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);
  const [jobs, setJobs] = useState<UiJob[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const toggle = (
    arr: string[],
    setArr: (value: string[]) => void,
    value: string
  ) => {
    setArr(
      arr.includes(value)
        ? arr.filter((item) => item !== value)
        : [...arr, value]
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs();
    }, 400);

    return () => clearTimeout(timer);
  }, [query, types, modes]);

  useEffect(() => {
    setJobs((current) => current.map((job) => ({
      ...job,
      saved: savedJobIds.has(String(job.id)),
      applied: appliedJobIds.has(String(job.id)),
    })));
  }, [appliedJobIds, savedJobIds]);

  async function loadJobs() {
    setLoading(true);
    setError("");

    try {
      const res = await fetchJobs({
        search: query || undefined,
        types: types.length ? types : undefined,
        modes: modes.length ? modes : undefined,
      });

      setJobs((res.jobs ?? []).map((job) => ({
        ...job,
        saved: savedJobIds.has(String(job.id)),
        applied: appliedJobIds.has(String(job.id)),
      })));
      setTotal(res.total ?? 0);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status !== 409) {
        console.warn("Failed to load jobs:", err?.message ?? err);
      }
      setError(
        status === 409
          ? (err?.response?.data?.message ?? "Jobs are being updated. Please try again.")
          : "Failed to load jobs, please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleSave(job: UiJob) {
    setJobs((prev) =>
      prev.map((item) =>
        item.id === job.id
          ? {
              ...item,
              saved: !item.saved,
            }
          : item
      )
    );

    try {
      await setJobSaved(job.id, !job.saved);
    } catch (err: any) {
      // Saving and unsaving are idempotent from the UI's perspective. A 409
      // means the server is already in the requested state, so keep the
      // optimistic state and avoid raising a development LogBox error.
      if (err?.response?.status === 409) return;

      console.warn("Failed to update saved job:", err?.message ?? err);

      setJobs((prev) =>
        prev.map((item) =>
          item.id === job.id
            ? {
                ...item,
                saved: job.saved,
              }
            : item
        )
      );
    }
  }

  useSyncRefresh("jobs", loadJobs);

  const clearFilters = () => {
    setTypes([]);
    setModes([]);
  };

  const activeFiltersCount = types.length + modes.length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Find Jobs</Text>

          <Text style={styles.subtitle}>
            Discover opportunities that match your career goals
          </Text>

          <Text style={styles.total}>
            {total}{" "}
            {total === 1 ? "opportunity" : "opportunities"} available
          </Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search
              size={18}
              color={C.textMuted}
              style={styles.searchIcon}
            />

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search jobs or companies..."
              placeholderTextColor={C.textMuted}
              style={styles.searchInput}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>

          <Pressable
            onPress={() => setShowFilters((prev) => !prev)}
            style={[
              styles.filterButton,
              showFilters && styles.filterButtonActive,
            ]}
          >
            <SlidersHorizontal
              size={17}
              color={
                showFilters
                  ? C.accent
                  : C.text
              }
            />

            <Text
              style={[
                styles.filterButtonText,
                showFilters && styles.filterButtonTextActive,
              ]}
            >
              Filters
            </Text>

            {activeFiltersCount > 0 && (
              <View style={styles.filterCount}>
                <Text style={styles.filterCountText}>
                  {activeFiltersCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {showFilters && (
          <View style={styles.filterPanel}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>

              {activeFiltersCount > 0 && (
                <Pressable onPress={clearFilters}>
                  <Text style={styles.clearText}>
                    Clear All
                  </Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.filterSectionTitle}>
              Job Type
            </Text>

            <View style={styles.filterOptions}>
              {JOB_TYPES.map((type) => {
                const selected = types.includes(type);

                return (
                  <Pressable
                    key={type}
                    onPress={() =>
                      toggle(types, setTypes, type)
                    }
                    style={[
                      styles.filterOption,
                      selected && styles.filterOptionSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        selected && styles.checkboxSelected,
                      ]}
                    >
                      {selected && (
                        <Check
                          size={13}
                          color="#FFFFFF"
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.filterOptionText,
                        selected &&
                          styles.filterOptionTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.divider} />

            <Text style={styles.filterSectionTitle}>
              Work Mode
            </Text>

            <View style={styles.filterOptions}>
              {WORK_MODES.map((mode) => {
                const selected = modes.includes(mode);

                return (
                  <Pressable
                    key={mode}
                    onPress={() =>
                      toggle(modes, setModes, mode)
                    }
                    style={[
                      styles.filterOption,
                      selected && styles.filterOptionSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        selected && styles.checkboxSelected,
                      ]}
                    >
                      {selected && (
                        <Check
                          size={13}
                          color="#FFFFFF"
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.filterOptionText,
                        selected &&
                          styles.filterOptionTextSelected,
                      ]}
                    >
                      {mode}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator
              size="small"
              color={C.accent}
            />

            <Text style={styles.stateText}>
              Loading jobs...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              onPress={loadJobs}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : jobs.length === 0 ? (
          <View style={styles.stateContainer}>
            <View style={styles.emptyIcon}>
              <Search
                size={24}
                color={C.textMuted}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No jobs found
            </Text>

            <Text style={styles.emptyText}>
              No jobs match your current search and filters.
            </Text>

            {(query ||
              types.length > 0 ||
              modes.length > 0) && (
              <Pressable
                onPress={() => {
                  setQuery("");
                  clearFilters();
                }}
                style={styles.clearSearchButton}
              >
                <Text style={styles.clearSearchText}>
                  Clear Search & Filters
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.jobsContainer}>
            {jobs.map((job) => {
              const activeColor =
                job.color || C.accent;

              return (
                <Pressable
                  key={job.id}
                  onPress={() =>
                    router.push(
                      `/(student)/JobDetails?id=${job.id}&from=browse`
                    )
                  }
                  style={({ pressed }) => [
                    styles.jobCard,
                    pressed && styles.jobCardPressed,
                  ]}
                >
                  <View style={styles.jobTopRow}>
                    <View
                      style={[
                        styles.companyIcon,
                        {
                          backgroundColor: `${activeColor}18`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.companyLetter,
                          {
                            color: activeColor,
                          },
                        ]}
                      >
                        {job.company
                          ?.charAt(0)
                          ?.toUpperCase() || "C"}
                      </Text>
                    </View>

                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        handleToggleSave(job);
                      }}
                      hitSlop={8}
                      style={styles.saveButton}
                    >
                      <Text
                        style={[
                          styles.heart,
                          job.saved &&
                            styles.heartSaved,
                        ]}
                      >
                        {job.saved ? "♥" : "♡"}
                      </Text>
                    </Pressable>
                  </View>

                  <Text
                    style={styles.jobTitle}
                    numberOfLines={2}
                  >
                    {job.title}
                  </Text>

                  <Text
                    style={styles.companyText}
                    numberOfLines={1}
                  >
                    {job.company}
                    {job.dept
                      ? ` · ${job.dept}`
                      : ""}
                  </Text>

                  <View style={styles.badgesRow}>
                    {job.type && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {job.type}
                        </Text>
                      </View>
                    )}

                    {job.mode && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {job.mode}
                        </Text>
                      </View>
                    )}

                    {job.level && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {job.level}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.jobInfoRow}>
                    {job.location && (
                      <Text
                        style={styles.infoText}
                        numberOfLines={1}
                      >
                        📍 {job.location}
                      </Text>
                    )}

                    {job.salary && (
                      <Text
                        style={styles.infoText}
                        numberOfLines={1}
                      >
                        💰 {job.salary}
                      </Text>
                    )}
                  </View>

                  {job.tags &&
                    job.tags.length > 0 && (
                      <View style={styles.skillsRow}>
                        {job.tags
                          .slice(0, 4)
                          .map((tag) => (
                            <View
                              key={tag}
                              style={styles.skillBadge}
                            >
                              <Text
                                style={styles.skillText}
                              >
                                {tag}
                              </Text>
                            </View>
                          ))}

                        {job.tags.length > 4 && (
                          <Text
                            style={styles.moreSkills}
                          >
                            +{job.tags.length - 4}
                          </Text>
                        )}
                      </View>
                    )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.postedText}>
                      {job.posted || "Recently posted"}
                    </Text>

                    <Text style={styles.viewText}>
                      View Details →
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 22,
  },

  title: {
    fontFamily: F,
    fontSize: 26,
    fontWeight: "900",
    color: C.text,
  },

  subtitle: {
    fontFamily: F,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: C.textSec,
  },

  total: {
    fontFamily: F,
    marginTop: 8,
    fontSize: 12,
    color: C.textMuted,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 16,
  },

  searchContainer: {
    flex: 1,
    height: 46,
    position: "relative",
    justifyContent: "center",
  },

  searchIcon: {
    position: "absolute",
    left: 14,
    zIndex: 2,
  },

  searchInput: {
    width: "100%",
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    color: C.text,
    fontFamily: F,
    fontSize: 13,
    paddingLeft: 42,
    paddingRight: 12,
  },

  filterButton: {
    height: 46,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  filterButtonActive: {
    borderColor: C.accent,
    backgroundColor: C.accentLight,
  },

  filterButtonText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
    color: C.text,
  },

  filterButtonTextActive: {
    color: C.accent,
  },

  filterCount: {
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  filterCountText: {
    fontFamily: F,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  filterPanel: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 18,
  },

  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  filterTitle: {
    fontFamily: F,
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
  },

  clearText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
    color: C.accent,
  },

  filterSectionTitle: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
    marginBottom: 10,
  },

  filterOptions: {
    gap: 9,
  },

  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 5,
  },

  filterOptionSelected: {
    opacity: 1,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxSelected: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },

  filterOptionText: {
    fontFamily: F,
    fontSize: 12.5,
    color: C.textSec,
  },

  filterOptionTextSelected: {
    color: C.text,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: C.divider,
    marginVertical: 18,
  },

  stateContainer: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    minHeight: 220,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  stateText: {
    fontFamily: F,
    marginTop: 12,
    fontSize: 13,
    color: C.textSec,
  },

  errorText: {
    fontFamily: F,
    fontSize: 13,
    color: C.error,
    textAlign: "center",
    marginBottom: 16,
  },

  retryButton: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  retryText: {
    fontFamily: F,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.divider,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontFamily: F,
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    marginBottom: 6,
  },

  emptyText: {
    fontFamily: F,
    fontSize: 13,
    color: C.textSec,
    textAlign: "center",
    lineHeight: 20,
  },

  clearSearchButton: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },

  clearSearchText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
    color: C.accent,
  },

  jobsContainer: {
    gap: 14,
  },

  jobCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: C.border,
  },

  jobCardPressed: {
    opacity: 0.75,
  },

  jobTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  companyLetter: {
    fontFamily: F,
    fontSize: 19,
    fontWeight: "800",
  },

  saveButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  heart: {
    fontSize: 23,
    color: C.textSec,
    lineHeight: 25,
  },

  heartSaved: {
    color: C.accent,
  },

  jobTitle: {
    fontFamily: F,
    fontSize: 17,
    fontWeight: "800",
    color: C.text,
    lineHeight: 22,
    marginBottom: 5,
  },

  companyText: {
    fontFamily: F,
    fontSize: 12.5,
    color: C.textSec,
    marginBottom: 12,
  },

  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 13,
  },

  badge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: C.divider,
  },

  badgeText: {
    fontFamily: F,
    fontSize: 10.5,
    fontWeight: "600",
    color: C.textSec,
  },

  jobInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },

  infoText: {
    flexShrink: 1,
    fontFamily: F,
    fontSize: 11.5,
    color: C.textSec,
  },

  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginBottom: 15,
  },

  skillBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: C.accentLight,
  },

  skillText: {
    fontFamily: F,
    fontSize: 10.5,
    fontWeight: "600",
    color: C.accentHover,
  },

  moreSkills: {
    fontFamily: F,
    fontSize: 10.5,
    fontWeight: "600",
    color: C.textMuted,
  },

  cardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  postedText: {
    fontFamily: F,
    fontSize: 11,
    color: C.textMuted,
  },

  viewText: {
    fontFamily: F,
    fontSize: 11.5,
    fontWeight: "700",
    color: C.accent,
  },
});
