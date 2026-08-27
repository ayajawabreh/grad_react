import { useState, useEffect } from "react";
import { User, Lock, Bell, Shield, LogOut, Upload } from "lucide-react";
import { C, F } from "../../constants/tokens";
import { Btn, Toggle } from "../ui";
import { PasswordInput } from "./PasswordInput";
import { toast } from "sonner";
import {
  changePassword,
  getNotificationSettings,
  updateNotificationSettings,
  getPrivacySettings,
  updatePrivacySettings,
  deleteAccount,
  NotificationSettings,
  PrivacySettings,
} from "../../imports/settings";

interface SettingsViewProps {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  role: "student" | "company" | "admin";
  onLogout: () => void;
}

const TABS = [
  { k: "profile", l: "Profile Settings", icon: User },
  { k: "security", l: "Security", icon: Lock },
  { k: "notifications", l: "Notifications", icon: Bell },
  { k: "privacy", l: "Privacy", icon: Shield },
];

type SettingField<T> = { k: keyof T; l: string; d: string };

const STUDENT_NOTIF_FIELDS: SettingField<NotificationSettings>[] = [
  { k: "application_updates", l: "Application Updates", d: "Get notified about your application status changes" },
  { k: "interview_notifications", l: "Interview Notifications", d: "Alerts about interview invites and scheduling" },
  { k: "job_recommendations", l: "Job Recommendations", d: "Get notified of new matching jobs" },
  { k: "messages", l: "Messages", d: "New message alerts" },
  { k: "profile_views", l: "Profile Views", d: "When someone views your profile" },
  { k: "resume_feedback", l: "Resume Feedback", d: "AI feedback and suggestions on your resume" },
  { k: "job_deadline_reminders", l: "Job Deadline Reminders", d: "Receive job deadline notifications" },
];

const COMPANY_NOTIF_FIELDS: SettingField<NotificationSettings>[] = [
  { k: "company_applications", l: "New Applications", d: "Receive notifications when candidates apply" },
  { k: "company_messages", l: "Company Messages", d: "Receive new message notifications" },
  { k: "company_matches", l: "Matching Candidates", d: "Get notified about matching candidates" },
  { k: "company_deadlines", l: "Job Deadlines", d: "Receive deadline reminders" },
  { k: "company_interviews", l: "Interview Reminders", d: "Get reminders about interviews" },
  { k: "weekly_application_summary", l: "Weekly Application Summary", d: "Receive weekly application reports" },
];

const ADMIN_NOTIF_FIELDS: SettingField<NotificationSettings>[] = [
  { k: "new_student_registration", l: "New Student Registration", d: "Notify me when a new student joins the platform" },
  { k: "new_company_registration", l: "New Company Registration", d: "Notify me when a company registers for review" },
  { k: "job_pending_approval", l: "Job Pending Approval", d: "Alert me when a job requires moderation" },
  { k: "abuse_reports", l: "Abuse Reports", d: "Notify me about new abuse and safety reports" },
  { k: "system_alerts", l: "System Alerts", d: "Receive important platform and security alerts" },
  { k: "admin_messages", l: "Admin Messages", d: "Receive messages addressed to administrators" },
];

const STUDENT_PRIVACY_FIELDS: SettingField<PrivacySettings>[] = [
  { k: "profile_visibility", l: "Public Profile", d: "Allow others to view your profile" },
  { k: "contact_visibility", l: "Contact Info Visibility", d: "Show your contact details to others" },
  { k: "ai_resume_analysis", l: "AI-Enhanced Matching", d: "Use AI to improve match recommendations" },
];

const COMPANY_PRIVACY_FIELDS: SettingField<PrivacySettings>[] = [
  { k: "profile_visibility", l: "Public Profile", d: "Allow others to view your company profile" },
  { k: "contact_visibility", l: "Contact Info Visibility", d: "Show company contact details to others" },
  { k: "ai_candidate_matching", l: "AI Candidate Matching", d: "Allow AI models to consider your company for candidate matching" },
];

const ADMIN_PRIVACY_FIELDS: SettingField<PrivacySettings>[] = [
  { k: "profile_visibility", l: "Profile Visibility", d: "Control whether your administrator profile is visible to other administrators" },
];

