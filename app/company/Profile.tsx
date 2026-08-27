import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { C, F } from "../../constants/tokens";
import {
  getCompanyProfile,
  updateCompanyProfile,
  getCompanyJobs,
  resolveMediaUrl,
} from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

const TABS = ["Overview", "Culture", "Open Roles"] as const;

type Tab = (typeof TABS)[number];

export default function CompanyProfile() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [editing, setEditing] = useState(false);

  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [logo, setLogo] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    description: "",
    website: "",
    phone: "",
    location: "",
    company_size: "",
    stage: "",
    founded_year: "",
  });

  // =========================================================
  // LOAD COMPANY + JOBS
  // =========================================================

  useEffect(() => {
    loadCompany();
    loadJobs();
  }, []);

  const loadCompany = async () => {
    try {
      const data = await getCompanyProfile();

      setCompany(data);

      setForm({
        company_name: data.name || "",
        industry: data.industry || "",
        description: data.about || "",
        website: data.website || "",
        phone: data.phone || "",
        location: data.location || "",
        company_size: data.size || "",
        stage: data.stage || "",
        founded_year: data.founded || "",
      });
    } catch (error) {
      console.log("LOAD COMPANY ERROR:", error);
      Alert.alert("Error", "Failed to load company profile.");
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const data = await getCompanyJobs();
      setJobs(data || []);
    } catch (error) {
      console.log("LOAD JOBS ERROR:", error);
    }
  };

  useSyncRefresh("company", loadCompany);
  useSyncRefresh("jobs", loadJobs);

  // =========================================================
  // IMAGE PICKER
  // =========================================================

  const pickLogo = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow access to your photos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setLogo(result.assets[0]);
      }
    } catch (error) {
      console.log("IMAGE PICKER ERROR:", error);
    }
  };

  // =========================================================
  // FORM
  // =========================================================

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const saveProfile = async () => {
    if (saving) return;

    setSaving(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (logo) {
        formData.append("logo", {
          uri: logo.uri,
          name: logo.fileName || "company-logo.jpg",
          type: logo.mimeType || "image/jpeg",
        } as any);
      }

      console.log("SAVING COMPANY PROFILE");

      const response = await updateCompanyProfile(formData);

      console.log("UPDATED COMPANY:", response);

      await loadCompany();

      setLogo(null);
      setEditing(false);

      Alert.alert("Success", "Company profile updated successfully.");
    } catch (error: any) {
      console.log("SAVE ERROR:", error);
      console.log("ERROR RESPONSE:", error?.response?.data);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to update company profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CANCEL EDIT
  // =========================================================

  const cancelEditing = () => {
    setEditing(false);
    setLogo(null);

    if (company) {
      setForm({
        company_name: company.name || "",
        industry: company.industry || "",
        description: company.about || "",
        website: company.website || "",
        phone: company.phone || "",
        location: company.location || "",
        company_size: company.size || "",
        stage: company.stage || "",
        founded_year: company.founded || "",
      });
    }
  };

  // =========================================================
  // OPEN WEBSITE
  // =========================================================

  const openWebsite = async () => {
    if (!company?.website) return;

    const url = company.website.startsWith("http")
      ? company.website
      : `https://${company.website}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log("OPEN WEBSITE ERROR:", error);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.accent} />

        <Text style={styles.loadingText}>
          Loading company profile...
        </Text>
      </View>
    );
  }

  if (!company) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          Company profile not found.
        </Text>
      </View>
    );
  }

  // =========================================================
  // LOGO
  // =========================================================

  const logoUri = logo?.uri || resolveMediaUrl(company.logo);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* =====================================================
          COMPANY HEADER
      ===================================================== */}

      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          {/* LOGO */}

          <View style={styles.logoContainer}>
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={styles.logo}
              />
            ) : (
              <Text style={styles.logoLetter}>
                {company.name?.substring(0, 1)?.toUpperCase()}
              </Text>
            )}
          </View>

          {/* EDIT BUTTON */}

          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (editing) {
                cancelEditing();
              } else {
                setEditing(true);
              }
            }}
          >
            <Text style={styles.primaryButtonText}>
              {editing ? "Cancel" : "Edit Profile"}
            </Text>
          </Pressable>
        </View>

        {/* COMPANY NAME */}

        <View style={styles.companyNameRow}>
          <Text style={styles.companyName}>
            {company.name}
          </Text>

          <Ionicons
            name="checkmark-circle"
            size={20}
            color={C.info}
          />

          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>
              Verified
            </Text>
          </View>
        </View>

        {/* INDUSTRY */}

        <Text style={styles.companySubtitle}>
          {company.industry} · {company.stage}
        </Text>

        {/* COMPANY META */}

        <View style={styles.metaContainer}>
          {company.location && (
            <View style={styles.metaItem}>
              <Ionicons
                name="location-outline"
                size={15}
                color={C.textSec}
              />

              <Text style={styles.metaText}>
                {company.location}
              </Text>
            </View>
          )}

          {company.size && (
            <View style={styles.metaItem}>
              <Ionicons
                name="people-outline"
                size={15}
                color={C.textSec}
              />

              <Text style={styles.metaText}>
                {company.size}
              </Text>
            </View>
          )}

          {company.website && (
            <Pressable
              style={styles.metaItem}
              onPress={openWebsite}
            >
              <Ionicons
                name="globe-outline"
                size={15}
                color={C.accent}
              />

              <Text style={styles.websiteText}>
                {company.website}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* =====================================================
          EDIT COMPANY
      ===================================================== */}

      {editing && (
        <View style={styles.editCard}>
          <Text style={styles.sectionTitle}>
            Edit Company Info
          </Text>

          {/* LOGO */}

          <Text style={styles.inputLabel}>
            Logo
          </Text>

          <Pressable
            style={styles.logoPicker}
            onPress={pickLogo}
          >
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={styles.selectedLogo}
              />
            ) : (
              <View style={styles.logoPickerContent}>
                <Ionicons
                  name="camera-outline"
                  size={22}
                  color={C.accent}
                />

                <Text style={styles.logoPickerText}>
                  Choose Company Logo
                </Text>
              </View>
            )}
          </Pressable>

          {/* FORM */}

          {Object.keys(form).map((key) => (
            <View
              key={key}
              style={styles.inputContainer}
            >
              <Text style={styles.inputLabel}>
                {key.replaceAll("_", " ")}
              </Text>

              <TextInput
                value={(form as any)[key] || ""}
                onChangeText={(value) =>
                  handleChange(key, value)
                }
                placeholder={`Enter ${key.replaceAll(
                  "_",
                  " "
                )}`}
                placeholderTextColor={C.textMuted}
                style={styles.input}
                multiline={
                  key === "description"
                }
                textAlignVertical={
                  key === "description"
                    ? "top"
                    : "center"
                }
              />
            </View>
          ))}

          {/* BUTTONS */}

          <View style={styles.buttonRow}>
            <Pressable
              style={[
                styles.primaryButton,
                saving && styles.disabledButton,
              ]}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Save Changes
                </Text>
              )}
            </Pressable>

            <Pressable
              style={styles.outlineButton}
              onPress={cancelEditing}
              disabled={saving}
            >
              <Text style={styles.outlineButtonText}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* =====================================================
          TABS + CONTENT
      ===================================================== */}

      <View style={styles.contentCard}>
        {/* TABS */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[
                styles.tabButton,
                tab === t && styles.activeTabButton,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === t && styles.activeTabText,
                ]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* CONTENT */}

        <View style={styles.tabContent}>
          {/* =================================================
              OVERVIEW
          ================================================= */}

          {tab === "Overview" && (
            <View>
              <Text style={styles.sectionTitle}>
                About
              </Text>

              <Text style={styles.aboutText}>
                {company.about || "No description available."}
              </Text>

              <Text style={styles.sectionTitle}>
                Company Details
              </Text>

              <View style={styles.detailsGrid}>
                {[
                  {
                    icon: "business-outline",
                    label: "Industry",
                    value: company.industry,
                  },
                  {
                    icon: "people-outline",
                    label: "Size",
                    value: company.size,
                  },
                  {
                    icon: "location-outline",
                    label: "Location",
                    value: company.location,
                  },
                  {
                    icon: "globe-outline",
                    label: "Website",
                    value: company.website,
                  },
                  {
                    icon: "checkmark-circle-outline",
                    label: "Stage",
                    value: company.stage,
                  },
                  {
                    icon: "business-outline",
                    label: "Founded",
                    value: company.founded,
                  },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={styles.detailCard}
                  >
                    <View style={styles.detailHeader}>
                      <Ionicons
                        name={item.icon as any}
                        size={15}
                        color={C.textSec}
                      />

                      <Text style={styles.detailLabel}>
                        {item.label}
                      </Text>
                    </View>

                    <Text style={styles.detailValue}>
                      {item.value || "-"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* =================================================
              CULTURE
          ================================================= */}

          {tab === "Culture" && (
            <View>
              <Text style={styles.sectionTitle}>
                Our Values
              </Text>

              <View style={styles.listContainer}>
                {(company.values || []).length === 0 ? (
                  <Text style={styles.emptyText}>
                    No values available.
                  </Text>
                ) : (
                  (company.values || []).map(
                    (value: string, index: number) => (
                      <View
                        key={`${value}-${index}`}
                        style={styles.listItem}
                      >
                        <View style={styles.bullet} />

                        <Text style={styles.listText}>
                          {value}
                        </Text>
                      </View>
                    )
                  )
                )}
              </View>

              <Text style={styles.sectionTitle}>
                Benefits
              </Text>

              <View style={styles.listContainer}>
                {(company.benefits || []).length === 0 ? (
                  <Text style={styles.emptyText}>
                    No benefits available.
                  </Text>
                ) : (
                  (company.benefits || []).map(
                    (benefit: string, index: number) => (
                      <View
                        key={`${benefit}-${index}`}
                        style={styles.listItem}
                      >
                        <View style={styles.bullet} />

                        <Text style={styles.listText}>
                          {benefit}
                        </Text>
                      </View>
                    )
                  )
                )}
              </View>
            </View>
          )}

          {/* =================================================
              OPEN ROLES
          ================================================= */}

          {tab === "Open Roles" && (
            <View style={styles.jobsContainer}>
              {jobs.length === 0 ? (
                <Text style={styles.emptyText}>
                  No open roles available.
                </Text>
              ) : (
                jobs.map((job: any) => (
                  <View
                    key={job.id}
                    style={styles.jobCard}
                  >
                    <View style={styles.jobIcon}>
                      <Ionicons
                        name="briefcase-outline"
                        size={19}
                        color={C.accent}
                      />
                    </View>

                    <View style={styles.jobInfo}>
                      <Text style={styles.jobTitle}>
                        {job.title}
                      </Text>

                      <Text style={styles.jobMeta}>
                        {job.location || "-"} ·{" "}
                        {job.type || "-"} ·{" "}
                        {job.mode || "-"}
                      </Text>

                      <View style={styles.jobBottom}>
                        <View
                          style={[
                            styles.statusBadge,
                            getStatusStyle(job.status),
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color:
                                  getStatusColor(
                                    job.status
                                  ),
                              },
                            ]}
                          >
                            {job.status || "Unknown"}
                          </Text>
                        </View>

                        <Text style={styles.applicants}>
                          {job.applicants || 0} applicants
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// =========================================================
// STATUS HELPERS
// =========================================================

const getStatusColor = (status: string) => {
  const s = status?.toLowerCase();

  if (s === "active" || s === "published" || s === "open") {
    return C.success;
  }

  if (s === "pending" || s === "awaiting") {
    return C.warning;
  }

  if (
    s === "closed" ||
    s === "rejected" ||
    s === "expired"
  ) {
    return C.error;
  }

  return C.textSec;
};

const getStatusStyle = (status: string) => {
  const color = getStatusColor(status);

  return {
    backgroundColor: color + "18",
  };
};

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  // =======================================================
  // LOADING
  // =======================================================

  loadingContainer: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: C.textSec,
    fontFamily: F,
  },

  errorText: {
    fontSize: 14,
    color: C.error,
    fontFamily: F,
  },

  // =======================================================
  // HEADER
  // =======================================================

  headerCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 16,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: C.dark,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  logoLetter: {
    fontSize: 24,
    fontWeight: "800",
    color: C.accent,
    fontFamily: F,
  },

  companyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 5,
    flexWrap: "wrap",
  },

  companyName: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  verifiedBadge: {
    backgroundColor: C.infoBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },

  verifiedText: {
    fontSize: 10,
    fontWeight: "600",
    color: C.info,
    fontFamily: F,
  },

  companySubtitle: {
    fontSize: 14,
    color: C.textSec,
    marginBottom: 12,
    fontFamily: F,
  },

  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    fontSize: 13,
    color: C.textSec,
    fontFamily: F,
  },

  websiteText: {
    fontSize: 13,
    color: C.accent,
    fontFamily: F,
  },

  // =======================================================
  // BUTTONS
  // =======================================================

  primaryButton: {
    backgroundColor: C.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: F,
  },

  outlineButton: {
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  outlineButtonText: {
    color: C.text,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: F,
  },

  disabledButton: {
    opacity: 0.6,
  },

  // =======================================================
  // EDIT
  // =======================================================

  editCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.accent,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    marginBottom: 12,
    fontFamily: F,
  },

  inputContainer: {
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textSec,
    marginBottom: 6,
    textTransform: "capitalize",
    fontFamily: F,
  },

  input: {
    width: "100%",
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    color: C.text,
    fontSize: 13,
    fontFamily: F,
  },

  logoPicker: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "dashed",
    backgroundColor: C.bg,
    overflow: "hidden",
    marginBottom: 18,
  },

  selectedLogo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  logoPickerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },

  logoPickerText: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 10,
    color: C.textSec,
    fontFamily: F,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  // =======================================================
  // CONTENT CARD
  // =======================================================

  contentCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },

  tabsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 6,
  },

  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 99,
    backgroundColor: "transparent",
  },

  activeTabButton: {
    backgroundColor: C.accent,
  },

  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textSec,
    fontFamily: F,
  },

  activeTabText: {
    color: "#fff",
  },

  tabContent: {
    borderTopWidth: 1,
    borderTopColor: C.divider,
    padding: 20,
  },

  // =======================================================
  // OVERVIEW
  // =======================================================

  aboutText: {
    fontSize: 14,
    color: C.textSec,
    lineHeight: 23,
    marginBottom: 24,
    fontFamily: F,
  },

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  detailCard: {
    width: "48%",
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    minHeight: 78,
  },

  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 7,
  },

  detailLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: "600",
    fontFamily: F,
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
    fontFamily: F,
  },

  // =======================================================
  // CULTURE
  // =======================================================

  listContainer: {
    gap: 9,
    marginBottom: 24,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
    flexShrink: 0,
  },

  listText: {
    flex: 1,
    fontSize: 14,
    color: C.textSec,
    fontFamily: F,
  },

  emptyText: {
    fontSize: 14,
    color: C.textSec,
    fontFamily: F,
  },

  // =======================================================
  // JOBS
  // =======================================================

  jobsContainer: {
    gap: 10,
  },

  jobCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
  },

  jobIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: C.accent + "15",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  jobInfo: {
    flex: 1,
  },

  jobTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
    marginBottom: 4,
    fontFamily: F,
  },

  jobMeta: {
    fontSize: 12,
    color: C.textSec,
    lineHeight: 18,
    fontFamily: F,
  },

  jobBottom: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 9,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
    fontFamily: F,
  },

  applicants: {
    fontSize: 11,
    color: C.textSec,
    fontFamily: F,
  },
});
