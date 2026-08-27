import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  BadgeCheck,
  Bell,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Shield,
  Trash2,
  User,
  X,
} from "lucide-react-native";

import { C, F } from "../../constants/tokens";
import { useAuth } from "../../context/AuthContext";

import {
  changePassword,
  deleteAccount,
  getNotificationSettings,
  getPrivacySettings,
  updateNotificationSettings,
  updatePrivacySettings,
} from "../../imports/settings";
import { getCompanyProfile } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

interface CompanySettingsViewProps {
  name: string;
  email: string;
  accountStatus?: "approved" | "pending";
  verified?: boolean;
  onLogout: () => void;
}

interface CompanyNotificationSettings {
  company_applications: boolean;
  company_interviews: boolean;
  company_messages: boolean;
  weekly_application_summary: boolean;
  company_deadlines: boolean;
  company_matches: boolean;
}

interface CompanyPrivacySettings {
  company_profile_public: boolean;
  ai_candidate_matching: boolean;
  analytics_reports: boolean;
}

type TabKey = "account" | "security" | "notifications" | "privacy";

export default function CompanySettingsScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const company = (user?.company ?? {}) as Record<string, unknown>;

  useSyncRefresh("company", async () => {
    const data = await getCompanyProfile();
    setProfile((data?.company ?? data) as Record<string, any>);
  });

  useEffect(() => {
    let mounted = true;

    getCompanyProfile()
      .then((data) => {
        if (mounted) {
          setProfile((data?.company ?? data) as Record<string, any>);
        }
      })
      .catch((error) => {
        console.log("LOAD SETTINGS COMPANY ERROR:", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const profileUser = profile?.user ?? {};
  const companyUser =
    (company.user as Record<string, unknown> | undefined) ?? {};
  const approvalStatus = String(
    profile?.approval_status ?? company.approval_status ?? "pending",
  ).toLowerCase();

  return (
    <CompanySettingsView
      name={String(
        profile?.name ??
          profile?.company_name ??
          company.company_name ??
          company.name ??
          user?.name ??
          "",
      )}
      email={String(
        profile?.email ??
          profile?.contact_email ??
          profile?.email_address ??
          profileUser.email ??
          company.email ??
          company.contact_email ??
          companyUser.email ??
          user?.email ??
          "",
      )}
      accountStatus={approvalStatus === "approved" ? "approved" : "pending"}
      verified={Boolean(profile?.is_verified ?? company.is_verified)}
      onLogout={() => void logout()}
    />
  );
}

const TABS: {
  k: TabKey;
  l: string;
  icon: any;
}[] = [
  { k: "account", l: "Account", icon: User },
  { k: "security", l: "Security", icon: Lock },
  { k: "notifications", l: "Notifications", icon: Bell },
  { k: "privacy", l: "Privacy", icon: Shield },
];

const NOTIFICATION_FIELDS: {
  k: keyof CompanyNotificationSettings;
  l: string;
  d: string;
}[] = [
  {
    k: "company_applications",
    l: "New Job Applications",
    d: "Receive an alert when a candidate applies to one of your jobs",
  },
  {
    k: "company_interviews",
    l: "Interview Reminders",
    d: "Get reminders for scheduled candidate interviews",
  },
  {
    k: "company_messages",
    l: "New Messages",
    d: "Receive alerts for new messages from candidates",
  },
  {
    k: "weekly_application_summary",
    l: "Weekly Application Summary",
    d: "Receive a weekly summary of applications and activity",
  },
  {
    k: "company_deadlines",
    l: "Job Deadline Reminders",
    d: "Get notified before a job posting expires",
  },
  {
    k: "company_matches",
    l: "AI Candidate Match Alerts",
    d: "Receive alerts when AI finds strong candidate matches",
  },
];

const PRIVACY_FIELDS: {
  k: keyof CompanyPrivacySettings;
  l: string;
  d: string;
}[] = [
  {
    k: "company_profile_public",
    l: "Show Company Profile Publicly",
    d: "Allow candidates to view your company profile",
  },
  {
    k: "ai_candidate_matching",
    l: "Allow AI Candidate Matching",
    d: "Use AI to recommend suitable candidates for your jobs",
  },
  {
    k: "analytics_reports",
    l: "Receive Analytics Reports",
    d: "Receive reports about jobs, applications, and hiring activity",
  },
];

/* -------------------------------------------------------------------------- */
/* Native Button                                                              */
/* -------------------------------------------------------------------------- */

interface NativeButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "outline" | "danger";
  disabled?: boolean;
  icon?: any;
  small?: boolean;
}

function NativeButton({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  icon: Icon,
  small = false,
}: NativeButtonProps) {
  const background =
    variant === "danger"
      ? C.error
      : variant === "outline"
        ? C.surface
        : C.accent;

  const borderColor =
    variant === "outline"
      ? C.border
      : variant === "danger"
        ? C.error
        : C.accent;

  const textColor = variant === "outline" ? C.text : "#ffffff";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        {
          backgroundColor: background,
          borderColor,
          opacity: disabled ? 0.55 : pressed ? 0.75 : 1,
        },
      ]}
    >
      {Icon && (
        <Icon size={small ? 14 : 16} color={textColor} strokeWidth={2} />
      )}

      <Text
        style={[
          styles.buttonText,
          small && styles.buttonTextSmall,
          { color: textColor },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Native Toggle                                                              */
/* -------------------------------------------------------------------------- */

function NativeToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: () => void;
}) {
  return (
    <Pressable
      onPress={onChange}
      style={[
        styles.toggle,
        {
          backgroundColor: value ? C.accent : "#d1d5db",
        },
      ]}
    >
      <View
        style={[
          styles.toggleThumb,
          {
            transform: [
              {
                translateX: value ? 20 : 2,
              },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Input                                                                      */
/* -------------------------------------------------------------------------- */

function Field({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  editable = true,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  secureTextEntry?: boolean;
  editable?: boolean;
  placeholder?: string;
}) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !passwordVisible}
          editable={editable}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          style={[
            styles.input,
            secureTextEntry && styles.passwordInput,
            !editable && {
              backgroundColor: C.bg,
            },
          ]}
        />

        {secureTextEntry && (
          <Pressable
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.eyeButton}
          >
            {passwordVisible ? (
              <EyeOff size={18} color={C.textSec} />
            ) : (
              <Eye size={18} color={C.textSec} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function CompanySettingsView({
  name,
  email,
  accountStatus = "pending",
  verified = false,
  onLogout,
}: CompanySettingsViewProps) {
  const [tab, setTab] = useState<TabKey>("account");

  const [saved, setSaved] = useState(false);

  const [notifSettings, setNotifSettings] =
    useState<CompanyNotificationSettings | null>(null);

  const [notifLoading, setNotifLoading] = useState(false);

  const [privacySettings, setPrivacySettings] =
    useState<CompanyPrivacySettings | null>(null);

  const [privacyLoading, setPrivacyLoading] = useState(false);

  const [pwForm, setPwForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* Saved message                                                            */
  /* ------------------------------------------------------------------------ */

  const flashSaved = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  /* ------------------------------------------------------------------------ */
  /* Notifications                                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (tab !== "notifications" || notifSettings) {
      return;
    }

    setNotifLoading(true);

    getNotificationSettings()
      .then((res: any) => {
        const parsed: CompanyNotificationSettings = {
          company_applications: Boolean(res?.company_applications),
          company_interviews: Boolean(res?.company_interviews),
          company_messages: Boolean(res?.company_messages),
          weekly_application_summary: Boolean(res?.weekly_application_summary),
          company_deadlines: Boolean(res?.company_deadlines),
          company_matches: Boolean(res?.company_matches),
        };

        setNotifSettings(parsed);
      })
      .catch(() => {
        Alert.alert("Error", "Failed to load notification settings.");
      })
      .finally(() => {
        setNotifLoading(false);
      });
  }, [tab, notifSettings]);

  /* ------------------------------------------------------------------------ */
  /* Privacy                                                                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (tab !== "privacy" || privacySettings) {
      return;
    }

    setPrivacyLoading(true);

    getPrivacySettings()
      .then((res: any) => {
        const parsed: CompanyPrivacySettings = {
          company_profile_public: Boolean(res?.company_profile_public),
          ai_candidate_matching: Boolean(res?.ai_candidate_matching),
          analytics_reports: Boolean(res?.analytics_reports),
        };

        setPrivacySettings(parsed);
      })
      .catch(() => {
        Alert.alert("Error", "Failed to load privacy settings.");
      })
      .finally(() => {
        setPrivacyLoading(false);
      });
  }, [tab, privacySettings]);

  /* ------------------------------------------------------------------------ */
  /* Notification Toggle                                                      */
  /* ------------------------------------------------------------------------ */

  const handleToggleNotif = async (key: keyof CompanyNotificationSettings) => {
    if (!notifSettings) {
      return;
    }

    const previous = notifSettings;

    const updated = {
      ...notifSettings,
      [key]: !Boolean(notifSettings[key]),
    };

    setNotifSettings(updated);

    try {
      await updateNotificationSettings({
        [key]: updated[key],
      } as any);

      flashSaved();
    } catch {
      setNotifSettings(previous);

      Alert.alert("Error", "Failed to update notification setting.");
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Privacy Toggle                                                           */
  /* ------------------------------------------------------------------------ */

  const handleTogglePrivacy = async (key: keyof CompanyPrivacySettings) => {
    if (!privacySettings) {
      return;
    }

    const previous = privacySettings;

    const updated = {
      ...privacySettings,
      [key]: !Boolean(privacySettings[key]),
    };

    setPrivacySettings(updated);

    try {
      await updatePrivacySettings({
        [key]: updated[key],
      } as any);

      flashSaved();
    } catch {
      setPrivacySettings(previous);

      Alert.alert("Error", "Failed to update privacy setting.");
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Change Password                                                          */
  /* ------------------------------------------------------------------------ */

  const handleChangePassword = async () => {
    setPwError("");

    if (!pwForm.current_password) {
      setPwError("Current password is required");
      return;
    }

    if (pwForm.password !== pwForm.password_confirmation) {
      setPwError("Passwords do not match");
      return;
    }

    if (pwForm.password.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }

    setPwSaving(true);

    try {
      await changePassword(pwForm);

      setPwForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });

      flashSaved();

      Alert.alert("Success", "Your password has been updated successfully.");
    } catch (err: any) {
      setPwError(err?.response?.data?.message || "Failed to update password");
    } finally {
      setPwSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Delete Account                                                           */
  /* ------------------------------------------------------------------------ */

  const handleDeleteAccount = async () => {
    setDeleteError("");

    if (!deletePassword) {
      setDeleteError("Password is required");
      return;
    }

    setDeleting(true);

    try {
      await deleteAccount(deletePassword);

      setShowDeleteModal(false);

      onLogout();
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.message || "Failed to delete company account",
      );

      setDeleting(false);
    }
  };

  const confirmDeleteAccount = () => {
    setDeletePassword("");
    setDeleteError("");
    setShowDeleteModal(true);
  };

  /* ------------------------------------------------------------------------ */
  /* Status                                                                    */
  /* ------------------------------------------------------------------------ */

  const statusLabel = accountStatus === "approved" ? "Approved" : "Pending";

  const statusColor = accountStatus === "approved" ? C.success : "#d97706";

  const statusBackground =
    accountStatus === "approved" ? C.successBg : "#fef3c7";

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Settings</Text>

          <Text style={styles.subtitle}>Manage your company account</Text>
        </View>

        {saved && (
          <View style={styles.savedBadge}>
            <CheckCircle2 size={15} color={C.success} />

            <Text style={styles.savedText}>Saved</Text>
          </View>
        )}
      </View>

      {/* Tabs */}

      <View style={styles.tabsContainer}>
        {TABS.map(({ k, l, icon: Icon }) => {
          const active = tab === k;

          return (
            <Pressable
              key={k}
              onPress={() => setTab(k)}
              style={[
                styles.tab,
                active && {
                  backgroundColor: C.accentLight,
                  borderColor: C.accentLight,
                },
              ]}
            >
              <Icon size={16} color={active ? C.accent : C.textSec} />

              <Text
                style={[
                  styles.tabText,
                  {
                    color: active ? C.accent : C.textSec,
                    fontWeight: active ? "700" : "500",
                  },
                ]}
              >
                {l}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================ */}
        {/* ACCOUNT                                                           */}
        {/* ================================================================ */}

        {tab === "account" && (
          <View>
            <SectionTitle
              title="Account"
              subtitle="Your company account information"
            />

            <Field label="Company Name" value={name || ""} editable={false} />

            <Field label="Email Address" value={email || ""} editable={false} />

            <Field label="Role" value="Company" editable={false} />

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Account Status</Text>

              <View style={styles.statusField}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: statusBackground,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: statusColor,
                      },
                    ]}
                  >
                    {statusLabel}
                  </Text>
                </View>
              </View>
            </View>

            {verified && (
              <View style={styles.verifiedRow}>
                <BadgeCheck size={19} color={C.success} />

                <Text style={styles.verifiedText}>Verified Company</Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Company information can be updated from the Company Profile
                page.
              </Text>
            </View>
          </View>
        )}

        {/* ================================================================ */}
        {/* SECURITY                                                          */}
        {/* ================================================================ */}

        {tab === "security" && (
          <View>
            <SectionTitle
              title="Security"
              subtitle="Manage your password and account security"
            />

            {pwError !== "" && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{pwError}</Text>
              </View>
            )}

            <Field
              label="Current Password"
              value={pwForm.current_password}
              secureTextEntry
              onChangeText={(value) =>
                setPwForm({
                  ...pwForm,
                  current_password: value,
                })
              }
              placeholder="Enter current password"
            />

            <Field
              label="New Password"
              value={pwForm.password}
              secureTextEntry
              onChangeText={(value) =>
                setPwForm({
                  ...pwForm,
                  password: value,
                })
              }
              placeholder="Enter new password"
            />

            <Field
              label="Confirm Password"
              value={pwForm.password_confirmation}
              secureTextEntry
              onChangeText={(value) =>
                setPwForm({
                  ...pwForm,
                  password_confirmation: value,
                })
              }
              placeholder="Confirm new password"
            />

            <NativeButton
              icon={Lock}
              onPress={handleChangePassword}
              disabled={pwSaving}
            >
              {pwSaving ? "Updating..." : "Update Password"}
            </NativeButton>

            {/* 2FA */}

            <View style={styles.securityCard}>
              <View style={styles.securityIcon}>
                <Shield size={18} color={C.accent} />
              </View>

              <View style={styles.securityTextContainer}>
                <Text style={styles.securityTitle}>
                  Two-Factor Authentication
                </Text>

                <Text style={styles.securityDescription}>
                  Add extra security to your company account
                </Text>
              </View>

              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            </View>
          </View>
        )}

        {/* ================================================================ */}
        {/* NOTIFICATIONS                                                     */}
        {/* ================================================================ */}

        {tab === "notifications" && (
          <View>
            <SectionTitle
              title="Notification Preferences"
              subtitle="Choose which notifications you want to receive"
            />

            {notifLoading && !notifSettings && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={C.accent} />

                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            )}

            {notifSettings && (
              <View>
                {NOTIFICATION_FIELDS.map(({ k, l, d }, index) => (
                  <SettingRow
                    key={k}
                    title={l}
                    description={d}
                    value={Boolean(notifSettings[k])}
                    onChange={() => handleToggleNotif(k)}
                    last={index === NOTIFICATION_FIELDS.length - 1}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ================================================================ */}
        {/* PRIVACY                                                           */}
        {/* ================================================================ */}

        {tab === "privacy" && (
          <View>
            <SectionTitle
              title="Privacy & Data"
              subtitle="Control how your company information is used"
            />

            {privacyLoading && !privacySettings && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={C.accent} />

                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            )}

            {privacySettings && (
              <View>
                {PRIVACY_FIELDS.map(({ k, l, d }, index) => (
                  <SettingRow
                    key={k}
                    title={l}
                    description={d}
                    value={Boolean(privacySettings[k])}
                    onChange={() => handleTogglePrivacy(k)}
                    last={index === PRIVACY_FIELDS.length - 1}
                  />
                ))}
              </View>
            )}

            {/* Danger Zone */}

            <View style={styles.dangerSection}>
              <View style={styles.dangerHeader}>
                <Trash2 size={18} color={C.error} />

                <Text style={styles.dangerTitle}>Danger Zone</Text>
              </View>

              <Text style={styles.dangerDescription}>
                Deleting your company account is permanent and cannot be undone.
              </Text>

              <NativeButton
                variant="danger"
                icon={Trash2}
                onPress={confirmDeleteAccount}
              >
                Delete Company Account
              </NativeButton>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ================================================================== */}
      {/* DELETE MODAL                                                       */}
      {/* ================================================================== */}

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) {
            setShowDeleteModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}

            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalDangerIcon}>
                  <Trash2 size={19} color={C.error} />
                </View>

                <Text style={styles.modalTitle}>Delete Company Account</Text>
              </View>

              {!deleting && (
                <Pressable
                  onPress={() => setShowDeleteModal(false)}
                  style={styles.modalClose}
                >
                  <X size={18} color={C.textSec} />
                </Pressable>
              )}
            </View>

            <Text style={styles.modalDescription}>
              This action is permanent and cannot be undone. Enter your password
              to confirm.
            </Text>

            {deleteError !== "" && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{deleteError}</Text>
              </View>
            )}

            <View style={styles.modalField}>
              <Text style={styles.fieldLabel}>Password</Text>

              <TextInput
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
                placeholder="Enter your password"
                placeholderTextColor={C.textMuted}
                editable={!deleting}
                style={styles.input}
              />
            </View>

            <View style={styles.modalActions}>
              <NativeButton
                variant="outline"
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
                disabled={deleting}
                small
              >
                Cancel
              </NativeButton>

              <NativeButton
                variant="danger"
                onPress={handleDeleteAccount}
                disabled={deleting}
                small
                icon={deleting ? undefined : Trash2}
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </NativeButton>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ========================================================================== */
/* Section Title                                                              */
/* ========================================================================== */

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionTitleContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

/* ========================================================================== */
/* Setting Row                                                                */
/* ========================================================================== */

function SettingRow({
  title,
  description,
  value,
  onChange,
  last = false,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: () => void;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.settingRow,
        !last && {
          borderBottomWidth: 1,
          borderBottomColor: C.divider,
        },
      ]}
    >
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>

        <Text style={styles.settingDescription}>{description}</Text>
      </View>

      <NativeToggle value={value} onChange={onChange} />
    </View>
  );
}

/* ========================================================================== */
/* Styles                                                                     */
/* ========================================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    fontFamily: F,
  },

  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: C.text,
    fontFamily: F,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: C.textSec,
    fontFamily: F,
  },

  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: C.successBg,
  },

  savedText: {
    color: C.success,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: F,
  },

  /* Tabs */

  tabsContainer: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tab: {
    width: "48%",
    flexGrow: 1,
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  tabText: {
    fontSize: 12,
    fontFamily: F,
  },

  /* Content */

  contentScroll: {
    flex: 1,
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },

  sectionTitleContainer: {
    marginTop: 8,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    fontFamily: F,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: C.textSec,
    fontFamily: F,
  },

  /* Fields */

  fieldContainer: {
    marginBottom: 15,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
    marginBottom: 7,
    fontFamily: F,
  },

  input: {
    width: "100%",
    minHeight: 45,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    color: C.text,
    fontSize: 13,
    fontFamily: F,
  },

  inputContainer: {
    position: "relative",
  },

  passwordInput: {
    paddingRight: 46,
  },

  eyeButton: {
    position: "absolute",
    right: 5,
    top: 5,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  statusField: {
    minHeight: 45,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    justifyContent: "center",
    paddingHorizontal: 13,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: F,
  },

  /* Verified */

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 2,
    marginBottom: 15,
  },

  verifiedText: {
    color: C.success,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: F,
  },

  infoBox: {
    padding: 13,
    borderRadius: 11,
    backgroundColor: C.accentLight,
    borderWidth: 1,
    borderColor: C.accentLight,
  },

  infoText: {
    color: C.textSec,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: F,
  },

  /* Buttons */

  button: {
    minHeight: 43,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    alignSelf: "flex-start",
  },

  buttonSmall: {
    minHeight: 37,
    paddingHorizontal: 12,
    borderRadius: 9,
  },

  buttonText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: F,
  },

  buttonTextSmall: {
    fontSize: 11,
  },

  /* Error */

  errorBox: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 15,
  },

  errorText: {
    color: C.error,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: F,
  },

  /* Security */

  securityCard: {
    marginTop: 25,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    flexDirection: "row",
    alignItems: "center",
  },

  securityIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  securityTextContainer: {
    flex: 1,
    paddingRight: 8,
  },

  securityTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  securityDescription: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: C.textSec,
    fontFamily: F,
  },

  comingSoonBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },

  comingSoonText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textMuted,
    fontFamily: F,
  },

  /* Loading */

  loadingContainer: {
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  loadingText: {
    fontSize: 12,
    color: C.textSec,
    fontFamily: F,
  },

  /* Settings */

  settingRow: {
    minHeight: 78,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  settingTextContainer: {
    flex: 1,
    paddingRight: 8,
  },

  settingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  settingDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: C.textSec,
    fontFamily: F,
  },

  /* Toggle */

  toggle: {
    width: 44,
    height: 25,
    borderRadius: 20,
    justifyContent: "center",
    flexShrink: 0,
  },

  toggleThumb: {
    width: 21,
    height: 21,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    elevation: 2,
  },

  /* Danger */

  dangerSection: {
    marginTop: 28,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },

  dangerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 7,
  },

  dangerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: C.error,
    fontFamily: F,
  },

  dangerDescription: {
    fontSize: 11,
    lineHeight: 17,
    color: C.textSec,
    marginBottom: 13,
    fontFamily: F,
  },

  /* Modal */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalContainer: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  modalDangerIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: C.text,
    fontFamily: F,
  },

  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  modalDescription: {
    marginTop: 14,
    marginBottom: 17,
    fontSize: 12,
    lineHeight: 18,
    color: C.textSec,
    fontFamily: F,
  },

  modalField: {
    marginBottom: 18,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
});