export function SettingsView({
  name,
  email,
  phone,
  location,
  role,
  onLogout
}: SettingsViewProps) {
  const [tab, setTab] = useState("profile");
  const [saved, setSaved] = useState(false);

  const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);

  const [pwForm, setPwForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const notificationFields = role === "admin" ? ADMIN_NOTIF_FIELDS : role === "company" ? COMPANY_NOTIF_FIELDS : STUDENT_NOTIF_FIELDS;
  const privacyFields = role === "admin" ? ADMIN_PRIVACY_FIELDS : role === "company" ? COMPANY_PRIVACY_FIELDS : STUDENT_PRIVACY_FIELDS;

  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  useEffect(() => {
    if (tab === "notifications" && !notifSettings) {
      setNotifLoading(true);
      getNotificationSettings()
        .then((res: any) => {
          const settings = res.data ?? res;
          if (role === "admin") {
            const defaults = Object.fromEntries(ADMIN_NOTIF_FIELDS.map(({ k }) => [k, false]));
            setNotifSettings({ ...defaults, ...settings } as NotificationSettings);
          } else setNotifSettings(settings);
        })
        .catch((error) => { console.error(error); toast.error("Could not load notification preferences"); })
        .finally(() => setNotifLoading(false));
    }
  }, [tab, notifSettings]);

  useEffect(() => {
    if (tab === "privacy" && !privacySettings) {
      setPrivacyLoading(true);
      getPrivacySettings()
        .then((res: any) => setPrivacySettings(res.data ?? res))
        .catch((error) => { console.error(error); toast.error("Could not load privacy settings"); })
        .finally(() => setPrivacyLoading(false));
    }
  }, [tab, privacySettings]);

  const handleToggleNotif = async (key: keyof NotificationSettings) => {
    if (!notifSettings) return;
    const updated = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(updated);
    setNotifSaving(true);
    try {
      await updateNotificationSettings({ [key]: updated[key] });
      flashSaved();
      toast.success("Notification preference saved");
    } catch (error: any) {
      setNotifSettings(notifSettings);
      toast.error("Could not save this preference", { description: error?.response?.data?.message || "The backend may not support this admin setting yet." });
    } finally {
      setNotifSaving(false);
    }
  };

  const handleTogglePrivacy = async (key: keyof PrivacySettings) => {
    if (!privacySettings) return;
    const updated = { ...privacySettings, [key]: !privacySettings[key] };
    setPrivacySettings(updated);
    setPrivacySaving(true);
    try {
      await updatePrivacySettings({ [key]: updated[key] });
      flashSaved();
      toast.success("Privacy setting saved");
    } catch (error: any) {
      setPrivacySettings(privacySettings);
      toast.error("Could not save privacy setting", { description: error?.response?.data?.message });
    } finally {
      setPrivacySaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError("");

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
      setPwForm({ current_password: "", password: "", password_confirmation: "" });
      flashSaved();
      toast.success("Password updated successfully");
    } catch (err: any) {
      setPwError(err?.response?.data?.message || "Failed to update password");
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    if (!deletePassword) {
      setDeleteError("Password is required");
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      onLogout();
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || "Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: 0, fontFamily: F }}>Settings</h1>
        {saved && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, background: C.successBg, color: C.success, fontSize: 13, fontWeight: 600, fontFamily: F }}>
            ✓ Changes saved
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24 }}>
        <div style={{ padding: 12, borderRadius: 16, border: `1px solid ${C.border}`, background: C.surface, height: "fit-content" }}>
          {TABS.map(({ k, l, icon: Icon }) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: tab === k ? C.accentLight : "transparent", color: tab === k ? C.accent : C.textSec, fontFamily: F, fontSize: 13, fontWeight: tab === k ? 600 : 400, marginBottom: 2 }}>
              <Icon size={15} />{l}
            </button>
          ))}
          <div style={{ height: 1, background: C.divider, margin: "10px 0" }} />
          <button onClick={onLogout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: "transparent", color: C.error, fontFamily: F, fontSize: 13 }}>
            <LogOut size={15} />Sign Out
          </button>
        </div>

        <div style={{ padding: 28, borderRadius: 20, border: `1px solid ${C.border}`, background: C.surface }}>
          {tab === "profile" && (
            <>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 20px", fontFamily: F }}>Profile Settings</h3>
              {role === "company" && (
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${C.divider}` }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 20 }}>
                    {name?.slice(0, 2).toUpperCase()}
                  </div>
                  <Btn v="outline" icon={Upload} size="sm">Upload Logo</Btn>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                {([
                  { label: role === "company" ? "Company Name" : "Full Name", value: name },
                  { label: "Email Address", value: email },
                  ...(role === "admin" ? [{ label: "Account Role", value: role }] : [{ label: "Phone Number", value: phone }, { label: "Location", value: location }])
                ]).map(({ label, value }) => (
                  <div key={label}>
                    <label style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.text,
                      display: "block",
                      marginBottom: 6,
                      fontFamily: F
                    }}>
                      {label}
                    </label>

                    <input
                      value={value || ""}
                      readOnly
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: 12,
                        border: `1px solid ${C.border}`,
                        fontSize: 14,
                        color: C.text,
                        fontFamily: F,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: C.textSec, margin: "0 0 16px", fontFamily: F }}>
                {role === "admin" ? "Administrator identity is loaded from the authenticated account." : "Profile fields are managed from your profile/resume page."}
              </p>
              {role === "admin" && <Btn v="outline" size="sm" icon={Lock} onClick={() => setTab("security")}>Change Password</Btn>}
            </>
          )}

          {tab === "security" && (
            <>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 20px", fontFamily: F }}>Security</h3>

              {pwError && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fee2e2", color: C.error, fontSize: 13, fontFamily: F, marginBottom: 16, maxWidth: 400 }}>
                  {pwError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 400, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6, fontFamily: F }}>Current Password</label>
                  <PasswordInput value={pwForm.current_password} onChange={(value) => setPwForm({ ...pwForm, current_password: value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6, fontFamily: F }}>New Password</label>
                  <PasswordInput value={pwForm.password} onChange={(value) => setPwForm({ ...pwForm, password: value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6, fontFamily: F }}>Confirm Password</label>
                  <PasswordInput value={pwForm.password_confirmation} onChange={(value) => setPwForm({ ...pwForm, password_confirmation: value })} />
                </div>
              </div>

              <Btn onClick={handleChangePassword} icon={Lock} disabled={pwSaving}>
                {pwSaving ? "Updating..." : "Update Password"}
              </Btn>

              <div style={{ marginTop: 24, padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 3px", fontFamily: F }}>Two-Factor Authentication</p>
                  <p style={{ fontSize: 12, color: C.textSec, margin: 0, fontFamily: F }}>Add extra security to your account</p>
                </div>
                <Btn v="outline" size="sm" disabled>Coming Soon</Btn>
              </div>
            </>
          )}

          {tab === "notifications" && (
            <>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 20px", fontFamily: F }}>Notification Preferences</h3>
              {notifLoading && !notifSettings && (
                <p style={{ fontSize: 13, color: C.textSec, fontFamily: F }}>Loading...</p>
              )}
              {notifSettings && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {notificationFields.map(({ k, l, d }) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: `1px solid ${C.divider}` }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 2px", fontFamily: F }}>{l}</p>
                        <p style={{ fontSize: 12, color: C.textSec, margin: 0, fontFamily: F }}>{d}</p>
                      </div>
                      <Toggle
                        on={notifSettings[k]}
                        onChange={() => handleToggleNotif(k)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "privacy" && (
            <>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 20px", fontFamily: F }}>Privacy & Data</h3>
              {privacyLoading && !privacySettings && (
                <p style={{ fontSize: 13, color: C.textSec, fontFamily: F }}>Loading...</p>
              )}
              {privacySettings && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {privacyFields.map(({ k, l, d }) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: `1px solid ${C.divider}` }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 2px", fontFamily: F }}>{l}</p>
                        <p style={{ fontSize: 12, color: C.textSec, margin: 0, fontFamily: F }}>{d}</p>
                      </div>
                      <Toggle
                        on={privacySettings[k]}
                        onChange={() => handleTogglePrivacy(k)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.divider}` }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.error, margin: "0 0 10px", fontFamily: F }}>Danger Zone</p>
                <Btn v="danger" onClick={() => setShowDeleteModal(true)}>Delete Account</Btn>
              </div>
            </>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: C.surface, borderRadius: 20, padding: 28, width: 380, maxWidth: "90%" }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 10px", fontFamily: F }}>Delete Account</h3>
            <p style={{ fontSize: 13, color: C.textSec, margin: "0 0 18px", fontFamily: F }}>
              This action is permanent and cannot be undone. Enter your password to confirm.
            </p>

            {deleteError && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fee2e2", color: C.error, fontSize: 13, fontFamily: F, marginBottom: 14 }}>
                {deleteError}
              </div>
            )}

            <input
              type="password"
              placeholder="Enter your password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, fontFamily: F, outline: "none", boxSizing: "border-box", marginBottom: 18 }}
            />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn v="outline" onClick={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteError(""); }} disabled={deleting}>
                Cancel
              </Btn>
              <Btn v="danger" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete My Account"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
