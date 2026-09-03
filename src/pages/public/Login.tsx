import { useState } from "react";
import { useNavigate } from "react-router";
import { User, Building2, Shield, Mail, Lock, Eye, EyeOff, MailCheck } from "lucide-react";
import { C, F } from "../../constants/tokens";
import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../types";

const ROLES: { key: Role; icon: typeof User; title: string; color: string; dest: string }[] = [
  { key: "student",  icon: User,      title: "Student",  color: C.success, dest: "/student/dashboard" },
  { key: "company",  icon: Building2, title: "Company",  color: C.accent,  dest: "/company/dashboard" },
{ key: "admin", icon: Shield, title: "Admin", color: C.error, dest: "/admin/dashboard" },];

export default function Login() {
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState<{ userId: number; email: string } | null>(null);

  const { login } = useAuth(); 
  const nav = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setVerificationData(null);

    const cleanEmail = email.trim();
    const nextErrors: { email?: string; password?: string } = {};
    if (!cleanEmail) nextErrors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Password is required.";

    if (nextErrors.email || nextErrors.password) {
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = String(data.message || data.error || "");
        const normalizedMessage = message.toLowerCase();
        const errorCode = String(data.code || data.error_code || "").toLowerCase();
        const apiErrors = data.errors || {};

        if (normalizedMessage.includes("verify your email")) {
          let saved: { userId?: number; email?: string } | null = null;
          try {
            saved = JSON.parse(sessionStorage.getItem("cb_verification") || "null");
          } catch {
            saved = null;
          }

          const userId = Number(data.user_id || (saved?.email === cleanEmail ? saved?.userId : 0));
          if (userId) {
            const pending = { userId, email: cleanEmail };
            sessionStorage.setItem("cb_verification", JSON.stringify(pending));
            setVerificationData(pending);
          }
        }

        const emailMessage = Array.isArray(apiErrors.email) ? apiErrors.email[0] : apiErrors.email;
        const passwordMessage = Array.isArray(apiErrors.password) ? apiErrors.password[0] : apiErrors.password;
        if (emailMessage || passwordMessage) {
          setFieldErrors({
            email: emailMessage ? String(emailMessage) : undefined,
            password: passwordMessage ? String(passwordMessage) : undefined,
          });
          return;
        }

        if (errorCode === "email_not_found" || /email.*(not found|does not exist|not registered|unknown)/i.test(message)) {
          setFieldErrors({ email: "No account was found with this email address." });
          return;
        }

        if (errorCode === "invalid_password" || errorCode === "wrong_password" || /(incorrect|invalid|wrong).*password|password.*(incorrect|invalid|wrong)/i.test(message)) {
          setFieldErrors({ password: "The password you entered is incorrect." });
          return;
        }

        throw new Error(message || "The email address or password is incorrect.");
      }

      if (data.token && data.user && data.user.role) {
        const fetchedRole = data.user.role.toLowerCase() as Role;
        
        // التأكد من أن الدور القادم من السيرفر يطابق التبويب الذي حدده المستخدم
        if (fetchedRole !== role) {
          throw new Error(`This account is registered as a ${fetchedRole}, not a ${role}.`);
        }

        login(
  {
    name: data.user.name,
    email: data.user.email,
    phone: data.user.phone,
    location: data.user.location,
    role: fetchedRole,
  },
  fetchedRole,
  data.token
);
        
        const targetRole = ROLES.find(r => r.key === fetchedRole);
        if (targetRole) {
          nav(targetRole.dest);
        } else {
          setError(`Role "${data.user.role}" is not recognized by the system.`);
        }
      } else {
        setError("Invalid response format from server.");
      }

    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", fontFamily: F }}>
      {/* Left panel */}
      <div style={{ width: 420, background: C.darker, display: "flex", flexDirection: "column", padding: "48px", flexShrink: 0 }}>
        <button type="button" onClick={() => nav("/")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", marginBottom: "auto", outline: "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>CB</span>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>CareerBridge</span>
        </button>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: "#fff", lineHeight: 1.15, margin: "0 0 16px", letterSpacing: "-0.025em" }}>
            Welcome<br /><span style={{ color: C.accent }}>back.</span>
          </h2>
          <p style={{ fontSize: 15, color: "#9DA3AB", lineHeight: 1.7, margin: "0 0 36px" }}>
            Sign in to access your dashboard and continue your journey.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: User, text: "10,000+ active graduates", color: C.success },
              { icon: Building2, text: "500+ verified companies", color: C.accent },
              { icon: Shield, text: "Secure & private platform", color: C.info }
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <span style={{ fontSize: 13, color: "#9DA3AB" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" }}>
        <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: 440 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Sign in to CareerBridge</h1>
          <p style={{ fontSize: 14, color: C.textSec, margin: "0 0 28px" }}>Select your account type to continue</p>

          {error && (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: C.error + "15", color: C.error, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              <div>{error}</div>
              {verificationData && (
                <button
                  type="button"
                  onClick={() => nav("/verify-email", { state: verificationData })}
                  style={{ marginTop: 10, padding: "8px 11px", borderRadius: 9, border: `1px solid ${C.error}35`, background: C.surface, color: C.error, cursor: "pointer", fontFamily: F, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}
                >
                  <MailCheck size={15} /> Verify Email
                </button>
              )}
            </div>
          )}

          {/* Role Selection */}
          <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
            {ROLES.map(({ key, icon: Icon, title, color }) => (
              <button 
                type="button" 
                key={key} 
                onClick={() => { setRole(key); setError(null); setFieldErrors({}); setVerificationData(null); }}
                style={{
                  flex: 1,
                  padding: "16px 12px",
                  borderRadius: 14,
                  border: `2px solid ${role === key ? color : C.border}`,
                  background: role === key ? color + "08" : C.surface,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  outline: "none"
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: role === key ? color + "20" : C.divider, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} style={{ color: role === key ? color : C.textSec }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: role === key ? color : C.text, fontFamily: F }}>{title}</span>
              </button>
            ))}
          </div>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6, fontFamily: F }}>Email Address</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, border: `1px solid ${fieldErrors.email ? C.error : C.border}`, background: C.surface }}>
                <Mail size={15} style={{ color: C.textMuted, flexShrink: 0 }} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors((current) => ({ ...current, email: undefined })); }}
                  placeholder="you@example.com" 
                  required
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: C.text, background: "transparent", fontFamily: F }} 
                />
              </div>
              {fieldErrors.email && <p role="alert" style={{ margin: "6px 2px 0", color: C.error, fontSize: 12, fontWeight: 600 }}>{fieldErrors.email}</p>}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6, fontFamily: F }}>Password</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, border: `1px solid ${fieldErrors.password ? C.error : C.border}`, background: C.surface, position: "relative" }}>
                <Lock size={15} style={{ color: C.textMuted, flexShrink: 0 }} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((current) => ({ ...current, password: undefined })); }}
                  placeholder="••••••••" 
                  required
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: C.text, background: "transparent", fontFamily: F, paddingRight: 32 }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, position: "absolute", right: 16, display: "flex", alignItems: "center", justifyContent: "center", outline: "none" }}
                >
                  {showPassword ? <EyeOff size={16} color={C.textSec} /> : <Eye size={16} color={C.textSec} />}
                </button>
              </div>
              {fieldErrors.password && <p role="alert" style={{ margin: "6px 2px 0", color: C.error, fontSize: 12, fontWeight: 600 }}>{fieldErrors.password}</p>}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <button type="button" onClick={() => nav("/forgot-password")} style={{ fontSize: 12, color: C.accent, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 600, outline: "none" }}>Forgot password?</button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              background: loading ? C.textMuted : C.accent,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: F,
              marginBottom: 16,
              outline: "none"
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = C.accentHover)}
            onMouseLeave={e => !loading && (e.currentTarget.style.background = C.accent)}
          >
            {loading ? "Signing in..." : `Sign in as ${ROLES.find(r => r.key === role)?.title}`}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: C.textSec, margin: "0 0 24px", fontFamily: F }}>
            Don't have an account?{" "}
            <button type="button" onClick={() => nav("/register")} style={{ color: C.accent, fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: F, outline: "none" }}>Sign up free</button>
          </p>

          {/* Quick demo access */}
          <div style={{ padding: 16, borderRadius: 14, background: C.divider }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textSec, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: F }}>Quick Demo Access</p>
            <div style={{ display: "flex", gap: 8 }}>
              {ROLES.map(({ key, title, color, dest }) => (
                <button 
                  type="button" 
                  key={key} 
                  onClick={() => {
                    login(
                      {
                        name: `${title} Demo`,
                        email: `${key}@demo.com`,
                        phone: "+1 555-0192",
                        location: "Demo Location",
                        role: key,
                      },
                      key,
                      "demo-token"
                    );
                    nav(dest);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    color,
                    background: color + "15",
                    border: `1px solid ${color}30`,
                    cursor: "pointer",
                    fontFamily: F,
                    outline: "none"
                  }}
                >
                  {title} →
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
