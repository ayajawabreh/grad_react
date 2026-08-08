import { useState } from "react";
import { useNavigate } from "react-router";
import { Lock, ChevronLeft, CheckCircle2 } from "lucide-react";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const nav = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: F }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <button onClick={() => nav("/login")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.textSec, background: "none", border: "none", cursor: "pointer", marginBottom: 32, fontFamily: F }}>
          <ChevronLeft size={15} />Back to sign in
        </button>
        <div style={{ padding: 40, borderRadius: 24, background: C.surface, border: `1px solid ${C.border}` }}>
          {!sent ? (
            <>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <Lock size={22} style={{ color: C.accent }} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 8px", fontFamily: F }}>Forgot your password?</h2>
              <p style={{ fontSize: 14, color: C.textSec, margin: "0 0 28px", lineHeight: 1.6, fontFamily: F }}>Enter your email and we'll send you a reset link.</p>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6, fontFamily: F }}>Email Address</label>
              <input type="email" placeholder="you@example.com" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, fontFamily: F, outline: "none", marginBottom: 16, boxSizing: "border-box" }} />
              <button onClick={() => setSent(true)}
                style={{ width: "100%", padding: "13px", borderRadius: 13, fontSize: 14, fontWeight: 700, color: "#fff", background: C.accent, border: "none", cursor: "pointer", fontFamily: F }}
                onMouseEnter={e => e.currentTarget.style.background = C.accentHover}
                onMouseLeave={e => e.currentTarget.style.background = C.accent}>
                Send Reset Link
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: C.successBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle2 size={28} style={{ color: C.success }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 10px", fontFamily: F }}>Check your email</h2>
              <p style={{ fontSize: 14, color: C.textSec, margin: "0 0 28px", lineHeight: 1.6, fontFamily: F }}>We've sent a password reset link to your inbox.</p>
              <Btn onClick={() => nav("/login")}>Back to Sign In</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
