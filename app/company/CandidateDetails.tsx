import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { C, F } from "../../constants/tokens";
import { formatExperienceDates } from "../../imports/experience";
import { useSyncRefresh } from "../../context/SyncContext";
import { API, resolveMediaUrl } from "../../imports/api";
import {
  fetchApplicantDetails,
  fetchApplicantAISummary,
  fetchApplicantNotes,
  addApplicantNote,
  deleteApplicantNote,
  type ApplicantDetails,
  type CompanyNote,
} from "../../imports/applicants";

const TABS = ["Profile", "Resume", "Notes"] as const;

const STATUS_OPTIONS = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
] as const;

const isAvailableAISummary = (value?: string | null) =>
  Boolean(value?.trim()) &&
  value?.trim().toLowerCase() !== "ai summary unavailable";

const asTextList = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [])
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

export default function CandidateDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [candidate, setCandidate] =
    useState<ApplicantDetails | null>(null);

  const [notes, setNotes] = useState<CompanyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [addingNote, setAddingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  const [tab, setTab] =
    useState<(typeof TABS)[number]>("Profile");

  const [newNote, setNewNote] = useState("");

  const [status, setStatus] = useState("Applied");

  const [showAISummary, setShowAISummary] =
    useState(false);

  const [loadingAISummary, setLoadingAISummary] =
    useState(false);

  const [aiSummaryError, setAiSummaryError] =
    useState<string | null>(null);
  const [showMatchSheet, setShowMatchSheet] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const loadNotes = useCallback(async (showLoading = true) => {
    if (!id) return false;
    if (showLoading) setNotesLoading(true);
    setNotesError(null);

    try {
      const notesData = await fetchApplicantNotes(Number(id));
      setNotes(notesData);
      return true;
    } catch {
      setNotesError("Failed to load notes. Please try again.");
      return false;
    } finally {
      if (showLoading) setNotesLoading(false);
    }
  }, [id]);

  const loadCandidate = useCallback(async () => {
    if (!id) return;

    const applicantId = Number(id);
    try {
      const [applicant] = await Promise.all([
        fetchApplicantDetails(applicantId),
        loadNotes(),
      ]);
        setCandidate(applicant);

        if (applicant?.status) {
          setStatus(applicant.status);
        }
    } catch {
      Alert.alert("Error", "Failed to load applicant details.");
    } finally {
      setLoading(false);
    }
  }, [id, loadNotes]);

  useSyncRefresh(["applications", "student", "resume", "interviews"], loadCandidate);
  useEffect(() => { void loadCandidate(); }, [loadCandidate]);

  const resume = (candidate as any)?.resume || null;

  const parseResumeField = <T,>(
    value: any,
    fallback: T
  ): T => {
    if (Array.isArray(value)) {
      return value as T;
    }

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
      } catch {
        return fallback;
      }
    }

    return value ?? fallback;
  };

  const resumeSkills = parseResumeField<any[]>(resume?.skills, []);

  const resumeExperience = parseResumeField<any[]>(
    resume?.experience,
    []
  );

  const resumeEducation = parseResumeField<any[]>(
    resume?.education,
    []
  );

  const resumeProjects = parseResumeField<any[]>(
    resume?.projects,
    []
  );

  const resumeCertificates = parseResumeField<any[]>(
    resume?.certificates,
    []
  );

  const resumeLanguages = parseResumeField<any[]>(
    resume?.languages,
    []
  );

  const matchPercentage =
    candidate?.match?.percentage ?? 0;

  const matchingSkills = asTextList(candidate?.match?.matching_skills);
  const missingSkills = asTextList(candidate?.match?.missing_skills);
  const matchReasons = asTextList(candidate?.match?.reasons);
  const matchWarnings = asTextList(candidate?.match?.warnings);
  const applicableItems = Object.entries(candidate?.match?.breakdown ?? {}).filter(
    ([, item]) => Boolean(item && typeof item === "object" && (item as any).applicable === true)
  ) as [string, { score?: number; max_weight?: number; applicable?: boolean }][];
  const earnedPoints = applicableItems.reduce((total, [, item]) => total + Number(item.score ?? 0), 0);
  const applicableWeight = applicableItems.reduce((total, [, item]) => total + Number(item.max_weight ?? 0), 0);
  const explainedPercentage = applicableWeight ? (earnedPoints / applicableWeight) * 100 : 0;
  const totalExperience =
    candidate?.total_years_of_experience ??
    candidate?.total_years_experience ??
    candidate?.resume?.total_years_of_experience ??
    candidate?.resume?.total_years_experience ??
    0;

  const handleToggleAISummary = async (forceRetry = false) => {
    if (loadingAISummary) return;
    if (showAISummary && !forceRetry) {
      setShowAISummary(false);
      return;
    }

    setShowAISummary(true);

    if (
      (!isAvailableAISummary(candidate?.ai_summary) || aiSummaryError) &&
      candidate?.application_id
    ) {
      setLoadingAISummary(true);
      setAiSummaryError(null);

      try {
        const summaryText =
          await fetchApplicantAISummary(candidate.application_id);

        if (summaryText && summaryText.trim()) {
          setCandidate((prev) =>
            prev
              ? {
                  ...prev,
                  ai_summary: summaryText,
                }
              : prev
          );
        } else {
          setAiSummaryError(
            "Failed to generate AI summary. Please try again."
          );
        }
      } catch (err: any) {
        console.error(
          "Failed to fetch AI summary:",
          err
        );

        setAiSummaryError(
          err?.response?.status === 503
            ? "AI summary is temporarily unavailable. Please try again."
            : err?.response?.data?.message ||
                "Failed to generate AI summary. Please try again."
        );
      } finally {
        setLoadingAISummary(false);
      }
    }
  };

  const handleAddNote = async () => {
    const noteText = newNote.trim();
    if (!noteText || !id || addingNote) return;

    try {
      setAddingNote(true);
      await addApplicantNote(Number(id), noteText);
      setNewNote("");
      const refreshed = await loadNotes(false);
      Alert.alert(
        refreshed ? "Success" : "Note saved",
        refreshed
          ? "Note added successfully."
          : "The note was saved, but the list could not be refreshed. Please retry."
      );
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to add the note.");
      await loadNotes(false);
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (
    noteId: number
  ) => {
    if (deletingNoteId !== null) return;

    try {
      setDeletingNoteId(noteId);
      await deleteApplicantNote(noteId);

      setNotes((prev) =>
        prev.filter((note) => note.id !== noteId)
      );
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to delete the note.");
    } finally {
      setDeletingNoteId(null);
    }
  };

  const updateStatus = async (
    newStatus: string
  ) => {
    if (!candidate?.application_id) return;

    try {
      const response = await API.put(
        `/company/applicants/${candidate.application_id}/status`,
        {
          status: newStatus,
        }
      );

      setStatus(newStatus);

      setCandidate((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
            }
          : prev
      );
      Alert.alert(
        "Status updated",
        `${response.data?.message ?? `Application marked as ${newStatus}.`}\nCandidate notification processed.`
      );
    } catch (error: any) {
      console.error(
        "Failed to update status:",
        error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ?? "Failed to update candidate status."
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="small"
          color={C.accent || "#C8A46A"}
        />

        <Text style={styles.loadingText}>
          Loading candidate profile...
        </Text>
      </View>
    );
  }

  if (!candidate) {
    return (
      <View style={styles.notFoundContainer}>
        <Pressable
          onPress={() =>
            router.replace("/company/Applicants")
          }
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color={C.textSec}
          />

          <Text style={styles.backText}>
            Back to Applicants
          </Text>
        </Pressable>

        <View style={styles.notFoundCard}>
          <Ionicons
            name="person-circle-outline"
            size={46}
            color={C.textSec}
            style={{ opacity: 0.3 }}
          />

          <Text style={styles.notFoundTitle}>
            Candidate Not Found
          </Text>

          <Text style={styles.notFoundDescription}>
            The applicant profile you are looking for
            does not exist or has been removed.
          </Text>
        </View>
      </View>
    );
  }

  const resumeFilePath =
    resume?.file_url ||
    resume?.url ||
    resume?.file_path ||
    resume?.resume_url ||
    (candidate as any)?.resume_url ||
    (candidate.student as any)?.resume_url ||
    (candidate.student as any)?.resume;

  const resumeUrl = resolveMediaUrl(resumeFilePath);

  const displaySkills = matchingSkills;

  const experiencesList =
    resumeExperience.length > 0
      ? resumeExperience
      : Array.isArray(
          (candidate as any)?.experience
        )
      ? (candidate as any).experience
      : Array.isArray(
          (candidate as any)?.experiences
        )
      ? (candidate as any).experiences
      : [];

  const avatar = resolveMediaUrl(candidate.student.avatar);
  const avatarInitial = candidate.student.name?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* BACK */}
      <Pressable
        onPress={() =>
          router.replace("/company/Applicants")
        }
        style={styles.backButton}
      >
        <Ionicons
          name="arrow-back"
          size={18}
          color={C.textSec}
        />

        <Text style={styles.backText}>
          Back to Applicants
        </Text>
      </Pressable>

      {/* TABS */}
      <View style={styles.tabsContainer}>
        {TABS.map((t) => {
          const active = tab === t;

          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[
                styles.tabButton,
                active ? styles.tabActive : styles.tabInactive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  active ? styles.tabTextActive : styles.tabTextInactive,
                ]}
              >
                {t}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* PROFILE HEADER */}
      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          {avatar && !avatarFailed ? (
            <Image source={{ uri: avatar }} style={styles.avatar} resizeMode="cover" onError={() => setAvatarFailed(true)} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarInitial}>{avatarInitial}</Text></View>
          )}

          <View style={styles.profileIdentity}>
            <Text style={styles.candidateName}>
              {candidate.student.name}
            </Text>

            <Text style={styles.headline}>
              {candidate.student.headline ||
                "No headline provided"}
            </Text>
          </View>

          <MatchRingMobile
            percentage={matchPercentage}
            onPress={() => setShowMatchSheet(true)}
          />

        </View>

        {/* STATUS */}
        <View style={styles.statusContainer}>
          {STATUS_OPTIONS.map((st) => {
            const isActive = status === st;

            return (
              <Pressable
                key={st}
                onPress={() => updateStatus(st)}
                style={[
                  styles.statusButton,
                  isActive
                    ? styles.statusButtonActive
                    : styles.statusButtonInactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    isActive
                      ? styles.statusButtonTextActive
                      : styles.statusButtonTextInactive,
                  ]}
                >
                  {st}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* CONTACT INFO */}
        <View style={styles.contactContainer}>
          <InfoRow
            icon="mail-outline"
            text={candidate.student.email}
          />

          <InfoRow
            icon="location-outline"
            text={
              candidate.student.location ||
              "Not specified"
            }
          />

          <InfoRow
            icon="briefcase-outline"
            text={
              experiencesList.length > 0
                ? `${experiencesList.length} experience record(s)`
                : "Not specified"
            }
          />
        </View>
      </View>

      {/* PROFILE TAB */}
      {tab === "Profile" && (
        <View style={styles.tabContent}>
          {/* AI SUMMARY */}
          <Pressable
            onPress={() => void handleToggleAISummary()}
            disabled={loadingAISummary}
            style={styles.aiCard}
          >
            <View style={styles.aiHeader}>
              <View style={styles.aiTitleContainer}>
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={C.accentHover}
                />

                <Text style={styles.aiTitle}>
                  AI Summary
                </Text>
              </View>

              <Text style={styles.aiAction}>
                {showAISummary
                  ? "Hide"
                  : isAvailableAISummary(candidate?.ai_summary)
                  ? "View"
                  : candidate?.ai_summary?.trim().toLowerCase() === "ai summary unavailable"
                  ? "Retry"
                  : "Generate Summary"}
              </Text>
            </View>

            {showAISummary && (
              <View style={styles.aiBody}>
                {loadingAISummary ? (
                  <View
                    style={styles.aiLoading}
                  >
                    <ActivityIndicator
                      size="small"
                      color={C.accentHover}
                    />

                    <Text
                      style={styles.aiLoadingText}
                    >
                      Generating AI summary...
                    </Text>
                  </View>
                ) : aiSummaryError ? (
                  <View>
                    <Text style={styles.aiError}>{aiSummaryError}</Text>
                    <Pressable
                      style={styles.aiRetryButton}
                      onPress={(event) => {
                        event.stopPropagation();
                        void handleToggleAISummary(true);
                      }}
                    >
                      <Text style={styles.aiRetryText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.aiSummary}>
                    {isAvailableAISummary(candidate.ai_summary) ? candidate.ai_summary :
                      "No AI summary available."}
                  </Text>
                )}
              </View>
            )}
          </Pressable>

          {/* SKILLS */}
          <Section title="Matching Skills">
            {displaySkills.length > 0 ? (
              <View style={styles.chipsContainer}>
                {displaySkills.map(
                  (skill: any, index: number) => {
                    const skillName =
                      typeof skill === "string"
                        ? skill
                        : skill?.name;

                    return (
                      <View
                        key={`${skillName}-${index}`}
                        style={styles.skillChip}
                      >
                        <Text
                          style={
                            styles.skillChipText
                          }
                        >
                          {skillName}
                        </Text>
                      </View>
                    );
                  }
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No skills provided.
              </Text>
            )}

            {missingSkills.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    { marginTop: 20 },
                  ]}
                >
                  Missing Skills
                </Text>

                <View
                  style={styles.chipsContainer}
                >
                  {missingSkills.map((skill) => (
                    <View
                      key={skill}
                      style={
                        styles.missingSkillChip
                      }
                    >
                      <Text
                        style={
                          styles.missingSkillText
                        }
                      >
                        {skill}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </Section>

          {/* WHY MATCH */}
          <Section title="Why This Match">
            {!!candidate.match?.recommendation_level && (
              <Text style={styles.recommendationText}>{candidate.match.recommendation_level}</Text>
            )}
            {matchReasons.length > 0 ? (
              <View style={styles.reasonsContainer}>
                {matchReasons.map(
                  (reason, idx) => (
                    <View
                      key={idx}
                      style={styles.reasonRow}
                    >
                      <View
                        style={styles.reasonDot}
                      />

                      <Text
                        style={styles.reasonText}
                      >
                        {reason}
                      </Text>
                    </View>
                  )
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No match details available.
              </Text>
            )}

            {matchWarnings.map((warning, idx) => (
              <View key={`warning-${idx}`} style={styles.reasonRow}>
                <Ionicons name="warning-outline" size={15} color="#D97706" />
                <Text style={styles.reasonText}>{warning}</Text>
              </View>
            ))}

          </Section>
        </View>
      )}

      {/* RESUME TAB */}
      {tab === "Resume" && (
        <View style={styles.tabContent}>
          {/* RESUME FILE */}
          {resumeUrl ? (
            <View style={styles.resumeFileCard}>
              <View
                style={
                  styles.resumeFileLeft
                }
              >
                <View
                  style={styles.resumeIcon}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={21}
                    color="#524538"
                  />
                </View>

                <View
                  style={
                    styles.resumeFileInfo
                  }
                >
                  <Text
                    style={
                      styles.resumeTitle
                    }
                  >
                    {resume?.title ||
                      "Resume Document"}
                  </Text>

                  <Text
                    style={
                      styles.resumeSubtitle
                    }
                  >
                    Official CV PDF
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.resumeButtons
                }
              >
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/company/ResumePreview" as any,
                      params: { applicationId: String(candidate.application_id) },
                    })
                  }
                  style={
                    styles.primarySmallButton
                  }
                >
                  <Ionicons
                    name="open-outline"
                    size={15}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.primarySmallButtonText
                    }
                  >
                    View
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    Linking.openURL(
                      resumeUrl
                    )
                  }
                  style={
                    styles.secondarySmallButton
                  }
                >
                  <Ionicons
                    name="download-outline"
                    size={15}
                    color={C.text}
                  />

                  <Text
                    style={
                      styles.secondarySmallButtonText
                    }
                  >
                    Download
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyText}>
                No uploaded resume document
                available.
              </Text>
            </View>
          )}

          {/* EDUCATION */}
          <ResumeSection
            icon="school-outline"
            title="Education"
          >
            {resumeEducation.length > 0 ? (
              resumeEducation.map(
                (
                  education: any,
                  index: number
                ) => (
                  <View
                    key={index}
                    style={
                      styles.resumeItem
                    }
                  >
                    <Text
                      style={
                        styles.resumeItemTitle
                      }
                    >
                      {education.degree ||
                        "Education"}
                    </Text>

                    {education.university && (
                      <Text
                        style={
                          styles.resumeItemSubtitle
                        }
                      >
                        {education.university}
                      </Text>
                    )}

                    {education.field_of_study && (
                      <Text
                        style={
                          styles.resumeItemSecondary
                        }
                      >
                        {
                          education.field_of_study
                        }
                      </Text>
                    )}

                    {(education.start_date ||
                      education.end_date) && (
                      <Text
                        style={
                          styles.resumeItemDate
                        }
                      >
                        {education.start_date ||
                          ""}
                        {education.start_date &&
                        education.end_date
                          ? " - "
                          : ""}
                        {education.end_date ||
                          ""}
                      </Text>
                    )}
                  </View>
                )
              )
            ) : (
              <Text style={styles.emptyText}>
                No education information
                provided.
              </Text>
            )}
          </ResumeSection>

          {/* EXPERIENCE */}
          <ResumeSection
            icon="briefcase-outline"
            title="Work Experience"
          >
            <Text style={styles.breakdownTitle}>Total Experience: {totalExperience} Years</Text>
            {resumeExperience.length > 0 ? (
              resumeExperience.map(
                (exp: any, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.resumeItem,
                      index !==
                        resumeExperience.length -
                          1 &&
                        styles.resumeItemBorder,
                    ]}
                  >
                    <Text
                      style={
                        styles.resumeItemTitle
                      }
                    >
                      {exp.title || exp.position || exp.role || "Position"}
                      {exp.company ? ` — ${exp.company}` : ""}
                    </Text>

                    {(exp.start_date ||
                      exp.end_date) && (
                      <Text
                        style={
                          styles.resumeItemDate
                        }
                      >
                        {formatExperienceDates(exp.start_date, exp.end_date)}
                      </Text>
                    )}

                    {exp.description && (
                      <Text
                        style={
                          styles.resumeDescription
                        }
                      >
                        {exp.description}
                      </Text>
                    )}
                  </View>
                )
              )
            ) : (
              <Text style={styles.emptyText}>
                No work experience provided.
              </Text>
            )}
          </ResumeSection>

          {/* RESUME SKILLS */}
          <ResumeSection
            icon="document-text-outline"
            title="Skills"
          >
            {resumeSkills.length > 0 ? (
              <View
                style={styles.chipsContainer}
              >
                {resumeSkills.map(
                  (
                    skill: any,
                    index: number
                  ) => {
                    const skillName =
                      typeof skill ===
                      "string"
                        ? skill
                        : skill?.name;

                    return (
                      <View
                        key={`${skillName}-${index}`}
                        style={styles.skillChip}
                      >
                        <Text
                          style={
                            styles.skillChipText
                          }
                        >
                          {skillName}
                        </Text>
                      </View>
                    );
                  }
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No skills listed in this
                resume.
              </Text>
            )}
          </ResumeSection>

          {/* PROJECTS */}
          <ResumeSection
            icon="document-outline"
            title="Projects"
          >
            {resumeProjects.length > 0 ? (
              resumeProjects.map(
                (
                  project: any,
                  index: number
                ) => (
                  <View
                    key={index}
                    style={[
                      styles.resumeItem,
                      index !==
                        resumeProjects.length -
                          1 &&
                        styles.resumeItemBorder,
                    ]}
                  >
                    <Text
                      style={
                        styles.resumeItemTitle
                      }
                    >
                      {project.name ||
                        project.title ||
                        "Project"}
                    </Text>

                    {project.description && (
                      <Text
                        style={
                          styles.resumeDescription
                        }
                      >
                        {project.description}
                      </Text>
                    )}

                    {project.link && (
                      <Pressable
                        onPress={() =>
                          Linking.openURL(
                            project.link
                          )
                        }
                        style={
                          styles.projectLink
                        }
                      >
                        <Ionicons
                          name="open-outline"
                          size={13}
                          color={C.accentHover}
                        />

                        <Text
                          style={
                            styles.projectLinkText
                          }
                        >
                          Project Link
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )
              )
            ) : (
              <Text style={styles.emptyText}>
                No projects provided.
              </Text>
            )}
          </ResumeSection>

          {/* CERTIFICATES */}
          <ResumeSection
            icon="ribbon-outline"
            title="Certificates"
          >
            {resumeCertificates.length > 0 ? (
              resumeCertificates.map(
                (
                  certificate: any,
                  index: number
                ) => (
                  <View
                    key={index}
                    style={[
                      styles.resumeItem,
                      index !==
                        resumeCertificates.length -
                          1 &&
                        styles.resumeItemBorder,
                    ]}
                  >
                    <Text
                      style={
                        styles.resumeItemTitle
                      }
                    >
                      {certificate.name ||
                        certificate.title ||
                        "Certificate"}
                    </Text>

                    {certificate.issuer && (
                      <Text
                        style={
                          styles.resumeItemSubtitle
                        }
                      >
                        {certificate.issuer}
                      </Text>
                    )}

                    {(certificate.year ||
                      certificate.date) && (
                      <Text
                        style={
                          styles.resumeItemDate
                        }
                      >
                        {certificate.year ||
                          certificate.date}
                      </Text>
                    )}
                  </View>
                )
              )
            ) : (
              <Text style={styles.emptyText}>
                No certificates listed.
              </Text>
            )}
          </ResumeSection>

          {/* LANGUAGES */}
          <ResumeSection
            icon="language-outline"
            title="Languages"
          >
            {resumeLanguages.length > 0 ? (
              <View
                style={styles.languagesContainer}
              >
                {resumeLanguages.map(
                  (
                    language: any,
                    index: number
                  ) => (
                    <View
                      key={index}
                      style={
                        styles.languageCard
                      }
                    >
                      <Text
                        style={
                          styles.languageName
                        }
                      >
                        {language.language ||
                          language.name ||
                          "Language"}
                      </Text>

                      {language.level && (
                        <Text
                          style={
                            styles.languageLevel
                          }
                        >
                          {language.level}
                        </Text>
                      )}
                    </View>
                  )
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No languages listed.
              </Text>
            )}
          </ResumeSection>
        </View>
      )}

      {/* NOTES TAB */}
      {tab === "Notes" && (
        <View style={styles.tabContent}>
          <View style={styles.noteInputCard}>
            <TextInput
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Add an internal note about this applicant..."
              placeholderTextColor={C.textSec}
              style={styles.noteInput}
              multiline
              editable={!addingNote}
            />

            <Pressable
              onPress={handleAddNote}
              disabled={!newNote.trim() || addingNote}
              style={[
                styles.addNoteButton,
                (!newNote.trim() || addingNote) && styles.noteActionDisabled,
              ]}
            >
              {addingNote ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.addNoteText}>Add</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.notesContainer}>
            {notesLoading ? (
              <View style={styles.notesState}>
                <ActivityIndicator color={C.accent} />
                <Text style={styles.emptyText}>Loading notes...</Text>
              </View>
            ) : notesError ? (
              <View style={styles.notesState}>
                <Text style={styles.notesErrorText}>{notesError}</Text>
                <Pressable style={styles.notesRetryButton} onPress={() => void loadNotes()}>
                  <Text style={styles.notesRetryText}>Retry</Text>
                </Pressable>
              </View>
            ) : notes.length > 0 ? (
              notes.map((note) => (
                <View
                  key={note.id}
                  style={styles.noteCard}
                >
                  <Text
                    style={styles.noteText}
                  >
                    {note.note}
                  </Text>

                  <Pressable
                    onPress={() =>
                      handleDeleteNote(
                        note.id
                      )
                    }
                    disabled={deletingNoteId !== null}
                    style={[
                      styles.deleteNoteButton,
                      deletingNoteId !== null && styles.noteActionDisabled,
                    ]}
                  >
                    {deletingNoteId === note.id ? (
                      <ActivityIndicator size="small" color={C.textSec} />
                    ) : (
                      <Ionicons name="trash-outline" size={17} color={C.textSec} />
                    )}
                  </Pressable>
                </View>
              ))
            ) : (
              <View
                style={styles.emptyNotes}
              >
                <Text
                  style={styles.emptyText}
                >
                  No notes created for this
                  candidate yet.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* APPLICATION TIMELINE */}
      <View style={[styles.card, styles.timelineCard]}>
        <Text style={styles.sectionTitle}>Application Timeline</Text>

        {candidate.timeline && candidate.timeline.length > 0 ? (
          <View>
            {candidate.timeline.map((item, idx, arr) => (
              <View key={item.id ?? idx} style={styles.timelineItem}>
                {idx !== arr.length - 1 && <View style={styles.timelineLine} />}
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>{item.status}</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(item.changed_at).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No timeline data available yet.</Text>
        )}
      </View>

      <Modal visible={showMatchSheet} transparent animationType="slide" onRequestClose={() => setShowMatchSheet(false)}>
        <Pressable style={styles.matchModalOverlay} onPress={() => setShowMatchSheet(false)}>
          <Pressable style={styles.matchSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.matchSheetTitle}>How the match score was calculated</Text>
            <Text style={styles.officialMatch}>Official Match: {matchPercentage}%</Text>
            {!!candidate.match?.source && <Text style={styles.matchSource}>Source: {candidate.match.source}</Text>}

            {applicableItems.length > 0 ? applicableItems.map(([criterion, item]) => {
              const score = Number(item.score ?? 0);
              const maxWeight = Number(item.max_weight ?? 0);
              const progress = maxWeight > 0 ? Math.min(1, Math.max(0, score / maxWeight)) : 0;
              return (
                <View key={criterion} style={styles.matchCriterion}>
                  <View style={styles.matchCriterionHeader}>
                    <Text style={styles.matchCriterionName}>{criterion.replace(/_/g, " ")}</Text>
                    <Text style={styles.matchCriterionScore}>{score}/{maxWeight}</Text>
                  </View>
                  <View style={styles.matchProgressTrack}><View style={[styles.matchProgressFill, { width: `${progress * 100}%` }]} /></View>
                </View>
              );
            }) : <Text style={styles.emptyText}>No applicable criteria breakdown is available.</Text>}

            {applicableItems.length > 0 && (
              <View style={styles.matchExplanation}>
                <Text style={styles.matchFormula}>{earnedPoints} earned points ÷ {applicableWeight} applicable points × 100</Text>
                <Text style={styles.matchFormula}>Explanation result: {explainedPercentage.toFixed(1)}%</Text>
                <Text style={styles.matchFormulaStrong}>Official match: {matchPercentage}%</Text>
                <Text style={styles.matchRounding}>A small difference is expected because the backend rounds the official match.</Text>
              </View>
            )}
            <Pressable style={styles.matchCloseButton} onPress={() => setShowMatchSheet(false)}><Text style={styles.matchCloseText}>Close</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

/* =========================
   SMALL COMPONENTS
========================= */

function InfoRow({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons
        name={icon}
        size={15}
        color={C.textSec}
      />

      <Text
        style={styles.infoText}
        numberOfLines={2}
      >
        {text}
      </Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {children}
    </View>
  );
}

function ResumeSection({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.resumeSection}>
      <View style={styles.resumeSectionHeader}>
        <Ionicons
          name={icon}
          size={17}
          color={C.text}
        />

        <Text
          style={styles.resumeSectionTitle}
        >
          {title}
        </Text>
      </View>

      {children}
    </View>
  );
}

function MatchRingMobile({
  percentage,
  onPress,
}: {
  percentage: number;
  onPress: () => void;
}) {
  const size = 68;
  const strokeWidth = 5;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.matchRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
        },
      ]}
    >
      <Text style={styles.matchPercentage}>
        {percentage}%
      </Text>

      <Text style={styles.matchLabel}>
        Match
      </Text>
    </Pressable>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F7",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF9F7",
  },

  loadingText: {
    marginTop: 10,
    fontFamily: F,
    fontSize: 14,
    color: C.text,
    opacity: 0.7,
  },

  notFoundContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FAF9F7",
  },

  notFoundCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 30,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },

  notFoundTitle: {
    fontFamily: F,
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    marginTop: 12,
    marginBottom: 8,
  },

  notFoundDescription: {
    fontFamily: F,
    fontSize: 14,
    color: C.textSec,
    textAlign: "center",
    lineHeight: 21,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },

  backText: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "500",
    color: C.textSec,
  },

  profileCard: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },

  profileTop: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 16,
  },

  profileIdentity: {
    flex: 1,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDE9FE",
  },

  avatarInitial: {
    color: "#6D28D9",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: F,
  },

  candidateName: {
    fontFamily: F,
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    marginBottom: 4,
  },

  headline: {
    fontFamily: F,
    fontSize: 13,
    color: C.textSec,
    lineHeight: 17,
  },

  matchRing: {
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#C8A46A",
  },

  matchPercentage: {
    fontFamily: F,
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },

  matchLabel: {
    fontFamily: F,
    fontSize: 10,
    color: C.textSec,
    marginTop: 1,
  },

  statusContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 7,
    marginBottom: 18,
  },

  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },

  statusButtonActive: {
    backgroundColor: C.accent || "#C8A46A",
  },

  statusButtonInactive: {
    backgroundColor: "#F5F3F1",
    borderWidth: 1,
    borderColor: C.border,
  },

  statusButtonText: {
    fontFamily: F,
    fontSize: 11,
    fontWeight: "600",
  },

  statusButtonTextActive: {
    color: "#FFFFFF",
  },

  statusButtonTextInactive: {
    color: C.textSec,
  },

  contactContainer: {
    width: "100%",
    gap: 10,
    paddingTop: 4,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  infoText: {
    flex: 1,
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },

  sectionTitle: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
    marginBottom: 11,
  },

  timelineItem: {
    flexDirection: "row",
    position: "relative",
    minHeight: 50,
  },

  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2D6A4F",
    marginTop: 2,
    zIndex: 2,
  },

  timelineLine: {
    position: "absolute",
    left: 6,
    top: 14,
    bottom: 0,
    width: 1.5,
    backgroundColor: "#2D6A4F",
  },

  timelineContent: {
    marginLeft: 12,
    paddingBottom: 14,
  },

  timelineStatus: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
    color: C.text,
  },

  timelineDate: {
    fontFamily: F,
    fontSize: 11,
    color: C.textSec,
    marginTop: 2,
  },

  tabsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  matchOverviewCard: {
    minHeight: 94,
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },

  matchOverviewLabel: {
    fontFamily: F,
    fontSize: 15,
    fontWeight: "800",
    color: C.text,
  },

  matchOverviewHint: {
    marginTop: 5,
    fontFamily: F,
    fontSize: 11,
    lineHeight: 16,
    color: C.textSec,
  },

  tabButton: {
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: 9,
  },

  tabActive: {
    backgroundColor: C.accent || "#C8A46A",
  },

  tabInactive: {
    backgroundColor: "#F5F3F1",
    borderWidth: 1,
    borderColor: C.border,
  },

  tabText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
  },

  tabTextActive: {
    color: "#FFFFFF",
  },

  tabTextInactive: {
    color: C.textSec,
  },

  tabContent: {
    gap: 18,
  },

  aiCard: {
    backgroundColor: C.accentLight,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },

  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  aiTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  aiTitle: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
    color: C.accentHover,
  },

  aiAction: {
    fontFamily: F,
    fontSize: 11,
    color: C.accentHover,
  },

  aiBody: {
    marginTop: 10,
  },

  aiLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  aiLoadingText: {
    fontFamily: F,
    fontSize: 12.5,
    color: C.accentHover,
  },

  aiError: {
    fontFamily: F,
    fontSize: 12.5,
    color: "#E53E3E",
    lineHeight: 19,
  },

  aiSummary: {
    fontFamily: F,
    fontSize: 12.5,
    lineHeight: 20,
    color: "#4A5568",
  },

  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  skillChip: {
    backgroundColor: "#F2EBE1",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },

  skillChipText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "500",
    color: "#524538",
  },

  missingSkillChip: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },

  missingSkillText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "500",
    color: "#991B1B",
  },

  reasonsContainer: {
    gap: 9,
  },

  timelineCard: {
    marginTop: 30,
    marginBottom: 12,
  },

  aiRetryButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: C.accentHover,
  },

  aiRetryText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  breakdownTitle: {
    fontFamily: F,
    fontSize: 12.5,
    fontWeight: "800",
    color: C.text,
  },

  recommendationText: {
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: C.accentLight,
    fontFamily: F,
    fontSize: 11.5,
    fontWeight: "700",
    color: C.accentHover,
  },

  matchModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.48)",
  },

  matchSheet: {
    maxHeight: "86%",
    padding: 22,
    paddingBottom: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: C.surface,
  },

  matchSheetTitle: { fontFamily: F, fontSize: 18, fontWeight: "800", color: C.text },
  officialMatch: { marginTop: 10, fontFamily: F, fontSize: 15, fontWeight: "800", color: C.accentHover },
  matchSource: { marginTop: 3, marginBottom: 16, fontFamily: F, fontSize: 11, color: C.textSec },
  matchCriterion: { marginTop: 15 },
  matchCriterionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 7 },
  matchCriterionName: { fontFamily: F, fontSize: 12.5, fontWeight: "700", color: C.text, textTransform: "capitalize" },
  matchCriterionScore: { fontFamily: F, fontSize: 12, color: C.textSec },
  matchProgressTrack: { height: 8, overflow: "hidden", borderRadius: 4, backgroundColor: C.divider },
  matchProgressFill: { height: "100%", borderRadius: 4, backgroundColor: C.accent },
  matchExplanation: { marginTop: 20, padding: 14, borderRadius: 12, backgroundColor: C.bg },
  matchFormula: { fontFamily: F, fontSize: 11.5, lineHeight: 18, color: C.textSec },
  matchFormulaStrong: { fontFamily: F, fontSize: 12, lineHeight: 19, fontWeight: "800", color: C.text },
  matchRounding: { marginTop: 5, fontFamily: F, fontSize: 10.5, lineHeight: 16, color: C.textMuted },
  matchCloseButton: { marginTop: 20, minHeight: 44, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: C.accent },
  matchCloseText: { fontFamily: F, fontSize: 13, fontWeight: "800", color: "#FFFFFF" },

  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  reasonDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.textSec,
    marginTop: 7,
  },

  reasonText: {
    flex: 1,
    fontFamily: F,
    fontSize: 12.5,
    color: C.textSec,
    lineHeight: 18,
  },

  emptyText: {
    fontFamily: F,
    fontSize: 12.5,
    color: C.textSec,
    lineHeight: 19,
  },

  resumeFileCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },

  resumeFileLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  resumeIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#F2EBE1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  resumeFileInfo: {
    flex: 1,
  },

  resumeTitle: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
  },

  resumeSubtitle: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    marginTop: 2,
  },

  resumeButtons: {
    flexDirection: "row",
    gap: 8,
  },

  primarySmallButton: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    backgroundColor: C.accent || "#C8A46A",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  primarySmallButtonText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  secondarySmallButton: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    backgroundColor: "#F5F3F1",
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  secondarySmallButtonText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
    color: C.text,
  },

  resumeSection: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },

  resumeSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  resumeSectionTitle: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
  },

  resumeItem: {
    paddingBottom: 12,
  },

  resumeItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 12,
  },

  resumeItemTitle: {
    fontFamily: F,
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
  },

  resumeItemSubtitle: {
    fontFamily: F,
    fontSize: 12.5,
    color: C.textSec,
    marginTop: 3,
  },

  resumeItemSecondary: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    marginTop: 2,
  },

  resumeItemDate: {
    fontFamily: F,
    fontSize: 11.5,
    color: C.textSec,
    marginTop: 4,
  },

  resumeDescription: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    lineHeight: 18,
    marginTop: 5,
  },

  projectLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 7,
    alignSelf: "flex-start",
  },

  projectLinkText: {
    fontFamily: F,
    fontSize: 11.5,
    color: C.accentHover,
  },

  languagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  languageCard: {
    backgroundColor: "#F7F3EE",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 105,
  },

  languageName: {
    fontFamily: F,
    fontSize: 12.5,
    fontWeight: "600",
    color: C.text,
  },

  languageLevel: {
    fontFamily: F,
    fontSize: 11,
    color: C.textSec,
    marginTop: 2,
  },

  noteInputCard: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: C.surface,
    padding: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },

  noteInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: F,
    fontSize: 13,
    color: C.text,
    textAlignVertical: "top",
  },

  addNoteButton: {
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: C.accent || "#C8A46A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  addNoteText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  noteActionDisabled: {
    opacity: 0.5,
  },

  notesContainer: {
    gap: 8,
  },

  notesState: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
  },

  notesErrorText: {
    fontFamily: F,
    fontSize: 12,
    lineHeight: 18,
    color: C.danger,
    textAlign: "center",
  },

  notesRetryButton: {
    minHeight: 38,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  notesRetryText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },

  noteText: {
    flex: 1,
    fontFamily: F,
    fontSize: 13,
    color: C.text,
    lineHeight: 19,
    marginRight: 10,
  },

  deleteNoteButton: {
    padding: 3,
  },

  emptyNotes: {
    alignItems: "center",
    paddingVertical: 24,
  },
});
