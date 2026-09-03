import { useEffect, useState } from "react";
import { User, Lock, Bell, Shield, LogOut, BadgeCheck } from "lucide-react";
import { C, F } from "../../constants/tokens";
import { Btn, Toggle } from "../ui";
import { PasswordInput } from "./PasswordInput";
import {
  changePassword,
  getNotificationSettings,
  updateNotificationSettings,
  getPrivacySettings,
  updatePrivacySettings,
  deleteAccount,
  getCompanySettings,
} from "../../imports/settings";

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

const TABS = [
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

export function CompanySettingsView({
  name,
  email,
  accountStatus = "pending",
  verified = false,
  onLogout,
}: CompanySettingsViewProps) {
  const [tab, setTab] = useState("account");
  const [saved, setSaved] = useState(false);
  const [accountData, setAccountData] = useState({
    companyName: name,
    email,
    role: "Company",
    status: accountStatus,
  });

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

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    getCompanySettings()
      .then((response: any) => {
        const data = response?.data ?? response;
        const account = data?.account ?? {};
        const company = data?.company ?? {};

        setAccountData({
          companyName: company.company_name ?? "",
          email: account.email ?? "",
          role: account.role ?? "Company",
          status: company.approval_status ?? "pending",
        });
      })
      .catch(() => {
        // Keep the authenticated-user values as a fallback.
      });
  }, []);

  useEffect(() => {
    if (tab === "notifications" && !notifSettings) {
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
        .catch(() => {})
        .finally(() => setNotifLoading(false));
    }
  }, [tab, notifSettings]);

  useEffect(() => {
    if (tab === "privacy" && !privacySettings) {
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
        .catch(() => {})
        .finally(() => setPrivacyLoading(false));
    }
  }, [tab, privacySettings]);

  const handleToggleNotif = async (key: keyof CompanyNotificationSettings) => {
    if (!notifSettings) return;

    const currentValue = Boolean(notifSettings[key]);
    const updated = { ...notifSettings, [key]: !currentValue };
    setNotifSettings(updated);

    try {
      await updateNotificationSettings({ [key]: updated[key] } as any);
      flashSaved();
    } catch {
      setNotifSettings(notifSettings);
    }
  };

  const handleTogglePrivacy = async (key: keyof CompanyPrivacySettings) => {
    if (!privacySettings) return;

    const currentValue = Boolean(privacySettings[key]);
    const updated = { ...privacySettings, [key]: !currentValue };
    setPrivacySettings(updated);

    try {
      await updatePrivacySettings({ [key]: updated[key] } as any);
      flashSaved();
    } catch {
      setPrivacySettings(privacySettings);
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
      setPwForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      flashSaved();
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
      setDeleteError(err?.response?.data?.message || "Failed to delete company account");
      setDeleting(false);
    }
  };

  const isApproved = String(accountData.status).toLowerCase() === "approved";
  const statusLabel = isApproved ? "Approved" : "Pending";
  const statusColor = isApproved ? C.success : "#d97706";
  const statusBackground = isApproved ? C.successBg : "#fef3c7";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: C.text,
            margin: 0,
            fontFamily: F,
          }}
        >
          Settings
        </h1>

        {saved && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 12,
              background: C.successBg,
              color: C.success,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: F,
            }}
          >
            ✓ Changes saved
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          gap: 24,
        }}
      >
        <div
          style={{
            padding: 12,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            background: C.surface,
            height: "fit-content",
          }}
        >
          {TABS.map(({ k, l, icon: Icon }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 12px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: tab === k ? C.accentLight : "transparent",
                color: tab === k ? C.accent : C.textSec,
                fontFamily: F,
                fontSize: 13,
                fontWeight: tab === k ? 600 : 400,
                marginBottom: 2,
              }}
            >
              <Icon size={15} />
              {l}
            </button>
          ))}

          <div style={{ height: 1, background: C.divider, margin: "10px 0" }} />

          <button
            onClick={onLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 12px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: C.error,
              fontFamily: F,
              fontSize: 13,
            }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>

        <div
          style={{
            padding: 28,
            borderRadius: 20,
            border: `1px solid ${C.border}`,
            background: C.surface,
          }}
        >
          {tab === "account" && (
            <>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: C.text,
                  margin: "0 0 20px",
                  fontFamily: F,
                }}
              >
                Account
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.text,
                      display: "block",
                      marginBottom: 6,
                      fontFamily: F,
                    }}
                  >
                    Company Name
                  </label>
                  <input
                    value={accountData.companyName || ""}
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
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.text,
                      display: "block",
                      marginBottom: 6,
                      fontFamily: F,
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    value={accountData.email || ""}
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
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.text,
                      display: "block",
                      marginBottom: 6,
                      fontFamily: F,
                    }}
                  >
                    Role
                  </label>
                  <input
                    value={accountData.role || ""}
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
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.text,
                      display: "block",
                      marginBottom: 6,
                      fontFamily: F,
                    }}
                  >
                    Account Status
                  </label>
                  <div
                    style={{
                      height: 43,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 14px",
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                      boxSizing: "border-box",
                    }}
                  >
                    <span
                      style={{
                        padding: "5px 10px",
                        borderRadius: 99,
                        background: statusBackground,
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: F,
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </div>

              {verified && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: C.success,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: F,
                    marginBottom: 16,
                  }}
                >
                  <BadgeCheck size={18} />
                  Verified Company
                </div>
              )}

              <p
                style={{
                  fontSize: 12,
                  color: C.textSec,
                  margin: 0,
                  fontFamily: F,
                }}
              >
                Company information can be updated from the Company Profile page.
              </p>
            </>
          )}

          {tab === "security" && (
            <>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: C.text,
                  margin: "0 0 20px",
                  fontFamily: F,
                }}
              >
                Security
              </h3>

              {pwError && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "#fee2e2",
                    color: C.error,
                    fontSize: 13,
                    fontFamily: F,
                    marginBottom: 16,
                    maxWidth: 400,
                  }}
                >
                  {pwError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  maxWidth: 400,
                  marginBottom: 20,
                }}
              >
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6, fontFamily: F }}>
                    Current Password
                  </label>
                  <PasswordInput value={pwForm.current_password} onChange={(value) => setPwForm({ ...pwForm, current_password: value })} />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6, fontFamily: F }}>
                    New Password
                  </label>
                  <PasswordInput value={pwForm.password} onChange={(value) => setPwForm({ ...pwForm, password: value })} />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6, fontFamily: F }}>
                    Confirm Password
                  </label>
                  <PasswordInput value={pwForm.password_confirmation} onChange={(value) => setPwForm({ ...pwForm, password_confirmation: value })} />
                </div>
              </div>

              <Btn onClick={handleChangePassword} icon={Lock} disabled={pwSaving}>
                {pwSaving ? "Updating..." : "Update Password"}
              </Btn>

              <div
                style={{
                  marginTop: 24,
                  padding: 20,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 3px", fontFamily: F }}>
                    Two-Factor Authentication
                  </p>
                  <p style={{ fontSize: 12, color: C.textSec, margin: 0, fontFamily: F }}>
                    Add extra security to your company account
                  </p>
                </div>
                <Btn v="outline" size="sm" disabled>
                  Coming Soon
                </Btn>
              </div>
            </>
          )}

          {tab === "notifications" && (
            <>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 20px", fontFamily: F }}>
                Notification Preferences
              </h3>

              {notifLoading && !notifSettings && (
                <p style={{ fontSize: 13, color: C.textSec, fontFamily: F }}>
                  Loading...
                </p>
              )}

              {notifSettings && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {NOTIFICATION_FIELDS.map(({ k, l, d }) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: `1px solid ${C.divider}` }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 2px", fontFamily: F }}>
                          {l}
                        </p>
                        <p style={{ fontSize: 12, color: C.textSec, margin: 0, fontFamily: F }}>
                          {d}
                        </p>
                      </div>
                      <Toggle
                        on={Boolean(notifSettings[k])}
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
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 20px", fontFamily: F }}>
                Privacy & Data
              </h3>

              {privacyLoading && !privacySettings && (
                <p style={{ fontSize: 13, color: C.textSec, fontFamily: F }}>
                  Loading...
                </p>
              )}

              {privacySettings && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {PRIVACY_FIELDS.map(({ k, l, d }) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: `1px solid ${C.divider}` }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 2px", fontFamily: F }}>
                          {l}
                        </p>
                        <p style={{ fontSize: 12, color: C.textSec, margin: 0, fontFamily: F }}>
                          {d}
                        </p>
                      </div>
                      <Toggle
                        on={Boolean(privacySettings[k])}
                        onChange={() => handleTogglePrivacy(k)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.divider}` }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.error, margin: "0 0 10px", fontFamily: F }}>
                  Danger Zone
                </p>
                <Btn v="danger" onClick={() => setShowDeleteModal(true)}>
                  Delete Company Account
                </Btn>
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
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 10px", fontFamily: F }}>
              Delete Company Account
            </h3>

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
                {deleting ? "Deleting..." : "Delete Company Account"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
