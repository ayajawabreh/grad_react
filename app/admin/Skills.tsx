import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    AppState,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    createAdminSkill,
    deleteAdminSkill,
    getAdminSkills,
    updateAdminSkill,
} from "../../imports/api";
import { supabase } from "../../lib/supabase";
import { useSyncRefresh } from "../../context/SyncContext";

type Skill = {
  id: number;
  name: string;
  students_count?: number;
  student_count?: number;
  students?: number | unknown[];
  jobs_count?: number;
  job_posts_count?: number;
  job_count?: number;
  jobs?: number | unknown[];
};

const COLORS = {
  background: "#F8F8FC",
  surface: "#FFFFFF",
  text: "#181B1F",
  textSec: "#666666",
  textMuted: "#999999",
  border: "#E6E6EC",
  divider: "#EEEEF2",

  accent: "#C8A46A",
  accentLight: "#F0ECFF",

  info: "#4285F4",
  infoBg: "#EDF4FF",

  purple: "#C8A46A",
  purpleBg: "#F5EDD8",

  error: "#E53935",
  errorBg: "#FFF0F0",

  warning: "#D97706",
  warningBg: "#FFF7E6",
};

const usage = (skill: Skill, type: "students" | "jobs"): number => {
  const count =
    type === "students"
      ? (skill.students_count ?? skill.student_count)
      : (skill.jobs_count ?? skill.job_count);

  const relation = type === "students" ? skill.students : skill.jobs;

  if (typeof count === "number") {
    return count;
  }

  if (typeof relation === "number") {
    return relation;
  }

  return Array.isArray(relation) ? relation.length : 0;
};

