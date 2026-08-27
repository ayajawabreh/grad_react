import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Bell, CheckCircle2, Eye, EyeOff, Lock, LogOut, Shield, User } from "lucide-react-native";
import {
  changePassword, getNotificationSettings, getPrivacySettings, NotificationSettings,
  PrivacySettings, updateNotificationSettings, updatePrivacySettings,
} from "../../imports/settings";
import { getStudentProfile } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";
import { useAuth } from "../../context/AuthContext";
import { C, F } from "../../constants/tokens";

type TabKey = "account" | "security" | "notifications" | "privacy";

const notificationDefaults: NotificationSettings = {
  application_updates: true, interview_notifications: true, job_recommendations: true,
  messages: true, profile_views: false, resume_feedback: true, company_applications: false,
  company_messages: false, company_matches: false, company_deadlines: false,
  company_interviews: false, weekly_application_summary: false, job_deadline_reminders: true,
};

const privacyDefaults: PrivacySettings = {
  profile_visibility: true, contact_visibility: false, ai_resume_analysis: true, ai_candidate_matching: false,
};

const TABS = [
  { key: "account" as const, label: "Account", icon: User },
  { key: "security" as const, label: "Security", icon: Lock },
  { key: "notifications" as const, label: "Notifications", icon: Bell },
  { key: "privacy" as const, label: "Privacy", icon: Shield },
];

function Toggle({ value, onPress, disabled }: { value: boolean; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.toggle, { backgroundColor: value ? C.accent : "#D1D5DB", opacity: disabled ? 0.55 : 1 }]}>
    <View style={[styles.toggleThumb, { transform: [{ translateX: value ? 20 : 2 }] }]} />
  </Pressable>;
}

function SettingRow({ title, description, value, onPress, disabled, last }: {
  title: string; description: string; value: boolean; onPress: () => void; disabled?: boolean; last?: boolean;
}) {
  return <View style={[styles.settingRow, !last && styles.divider]}>
    <View style={styles.settingCopy}><Text style={styles.settingTitle}>{title}</Text><Text style={styles.settingDescription}>{description}</Text></View>
    <Toggle value={value} onPress={onPress} disabled={disabled} />
  </View>;
}

function PasswordField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.inputWrap}>
    <TextInput value={value} onChangeText={onChangeText} secureTextEntry={!visible} placeholder={`Enter ${label.toLowerCase()}`} placeholderTextColor={C.textMuted} style={[styles.input, styles.passwordInput]} />
    <Pressable style={styles.eyeButton} onPress={() => setVisible((current) => !current)}>{visible ? <EyeOff size={18} color={C.textSec} /> : <Eye size={18} color={C.textSec} />}</Pressable>
  </View></View>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionSubtitle}>{subtitle}</Text></View>;
}

