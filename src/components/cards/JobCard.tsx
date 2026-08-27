import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../../../constants/tokens";
import { API } from "../../../imports/api";
import { formatExperienceRange } from "../../../imports/jobs";
interface JobCardProps {
  job: any;
  onView: () => void;
  onSave?: (jobId: string, isSavedNow: boolean) => void;
  showMatch?: boolean;
}

export function JobCard({
  job,
  onView,
  onSave,
  showMatch = true,
}: JobCardProps) {
  const [isSaved, setIsSaved] = useState(
    Boolean(job?.saved || job?.is_saved)
  );

  const companyName =
    job?.company?.company_name ||
    job?.company ||
    job?.company_name ||
    "Tech Solutions Co.";

  const title = job?.title || "Untitled Job";

  const location = job?.location || "Amman, Jordan";

  const salary = job?.salary
    ? typeof job.salary === "number" || !isNaN(job.salary)
      ? `$${Number(job.salary).toLocaleString()}`
      : job.salary
    : "Competitive";

  const empType = String(
    job?.employment_type ||
      job?.type ||
      "Full-Time"
  )
    .replace("Full-time", "Full-Time")
    .replace("Part-time", "Part-Time");

  const workMode = String(
    job?.mode ||
      job?.work_mode ||
      "Hybrid"
  ).replace("On-site", "On-Site");

  const jobColor =
    job?.color || C.accent || "#7c3aed";

  const jobStatus = job?.status || "Open";

  const matchScore = job?.match ?? 0;

  const postedTime =
    job?.posted || "Just now";

  const experienceText = formatExperienceRange(
    job?.min_experience_years ?? job?.minExperienceYears,
    job?.max_experience_years ?? job?.maxExperienceYears
  );

  const tagsArray = Array.isArray(job?.tags)
    ? job.tags
    : typeof job?.tags === "string"
    ? (() => {
        try {
          const parsed = JSON.parse(job.tags);
          return Array.isArray(parsed)
            ? parsed
            : [];
        } catch {
          return [];
        }
      })()
    : ["Laravel", "Backend"];

  const handleToggleSave = async () => {
    if (!job?.id) return;

    const newState = !isSaved;

    // Optimistic update
    setIsSaved(newState);

    try {
      if (newState) {
        await API.post(
          `/jobs/${job.id}/save`
        );
      } else {
        await API.delete(
          `/jobs/${job.id}/save`
        );
      }

      onSave?.(String(job.id), newState);
    } catch (error) {
      console.error(
        "Save job error:",
        error
      );

      // Rollback
      setIsSaved(!newState);
    }
  };

  return (
    <Pressable
      onPress={onView}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: pressed
            ? `${jobColor}55`
            : C.border,
          transform: [
            {
              scale: pressed ? 0.99 : 1,
            },
          ],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${jobColor}18`,
            },
          ]}
        >
          <Ionicons
            name="briefcase-outline"
            size={21}
            color={jobColor}
          />
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text
              style={styles.title}
              numberOfLines={2}
            >
              {title}
            </Text>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    jobStatus.toLowerCase() ===
                    "open"
                      ? "#dcfce7"
                      : "#f3f4f6",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      jobStatus
                        .toLowerCase() ===
                      "open"
                        ? "#16a34a"
                        : C.textSec,
                  },
                ]}
              >
                {jobStatus}
              </Text>
            </View>
          </View>

          <Text
            style={styles.company}
            numberOfLines={1}
          >
            {companyName}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons
                name="location-outline"
                size={13}
                color={C.textMuted}
              />

              <Text
                style={styles.metaText}
                numberOfLines={1}
              >
                {location}
              </Text>
            </View>

            <Text
              style={styles.metaText}
              numberOfLines={1}
            >
              {empType} · {workMode}
            </Text>
          </View>

          <Text style={styles.metaText}>{experienceText}</Text>
        </View>
      </View>

      {/* Tags */}
      {tagsArray.length > 0 && (
        <View style={styles.tagsContainer}>
          {tagsArray.map(
            (tag: any, index: number) => (
              <View
                key={`${tag}-${index}`}
                style={styles.tag}
              >
                <Text style={styles.tagText}>
                  {typeof tag === "object"
                    ? tag.name ||
                      tag.title ||
                      ""
                    : String(tag)}
                </Text>
              </View>
            )
          )}
        </View>
      )}

      {/* Match Score */}
      {showMatch &&
        matchScore > 0 && (
          <View style={styles.matchContainer}>
            <View
              style={styles.matchLeft}
            >
              <Ionicons
                name="sparkles-outline"
                size={14}
                color={C.accent}
              />

              <Text
                style={styles.matchText}
              >
                {matchScore}% Match
              </Text>
            </View>
          </View>
        )}

      {/* Bottom */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.salary}>
            {salary}
          </Text>

          <View style={styles.postedRow}>
            <Ionicons
              name="time-outline"
              size={13}
              color={C.textMuted}
            />

            <Text
              style={styles.postedText}
            >
              {postedTime}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {onSave && (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                handleToggleSave();
              }}
              style={[
                styles.saveButton,
                {
                  borderColor: isSaved
                    ? C.accent
                    : C.border,
                  backgroundColor: isSaved
                    ? `${C.accent}10`
                    : "transparent",
                },
              ]}
            >
              <Ionicons
                name={
                  isSaved
                    ? "heart"
                    : "heart-outline"
                }
                size={16}
                color={
                  isSaved
                    ? C.accent
                    : C.textSec
                }
              />

              <Text
                style={[
                  styles.saveText,
                  {
                    color: isSaved
                      ? C.accent
                      : C.textSec,
                  },
                ]}
              >
                {isSaved
                  ? "Saved"
                  : "Save"}
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onView();
            }}
            style={[
              styles.viewButton,
              {
                backgroundColor:
                  C.accent,
              },
            ]}
          >
            <Text style={styles.viewText}>
              View
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: C.surface,
    marginBottom: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  headerInfo: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },

  statusText: {
    fontSize: 9.5,
    fontWeight: "700",
  },

  company: {
    marginTop: 3,
    fontSize: 13,
    color: C.textSec,
    fontFamily: F,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 6,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    maxWidth: "65%",
  },

  metaText: {
    fontSize: 11.5,
    color: C.textMuted,
    fontFamily: F,
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 16,
  },

  tag: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: C.divider,
  },

  tagText: {
    fontSize: 11.5,
    color: C.textSec,
    fontFamily: F,
  },

  matchContainer: {
    marginTop: 12,
  },

  matchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  matchText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: C.accent,
    fontFamily: F,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 18,
  },

  salary: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  postedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },

  postedText: {
    fontSize: 10.5,
    color: C.textMuted,
    fontFamily: F,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },

  saveText: {
    fontSize: 11.5,
    fontWeight: "600",
    fontFamily: F,
  },

  viewButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },

  viewText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: F,
  },
});