export default function Skills() {
  const mountedRef = useRef(true);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [totalSkills, setTotalSkills] = useState(0);
  const [studentUses, setStudentUses] = useState(0);
  const [jobUses, setJobUses] = useState(0);
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);

  const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  // --------------------------------------------------
  // Load Skills
  // --------------------------------------------------

  const loadSkills = useCallback(async () => {
    try {
      const payload = await getAdminSkills();
      const list: Skill[] = Array.isArray(payload)
        ? payload
        : (payload?.data ?? payload?.skills ?? []);
      const statistics = Array.isArray(payload) ? null : payload?.statistics;
      const loadedTotal = Array.isArray(payload)
        ? payload.length
        : Number(payload?.total ?? list.length);
      const loadedStudentUses = Number(
        statistics?.student_uses ??
          list.reduce(
            (total, skill) => total + Number(skill.students_count ?? 0),
            0,
          ),
      );
      const loadedJobUses = Number(
        statistics?.job_uses ??
          list.reduce(
            (total, skill) =>
              total + Number(skill.jobs_count ?? skill.job_posts_count ?? 0),
            0,
          ),
      );

      if (mountedRef.current) {
        setSkills(list);
        setTotalSkills(loadedTotal);
        setStudentUses(loadedStudentUses);
        setJobUses(loadedJobUses);
        setError("");
      }
    } catch (err) {
      console.error(err);

      if (mountedRef.current) {
        setError("Skills could not be loaded. Please try again.");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);
  useSyncRefresh(["admin", "student", "jobs"], loadSkills);

  useEffect(() => {
    mountedRef.current = true;
    void loadSkills();

    const channel = supabase
      .channel("mobile-admin-skills")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "skills",
        },
        () => {
          void loadSkills();
        },
      )
      .subscribe();

    const interval = setInterval(() => {
      void loadSkills();
    }, 5000);

    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") {
          void loadSkills();
        }
      },
    );

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      appStateSubscription.remove();
      void supabase.removeChannel(channel);
    };
  }, [loadSkills]);

  // --------------------------------------------------
  // Search
  // --------------------------------------------------

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return skills;
    }

    return skills.filter((skill) => skill.name.toLowerCase().includes(search));
  }, [skills, query]);

  // --------------------------------------------------
  // Form
  // --------------------------------------------------

  const openForm = (skill?: Skill) => {
    setEditing(skill ?? null);
    setName(skill?.name ?? "");
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (busy) {
      return;
    }

    setShowForm(false);
    setEditing(null);
    setName("");
  };

  // --------------------------------------------------
  // Save Skill
  // --------------------------------------------------

  const saveSkill = async () => {
    const clean = name.trim();

    if (!clean) {
      setError("Enter a skill name first.");
      return;
    }

    const alreadyExists = skills.some(
      (skill) =>
        skill.id !== editing?.id &&
        skill.name.trim().toLowerCase() === clean.toLowerCase(),
    );

    if (alreadyExists) {
      setError(`“${clean}” already exists in the skills catalog.`);
      return;
    }

    try {
      setBusy(true);
      setError("");

      if (editing) {
        await updateAdminSkill(editing.id, {
          name: clean,
        });

        await loadSkills();

        Alert.alert(
          "Skill Updated",
          `“${editing.name}” was changed to “${clean}”.`,
        );
      } else {
        await createAdminSkill({
          name: clean,
        });

        await loadSkills();

        Alert.alert(
          "Skill Added",
          `“${clean}” is now available across the platform.`,
        );
      }

      setShowForm(false);
      setEditing(null);
      setName("");
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.message || "The skill could not be saved.";

      setError(message);

      Alert.alert("Could not save skill", message);
    } finally {
      setBusy(false);
    }
  };

  // --------------------------------------------------
  // Delete Skill
  // --------------------------------------------------

  const deleteSkill = async () => {
    if (!deletingSkill) {
      return;
    }

    try {
      setBusy(true);
      setError("");

      const removed = deletingSkill;

      await deleteAdminSkill(removed.id);

      await loadSkills();

      setDeletingSkill(null);

      Alert.alert(
        "Skill Deleted",
        `“${removed.name}” was removed from the catalog.`,
      );
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.message ||
        "This skill could not be deleted. It may still be in use.";

      setError(message);
      setDeletingSkill(null);

      Alert.alert("Could not delete skill", message);
    } finally {
      setBusy(false);
    }
  };

  // --------------------------------------------------
  // Confirm Delete
  // --------------------------------------------------

  const confirmDelete = (skill: Skill) => {
    setDeletingSkill(skill);
  };

  // --------------------------------------------------
  // Render Skill
  // --------------------------------------------------

  const renderSkill = ({ item }: { item: Skill; index: number }) => {
    const studentUsage = usage(item, "students");

    const jobUsage = usage(item, "jobs");

    return (
      <View style={styles.skillCard}>
        {/* Skill Header */}
        <View style={styles.skillTopRow}>
          <View style={styles.skillIdentity}>
            <View style={styles.skillAvatar}>
              <Text style={styles.skillAvatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.skillInfo}>
              <Text style={styles.skillName} numberOfLines={1}>
                {item.name}
              </Text>

              <Text style={styles.skillId}>ID #{item.id}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={() => openForm(item)}
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="create-outline" size={16} color={COLORS.info} />

              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>

            <Pressable
              onPress={() => confirmDelete(item)}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="trash-outline" size={17} color={COLORS.error} />
            </Pressable>
          </View>
        </View>

        {/* Usage */}
        <View style={styles.usageRow}>
          <View style={styles.usageItem}>
            <View
              style={[
                styles.usageIcon,
                {
                  backgroundColor: COLORS.infoBg,
                },
              ]}
            >
              <Ionicons name="people-outline" size={17} color={COLORS.info} />
            </View>

            <View>
              <Text style={styles.usageValue}>{studentUsage}</Text>

              <Text style={styles.usageLabel}>Students</Text>
            </View>
          </View>

          <View style={styles.usageDivider} />

          <View style={styles.usageItem}>
            <View
              style={[
                styles.usageIcon,
                {
                  backgroundColor: COLORS.purpleBg,
                },
              ]}
            >
              <Ionicons
                name="briefcase-outline"
                size={17}
                color={COLORS.purple}
              />
            </View>

            <View>
              <Text style={styles.usageValue}>{jobUsage}</Text>

              <Text style={styles.usageLabel}>Jobs</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSkill}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.titleRow}>
                  <View style={styles.titleIcon}>
                    <Ionicons
                      name="pricetags-outline"
                      size={20}
                      color={COLORS.accent}
                    />
                  </View>

                  <Text style={styles.title}>Skills Catalog</Text>
                </View>

                <Pressable
                  onPress={() => openForm()}
                  style={({ pressed }) => [
                    styles.addButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />

                  <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
              </View>

              <Text style={styles.subtitle}>
                Manage the central list of skills used by students and jobs
                across CareerBridge.
              </Text>
            </View>

            {/* Statistics */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsContainer}
            >
              {/* Total */}
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    {
                      backgroundColor: COLORS.accentLight,
                    },
                  ]}
                >
                  <Ionicons
                    name="pricetags-outline"
                    size={20}
                    color={COLORS.accent}
                  />
                </View>

                <View>
                  <Text style={styles.statValue}>
                    {loading ? "—" : totalSkills}
                  </Text>

                  <Text style={styles.statLabel}>Total Skills</Text>
                </View>
              </View>

              {/* Students */}
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    {
                      backgroundColor: COLORS.infoBg,
                    },
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={20}
                    color={COLORS.info}
                  />
                </View>

                <View>
                  <Text style={styles.statValue}>
                    {loading ? "—" : studentUses}
                  </Text>

                  <Text style={styles.statLabel}>Student Uses</Text>
                </View>
              </View>

              {/* Jobs */}
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    {
                      backgroundColor: COLORS.purpleBg,
                    },
                  ]}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={20}
                    color={COLORS.purple}
                  />
                </View>

                <View>
                  <Text style={styles.statValue}>
                    {loading ? "—" : jobUses}
                  </Text>

                  <Text style={styles.statLabel}>Job Uses</Text>
                </View>
              </View>
            </ScrollView>

            {/* Error */}
            {error && !showForm && (
              <View style={styles.errorBox}>
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color={COLORS.error}
                />

                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Master Skills Header */}
            <View style={styles.listHeader}>
              <View>
                <Text style={styles.listTitle}>Master Skills</Text>

                <Text style={styles.listSubtitle}>
                  {filtered.length} of {totalSkills} skills
                </Text>
              </View>

              <View style={styles.searchBox}>
                <Ionicons
                  name="search-outline"
                  size={17}
                  color={COLORS.textMuted}
                />

                <TextInput
                  value={query}
                  onChangeText={(value) => setQuery(value)}
                  placeholder="Search skills..."
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.searchInput}
                  autoCapitalize="none"
                  returnKeyType="search"
                />

                {query.length > 0 && (
                  <Pressable onPress={() => setQuery("")}>
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Loading */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.accent} />

                <Text style={styles.loadingText}>Loading skills...</Text>
              </View>
            )}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="pricetags-outline"
                    size={30}
                    color={COLORS.textMuted}
                  />
                </View>

                <Text style={styles.emptyTitle}>No skills found</Text>

                <Text style={styles.emptyText}>
                  Try another search or add a new skill.
                </Text>

                {!query && (
                  <Pressable
                    onPress={() => openForm()}
                    style={styles.emptyAddButton}
                  >
                    <Ionicons name="add" size={18} color={COLORS.accent} />

                    <Text style={styles.emptyAddText}>Add Skill</Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        }
        ListFooterComponent={<View style={styles.footer} />}
      />

      {/* Add / Edit Modal */}
      <Modal
        visible={showForm}
        transparent
        animationType="fade"
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeForm} />

          <View style={styles.formModal}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={styles.modalIcon}>
                  <Ionicons
                    name={editing ? "create-outline" : "add"}
                    size={20}
                    color={COLORS.accent}
                  />
                </View>

                <View>
                  <Text style={styles.modalTitle}>
                    {editing ? "Edit Skill" : "Add New Skill"}
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    {editing
                      ? "Keep skill names consistent across the platform."
                      : "Add a new option to the master skills catalog."}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={closeForm}
                disabled={busy}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={COLORS.textSec} />
              </Pressable>
            </View>

            {/* Input */}
            <Text style={styles.inputLabel}>Skill name</Text>

            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                setError("");
              }}
              placeholder="e.g. Docker"
              placeholderTextColor={COLORS.textMuted}
              style={[styles.skillInput, error && styles.inputError]}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={saveSkill}
            />

            <Text style={styles.inputHint}>
              Use one clear, standardized name such as “React” or “UI Design”.
            </Text>

            {/* Form Error */}
            {error && (
              <View style={styles.formError}>
                <Ionicons
                  name="warning-outline"
                  size={15}
                  color={COLORS.error}
                />

                <Text style={styles.formErrorText}>{error}</Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.modalActions}>
              <Pressable
                onPress={closeForm}
                disabled={busy}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={saveSkill}
                disabled={busy}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.buttonPressed,
                  busy && styles.disabledButton,
                ]}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name={editing ? "checkmark" : "add"}
                    size={18}
                    color="#FFFFFF"
                  />
                )}

                <Text style={styles.saveButtonText}>
                  {busy ? "Saving..." : editing ? "Save Changes" : "Add Skill"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Modal */}
      <Modal
        visible={deletingSkill !== null}
        transparent
        animationType="fade"
        onRequestClose={() => !busy && setDeletingSkill(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => !busy && setDeletingSkill(null)}
          />

          <View style={styles.deleteModal}>
            {/* Warning Icon */}
            <View style={styles.deleteIcon}>
              <Ionicons name="warning-outline" size={25} color={COLORS.error} />
            </View>

            <Text style={styles.deleteTitle}>
              Delete “{deletingSkill?.name}
              ”?
            </Text>

            <Text style={styles.deleteDescription}>
              {deletingSkill &&
              usage(deletingSkill, "students") + usage(deletingSkill, "jobs") >
                0
                ? `This skill is currently used by ${usage(
                    deletingSkill,
                    "students",
                  )} students and ${usage(
                    deletingSkill,
                    "jobs",
                  )} jobs. Deleting it may remove these relationships.`
                : "This skill is not currently linked to any students or jobs. This action cannot be undone."}
            </Text>

            {deletingSkill &&
              usage(deletingSkill, "students") + usage(deletingSkill, "jobs") >
                0 && (
                <View style={styles.warningBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={17}
                    color={COLORS.warning}
                  />

                  <Text style={styles.warningText}>
                    We recommend replacing or unlinking this skill before
                    deleting it.
                  </Text>
                </View>
              )}

            {/* Delete Actions */}
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setDeletingSkill(null)}
                disabled={busy}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={deleteSkill}
                disabled={busy}
                style={({ pressed }) => [
                  styles.deleteConfirmButton,
                  pressed && styles.buttonPressed,
                  busy && styles.disabledButton,
                ]}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="trash-outline" size={17} color="#FFFFFF" />
                )}

                <Text style={styles.saveButtonText}>
                  {busy ? "Deleting..." : "Delete Skill"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==================================================
// Styles
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F6",
  },

  listContent: {
    paddingHorizontal: 17,
    paddingTop: 10,
  },

  footer: {
    height: 30,
  },

  // -----------------------------------------------
  // Header
  // -----------------------------------------------

  header: {
    marginBottom: 17,
  },

  headerText: {
    marginBottom: 13,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  titleIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  title: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.4,
  },

  subtitle: {
    color: COLORS.textSec,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },

  addButton: {
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
    gap: 6,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  buttonPressed: {
    opacity: 0.7,
  },

  // -----------------------------------------------
  // Statistics
  // -----------------------------------------------

  statsContainer: {
    gap: 9,
    marginBottom: 15,
  },

  statCard: {
    width: 142,
    minHeight: 76,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  statIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  statLabel: {
    fontSize: 11,
    color: COLORS.textSec,
    marginTop: 2,
  },

  // -----------------------------------------------
  // Error
  // -----------------------------------------------

  errorBox: {
    backgroundColor: COLORS.errorBg,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 12,
    lineHeight: 17,
  },

  // -----------------------------------------------
  // List Header
  // -----------------------------------------------

  listHeader: {
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },

  listTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  listSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
  },

  searchBox: {
    height: 45,
    marginTop: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    paddingVertical: 0,
  },

  // -----------------------------------------------
  // Loading
  // -----------------------------------------------

  loadingContainer: {
    minHeight: 150,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: {
    fontSize: 13,
    color: COLORS.textSec,
  },

  // -----------------------------------------------
  // Empty
  // -----------------------------------------------

  emptyContainer: {
    minHeight: 250,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 12,
  },

  emptyText: {
    fontSize: 12,
    color: COLORS.textSec,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 18,
  },

  emptyAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 15,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: COLORS.accentLight,
  },

  emptyAddText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "700",
  },

  // -----------------------------------------------
  // Skill Card
  // -----------------------------------------------

  skillCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.025,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  skillTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  skillIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },

  skillAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  skillAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.accent,
  },

  skillInfo: {
    flex: 1,
  },

  skillName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  skillId: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 3,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  editButton: {
    height: 33,
    paddingHorizontal: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  editButtonText: {
    color: COLORS.info,
    fontSize: 10,
    fontWeight: "600",
  },

  deleteButton: {
    width: 33,
    height: 33,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#F5D2CF",
    backgroundColor: COLORS.errorBg,
    alignItems: "center",
    justifyContent: "center",
  },

  // -----------------------------------------------
  // Usage
  // -----------------------------------------------

  usageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },

  usageItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  usageIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  usageValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  usageLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  usageDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.divider,
    marginHorizontal: 10,
  },

  // -----------------------------------------------
  // Modal
  // -----------------------------------------------

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15,23,42,0.52)",
  },

  formModal: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 21,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 25,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  modalTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },

  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: COLORS.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textSec,
    marginTop: 3,
    lineHeight: 16,
    maxWidth: 260,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },

  skillInput: {
    height: 47,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    fontSize: 13,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  inputHint: {
    fontSize: 10,
    color: COLORS.textMuted,
    lineHeight: 15,
    marginTop: 7,
  },

  formError: {
    marginTop: 12,
    padding: 10,
    borderRadius: 9,
    backgroundColor: COLORS.errorBg,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  formErrorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 11,
    lineHeight: 16,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 9,
    marginTop: 24,
  },

  cancelButton: {
    minHeight: 43,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSec,
  },

  saveButton: {
    minHeight: 43,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  saveButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  disabledButton: {
    opacity: 0.6,
  },

  // -----------------------------------------------
  // Delete Modal
  // -----------------------------------------------

  deleteModal: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 22,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 25,
  },

  deleteIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.errorBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  deleteTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  deleteDescription: {
    color: COLORS.textSec,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },

  warningBox: {
    marginTop: 14,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.warningBg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  warningText: {
    flex: 1,
    color: COLORS.warning,
    fontSize: 11,
    lineHeight: 16,
  },

  deleteConfirmButton: {
    minHeight: 43,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
});
