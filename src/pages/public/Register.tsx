import { useState } from "react";
import { API } from "../../imports/api";
import { useNavigate } from "react-router";
import { User, Building2, ChevronLeft, Check, Eye, EyeOff, GraduationCap, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react"; 
import { C, F } from "../../constants/tokens";
import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../types";

export default function Register() {
  const [role, setRole] = useState<"student" | "company">("student");
  const { login } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false); 

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    university: "", 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async () => {
    setNotification(null);

    if (form.password !== form.confirmPassword) {
      setNotification({ type: "error", message: "Passwords do not match!" });
      return;
    }

    if (role === "student" && !form.university.trim()) {
      setNotification({ type: "error", message: "Please enter your university name!" });
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: role,
        university: role === "student" ? form.university : undefined, 
      });

      if (res.data.token) {
        setNotification({ type: "success", message: "Account created successfully! Redirecting..." });
        login(role as Role, res.data.token);
        setTimeout(() => {
          nav(role === "student" ? "/student/dashboard" : "/company/dashboard");
        }, 1500);
      } else {
        setNotification({ type: "success", message: "Registered successfully! Redirecting to login..." });
        setTimeout(() => {
          nav("/login");
        }, 1500);
      }

    } catch (err: any) {
      console.log(err.response?.data);
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Registration failed. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: F }}>
      <div style={{ width: "100%", maxWidth: 960, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>

        <div>
          <button onClick={() => nav("/")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", marginBottom: 40, fontSize: 13, color: C.textSec, fontFamily: F, outline: "none" }}>
            <ChevronLeft size={16} /> Back to home
          </button>

          <h1 style={{ fontSize: 36, fontWeight: 900, color: C.text }}>
            Create your <br />
            <span style={{ color: C.accent }}>free account</span>
          </h1>

          <p style={{ fontSize: 14, color: C.textSec }}>
            Join 50,000+ graduates building their careers on CareerBridge.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
            {[
              { k: "student", label: "Student", icon: User, color: C.success },
              { k: "company", label: "Company", icon: Building2, color: C.accent }
            ].map(({ k, label, icon: Icon, color }) => (
              <button
                type="button"
                key={k}
                onClick={() => { setRole(k as any); setNotification(null); }}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 14,
                  border: `2px solid ${role === k ? color : C.border}`,
                  background: role === k ? color + "10" : C.surface,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <Icon size={16} color={role === k ? color : C.textSec} />
                <span style={{ color: role === k ? color : C.text }}>{label}</span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 10 }}>
            {(role === "student"
              ? ["Job listings", "AI matching", "Resume builder", "Tracking"]
              : ["Post jobs", "AI ranking", "Hiring pipeline", "Interviews"]
            ).map(b => (
              <div key={b} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Check size={14} color={C.success} />
                <span style={{ color: C.textSec }}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 30, borderRadius: 20, background: C.surface, border: `1px solid ${C.border}` }}>
          <h3 style={{ marginBottom: 20, color: C.text, fontWeight: 800, fontSize: 18 }}>
            {role === "student" ? "Student Registration" : "Company Registration"}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            
            {notification && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                animation: "fadeIn 0.3s ease",
                background: notification.type === "success" ? `${C.success}15` : `${C.error || "#ef4444"}15`,
                color: notification.type === "success" ? C.success : (C.error || "#ef4444"),
                border: `1px solid ${notification.type === "success" ? `${C.success}30` : `${C.error || "#ef4444"}30`}`
              }}>
                {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{notification.message}</span>
              </div>
            )}

            <div style={inputContainerStyle}>
              <div style={iconWrapperStyle}>
                <User size={16} color={C.textMuted} />
              </div>
              <input
                name="name"
                placeholder={role === "student" ? "Full Name" : "Company Name"}
                value={form.name}
                onChange={handleChange}
                style={embeddedInputStyle}
              />
            </div>

            {role === "student" && (
              <div style={inputContainerStyle}>
                <div style={iconWrapperStyle}>
                  <GraduationCap size={16} color={C.textMuted} />
                </div>
                <input
                  name="university"
                  type="text"
                  placeholder="University Name"
                  value={form.university}
                  onChange={handleChange}
                  style={embeddedInputStyle}
                />
              </div>
            )}

            <div style={inputContainerStyle}>
              <div style={iconWrapperStyle}>
                <Mail size={16} color={C.textMuted} />
              </div>
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                style={embeddedInputStyle}
              />
            </div>

            <div style={inputContainerStyle}>
              <div style={iconWrapperStyle}>
                <Lock size={16} color={C.textMuted} />
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                style={embeddedInputStyle}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                style={eyeButtonStyle}
              >
                {showPassword ? <EyeOff size={16} color={C.textSec} /> : <Eye size={16} color={C.textSec} />}
              </button>
            </div>

            <div style={inputContainerStyle}>
              <div style={iconWrapperStyle}>
                <Lock size={16} color={C.textMuted} />
              </div>
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                style={embeddedInputStyle}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                style={eyeButtonStyle}
              >
                {showConfirmPassword ? <EyeOff size={16} color={C.textSec} /> : <Eye size={16} color={C.textSec} />}
              </button>
            </div>

            <button 
              onClick={handleRegister} 
              disabled={loading}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                ...btnStyle, 
                background: loading ? C.textMuted : (isHovered ? C.accentHover || C.accent : C.accent), 
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

const inputContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  position: "relative",
  width: "100%",
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  background: C.surface,
  boxSizing: "border-box",
  outline: "none"
};

const iconWrapperStyle: React.CSSProperties = {
  paddingLeft: 14, 
  display: "flex", 
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
};

const embeddedInputStyle: React.CSSProperties = {
  flex: 1,
  padding: 12,
  paddingLeft: 10, 
  background: "transparent",
  border: "none",
  color: C.text,
  outline: "none",
  fontSize: 14,
  fontFamily: F
};

const eyeButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "0 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  outline: "none"
};

const btnStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 12,
  color: "white",
  fontWeight: "bold",
  border: "none",
  marginTop: 6,
  fontSize: 15,
  fontFamily: F,
  transition: "background 0.2s ease",
  outline: "none"
};