export default function StudentSettings() {
  const { logout } = useAuth();
  const [tab, setTab] = useState<TabKey>("account");
  const [name, setName] = useState("Student");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(notificationDefaults);
  const [privacy, setPrivacy] = useState(privacyDefaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [password, setPassword] = useState({ current_password: "", password: "", password_confirmation: "" });

  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const load = async () => {
    try {
      const [profileResult, notificationResult, privacyResult] = await Promise.all([
        getStudentProfile(), getNotificationSettings(), getPrivacySettings(),
      ]);
      const profile = profileResult?.data ?? profileResult?.student ?? profileResult ?? {};
      setName(profile?.name ?? profile?.user?.name ?? "Student");
      setEmail(profile?.email ?? profile?.user?.email ?? "");
      setNotifications({ ...notificationDefaults, ...notificationResult });
      setPrivacy({ ...privacyDefaults, ...privacyResult });
    } catch (error) { console.warn("Failed to load student settings:", error); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  useSyncRefresh("student", load);

  const updateNotification = async (key: keyof NotificationSettings) => {
    const previous = notifications; const value = !notifications[key];
    setNotifications((current) => ({ ...current, [key]: value })); setSaving(`n-${key}`);
    try { await updateNotificationSettings({ [key]: value }); flashSaved(); }
    catch { setNotifications(previous); Alert.alert("Could not save", "Please try again."); }
    finally { setSaving(null); }
  };

  const updatePrivacy = async (key: keyof PrivacySettings) => {
    const previous = privacy; const value = !privacy[key];
    setPrivacy((current) => ({ ...current, [key]: value })); setSaving(`p-${key}`);
    try { await updatePrivacySettings({ [key]: value }); flashSaved(); }
    catch { setPrivacy(previous); Alert.alert("Could not save", "Please try again."); }
    finally { setSaving(null); }
  };

  const updatePassword = async () => {
    if (!password.current_password || !password.password) return Alert.alert("Missing information", "Enter your current and new password.");
    if (password.password.length < 8) return Alert.alert("Password too short", "The new password must have at least 8 characters.");
    if (password.password !== password.password_confirmation) return Alert.alert("Passwords do not match", "Confirm your new password again.");
    try {
      setPasswordSaving(true); await changePassword(password);
      setPassword({ current_password: "", password: "", password_confirmation: "" }); flashSaved();
      Alert.alert("Password updated", "Your password was changed successfully.");
    } catch (error: any) { Alert.alert("Could not update password", error?.response?.data?.message || "Please try again."); }
    finally { setPasswordSaving(false); }
  };

  const signOut = () => Alert.alert("Sign out", "Are you sure you want to sign out?", [
    { text: "Cancel", style: "cancel" }, { text: "Sign out", style: "destructive", onPress: () => void logout() },
  ]);

  if (loading) return <View style={styles.loader}><ActivityIndicator color={C.accent} /></View>;

  return <View style={styles.container}>
    <View style={styles.header}><View><Text style={styles.title}>Settings</Text><Text style={styles.subtitle}>Manage your student account</Text></View>
      {saved && <View style={styles.savedBadge}><CheckCircle2 size={15} color={C.success} /><Text style={styles.savedText}>Saved</Text></View>}
    </View>
    <View style={styles.tabs}>{TABS.map(({ key, label, icon: Icon }) => {
      const active = tab === key; return <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, active && styles.activeTab]}>
        <Icon size={16} color={active ? C.accent : C.textSec} /><Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
      </Pressable>;
    })}</View>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {tab === "account" && <View>
        <SectionTitle title="Account" subtitle="Your student account information" />
        <View style={styles.profileCard}><View style={styles.avatar}><Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.profileCopy}><Text style={styles.profileName}>{name}</Text><Text style={styles.profileEmail}>{email}</Text></View></View>
        <View style={styles.field}><Text style={styles.fieldLabel}>Full Name</Text><TextInput value={name} editable={false} style={[styles.input, styles.readonly]} /></View>
        <View style={styles.field}><Text style={styles.fieldLabel}>Email Address</Text><TextInput value={email} editable={false} style={[styles.input, styles.readonly]} /></View>
        <View style={styles.field}><Text style={styles.fieldLabel}>Role</Text><TextInput value="Student" editable={false} style={[styles.input, styles.readonly]} /></View>
        <View style={styles.dangerCard}><View style={styles.settingCopy}><Text style={styles.settingTitle}>Sign out</Text><Text style={styles.settingDescription}>Sign out of your CareerBridge account on this device.</Text></View><Pressable style={styles.logoutButton} onPress={signOut}><LogOut size={15} color={C.error} /><Text style={styles.logoutText}>Sign out</Text></Pressable></View>
      </View>}

      {tab === "security" && <View>
        <SectionTitle title="Security" subtitle="Update your account password" />
        <PasswordField label="Current Password" value={password.current_password} onChangeText={(value) => setPassword((current) => ({ ...current, current_password: value }))} />
        <PasswordField label="New Password" value={password.password} onChangeText={(value) => setPassword((current) => ({ ...current, password: value }))} />
        <PasswordField label="Confirm New Password" value={password.password_confirmation} onChangeText={(value) => setPassword((current) => ({ ...current, password_confirmation: value }))} />
        <Pressable disabled={passwordSaving} onPress={updatePassword} style={[styles.primaryButton, passwordSaving && styles.disabled]}>{passwordSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Update Password</Text>}</Pressable>
      </View>}

      {tab === "notifications" && <View>
        <SectionTitle title="Notifications" subtitle="Choose which updates you want to receive" />
        <View style={styles.settingsCard}>
          <SettingRow title="Application Updates" description="Status changes to your applications." value={notifications.application_updates} disabled={saving === "n-application_updates"} onPress={() => void updateNotification("application_updates")} />
          <SettingRow title="Interview Notifications" description="Interview invitations and reminders." value={notifications.interview_notifications} disabled={saving === "n-interview_notifications"} onPress={() => void updateNotification("interview_notifications")} />
          <SettingRow title="Job Recommendations" description="New jobs matching your profile." value={notifications.job_recommendations} disabled={saving === "n-job_recommendations"} onPress={() => void updateNotification("job_recommendations")} />
          <SettingRow title="Messages" description="Messages from employers and recruiters." value={notifications.messages} disabled={saving === "n-messages"} onPress={() => void updateNotification("messages")} last />
        </View>
      </View>}

      {tab === "privacy" && <View>
        <SectionTitle title="Privacy" subtitle="Control your profile visibility and AI preferences" />
        <View style={styles.settingsCard}>
          <SettingRow title="Public Profile" description="Allow employers to view your profile." value={privacy.profile_visibility} disabled={saving === "p-profile_visibility"} onPress={() => void updatePrivacy("profile_visibility")} />
          <SettingRow title="Contact Details" description="Show your contact details on your profile." value={privacy.contact_visibility} disabled={saving === "p-contact_visibility"} onPress={() => void updatePrivacy("contact_visibility")} />
          <SettingRow title="AI Resume Analysis" description="Use AI for resume recommendations." value={privacy.ai_resume_analysis} disabled={saving === "p-ai_resume_analysis"} onPress={() => void updatePrivacy("ai_resume_analysis")} last />
        </View>
      </View>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg }, loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  header: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: F, fontSize: 24, fontWeight: "900", color: C.text }, subtitle: { marginTop: 4, fontFamily: F, fontSize: 12, color: C.textSec },
  savedBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: C.successBg }, savedText: { fontFamily: F, fontSize: 11, fontWeight: "700", color: C.success },
  tabs: { paddingHorizontal: 18, paddingBottom: 14, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tab: { width: "48%", flexGrow: 1, minHeight: 46, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  activeTab: { borderColor: C.accentLight, backgroundColor: C.accentLight }, tabText: { fontFamily: F, fontSize: 12, fontWeight: "500", color: C.textSec }, activeTabText: { fontWeight: "700", color: C.accent },
  scroll: { flex: 1 }, content: { paddingHorizontal: 18, paddingBottom: 44 }, sectionHeader: { marginBottom: 20 }, sectionTitle: { fontFamily: F, fontSize: 18, fontWeight: "800", color: C.text }, sectionSubtitle: { marginTop: 4, fontFamily: F, fontSize: 12, color: C.textSec },
  profileCard: { marginBottom: 18, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, flexDirection: "row", alignItems: "center", gap: 12 }, avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" }, avatarText: { fontFamily: F, fontSize: 20, fontWeight: "800", color: "#fff" }, profileCopy: { flex: 1 }, profileName: { fontFamily: F, fontSize: 15, fontWeight: "800", color: C.text }, profileEmail: { marginTop: 3, fontFamily: F, fontSize: 12, color: C.textSec },
  field: { marginBottom: 15 }, fieldLabel: { marginBottom: 7, fontFamily: F, fontSize: 12, fontWeight: "700", color: C.text }, inputWrap: { position: "relative" }, input: { minHeight: 48, paddingHorizontal: 13, borderRadius: 11, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, fontFamily: F, fontSize: 13, color: C.text }, readonly: { backgroundColor: C.bg, color: C.textSec }, passwordInput: { paddingRight: 46 }, eyeButton: { position: "absolute", right: 0, top: 0, bottom: 0, width: 44, alignItems: "center", justifyContent: "center" },
  settingsCard: { overflow: "hidden", borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }, settingRow: { minHeight: 78, paddingHorizontal: 15, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 12 }, divider: { borderBottomWidth: 1, borderBottomColor: C.divider }, settingCopy: { flex: 1 }, settingTitle: { fontFamily: F, fontSize: 13, fontWeight: "700", color: C.text }, settingDescription: { marginTop: 4, fontFamily: F, fontSize: 11.5, lineHeight: 17, color: C.textSec },
  toggle: { width: 46, height: 26, borderRadius: 13, justifyContent: "center" }, toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 2, elevation: 2 },
  primaryButton: { minHeight: 46, marginTop: 5, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: C.accent }, primaryText: { fontFamily: F, fontSize: 13, fontWeight: "800", color: "#fff" }, disabled: { opacity: 0.55 },
  dangerCard: { marginTop: 22, padding: 15, borderRadius: 14, borderWidth: 1, borderColor: "#FECACA", backgroundColor: "#FEF2F2", flexDirection: "row", alignItems: "center", gap: 12 }, logoutButton: { minHeight: 38, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, borderColor: "#FECACA", backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 6 }, logoutText: { fontFamily: F, fontSize: 12, fontWeight: "700", color: C.error },
});
