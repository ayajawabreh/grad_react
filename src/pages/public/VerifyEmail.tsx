import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { AxiosError } from "axios";
import { AlertCircle, CheckCircle2, ChevronLeft, Loader2, MailCheck } from "lucide-react";
import { resendVerification, verifyEmail } from "../../imports/api";
import { C, F } from "../../constants/tokens";

type VerificationData = { userId: number; email?: string };
type ApiError = { message?: string; errors?: Record<string, string[]>; attempts_remaining?: number };

export default function VerifyEmail() {
  const nav = useNavigate();
  const location = useLocation();
  const saved = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("cb_verification") || "null") as VerificationData | null; }
    catch { return null; }
  }, []);
  const data = (location.state as VerificationData | null) || saved;
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (!seconds || success) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds, success]);

  const getError = (caught: unknown) => {
    const response = (caught as AxiosError<ApiError>)?.response?.data;
    const validation = response?.errors && Object.values(response.errors).flat()[0];
    const remaining = response?.attempts_remaining;
    return `${validation || response?.message || "Verification failed. Please try again."}${remaining !== undefined ? ` (${remaining} attempts remaining)` : ""}`;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setMessage("");
    if (!data?.userId) return setError("Registration information is missing. Please register again.");
    if (!/^\d{6}$/.test(code)) return setError("Enter the complete 6-digit code.");
    setLoading(true);
    try {
      await verifyEmail(data.userId, code);
      sessionStorage.removeItem("cb_verification");
      setSuccess(true);
    } catch (caught) { setError(getError(caught)); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    if (!data?.userId || seconds || loading) return;
    setError(""); setMessage(""); setLoading(true);
    try {
      const response = await resendVerification(data.userId);
      setMessage(response.message || "A new code has been sent.");
      setCode(""); setSeconds(60);
    } catch (caught) { setError(getError(caught)); }
    finally { setLoading(false); }
  };

  return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: F }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <div style={{ width: "100%", maxWidth: 430 }}>
      <button onClick={() => nav(success ? "/login" : "/register")} style={{ display: "flex", alignItems: "center", gap: 6, border: 0, background: "none", color: C.textSec, cursor: "pointer", marginBottom: 28, fontFamily: F }}><ChevronLeft size={16} />{success ? "Back to sign in" : "Back to registration"}</button>
      <div style={{ padding: 40, borderRadius: 24, background: C.surface, border: `1px solid ${C.border}`, textAlign: success ? "center" : "left" }}>
        <div style={{ width: 60, height: 60, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", background: success ? C.successBg : C.accentLight, margin: success ? "0 auto 20px" : "0 0 22px" }}>{success ? <CheckCircle2 size={28} color={C.success} /> : <MailCheck size={26} color={C.accent} />}</div>
        {success ? <><h2 style={{ margin: "0 0 10px", color: C.text, fontSize: 24 }}>Email verified!</h2><p style={{ color: C.textSec, fontSize: 14, lineHeight: 1.6, marginBottom: 26 }}>Your account is ready. You can now sign in.</p><button onClick={() => nav("/login")} style={primaryStyle}>Continue to Sign In</button></> : <form onSubmit={submit}>
          <h2 style={{ margin: "0 0 8px", color: C.text, fontSize: 24 }}>Verify your email</h2>
          <p style={{ color: C.textSec, fontSize: 14, lineHeight: 1.6, margin: "0 0 25px" }}>We sent a 6-digit code{data?.email ? <> to <strong style={{ color: C.text }}>{data.email}</strong></> : " to your email"}. It expires in 10 minutes.</p>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 8 }}>Verification Code</label>
          <input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" style={{ width: "100%", boxSizing: "border-box", padding: "13px 16px", borderRadius: 12, border: `1px solid ${C.border}`, outline: 0, textAlign: "center", letterSpacing: 10, fontSize: 21, fontWeight: 700, color: C.text, marginBottom: 14 }} />
          {(error || message) && <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 10, background: error ? C.errorBg : C.successBg, color: error ? C.error : C.success, fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}><AlertCircle size={16} style={{ flexShrink: 0 }} />{error || message}</div>}
          <button disabled={loading} type="submit" style={{ ...primaryStyle, background: loading ? C.textMuted : C.accent }}>{loading && <Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} />}Verify Email</button>
          <button type="button" disabled={!!seconds || loading} onClick={resend} style={{ width: "100%", border: 0, background: "none", color: seconds ? C.textMuted : C.accent, fontFamily: F, fontWeight: 600, cursor: seconds ? "default" : "pointer", marginTop: 15 }}>{seconds ? `Resend code in ${seconds}s` : "Resend code"}</button>
        </form>}
      </div>
    </div>
  </div>;
}

const primaryStyle = { width: "100%", boxSizing: "border-box" as const, padding: 13, borderRadius: 13, border: 0, background: C.accent, color: "#fff", fontFamily: F, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };
