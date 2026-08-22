import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, CheckCircle2, ChevronLeft, Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from "lucide-react";
import { AxiosError } from "axios";
import { C, F } from "../../constants/tokens";
import { forgotPassword, resetPassword } from "../../imports/api";

type Step = "email" | "code" | "password" | "success";
type ApiError = { message?: string; errors?: Record<string, string[]>; attempts_remaining?: number };
const field = { width: "100%", padding: "12px 15px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, fontFamily: F, outline: "none", boxSizing: "border-box" as const };

export default function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [show, setShow] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (!wait) return;
    const timer = window.setInterval(() => setWait((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [wait]);

  const errorText = (caught: unknown) => {
    const data = (caught as AxiosError<ApiError>)?.response?.data;
    const validation = data?.errors && Object.values(data.errors).flat()[0];
    return `${validation || data?.message || "Something went wrong. Please try again."}${data?.attempts_remaining !== undefined ? ` (${data.attempts_remaining} attempts remaining)` : ""}`;
  };

  const sendCode = async (event?: FormEvent) => {
    event?.preventDefault(); setError(""); setNotice("");
    if (!email.trim()) return setError("Please enter your email address.");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setEmail(email.trim()); setStep("code"); setWait(60);
      setNotice("A reset code has been sent if this email is registered.");
    } catch (caught) { setError(errorText(caught)); }
    finally { setLoading(false); }
  };

  const acceptCode = (event: FormEvent) => {
    event.preventDefault(); setError(""); setNotice("");
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from your email.");
    setStep("password");
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (password.length < 8) return setError("Password must contain at least 8 characters.");
    if (password !== confirmation) return setError("Password confirmation does not match.");
    setLoading(true);
    try {
      await resetPassword({ email, code, password, password_confirmation: confirmation });
      setStep("success");
    } catch (caught) {
      setError(errorText(caught));
      if ([422, 429].includes((caught as AxiosError)?.response?.status || 0)) setStep("code");
    } finally { setLoading(false); }
  };

  const back = () => {
    setError(""); setNotice("");
    if (step === "password") setStep("code");
    else if (step === "code") setStep("email");
    else nav("/login");
  };

  const submit = (text: string) => <button type="submit" disabled={loading} style={{ width: "100%", padding: 13, borderRadius: 13, fontSize: 14, fontWeight: 700, color: "#fff", background: loading ? C.textMuted : C.accent, border: 0, cursor: loading ? "not-allowed" : "pointer", fontFamily: F, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>{loading && <Loader2 className="spin" size={17} />}{text}</button>;

  return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: F }}>
    <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <div style={{ width: "100%", maxWidth: 440 }}>
      <button onClick={back} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.textSec, background: "none", border: 0, cursor: "pointer", marginBottom: 28, fontFamily: F }}><ChevronLeft size={15} />{step === "email" || step === "success" ? "Back to sign in" : "Back"}</button>
      <div style={{ padding: 40, borderRadius: 24, background: C.surface, border: `1px solid ${C.border}` }}>
        {step !== "success" && <div style={{ display: "flex", gap: 6, marginBottom: 26 }}>{["email", "code", "password"].map((item, index) => <span key={item} style={{ height: 4, flex: 1, borderRadius: 4, background: index <= ["email", "code", "password"].indexOf(step) ? C.accent : C.divider }} />)}</div>}
        {step === "email" && <form onSubmit={sendCode}><Icon><Lock size={22} color={C.accent} /></Icon><Title title="Forgot your password?">Enter your email and we'll send you a 6-digit reset code.</Title><Label>Email Address</Label><div style={{ position: "relative", marginBottom: 16 }}><Mail size={17} color={C.textMuted} style={{ position: "absolute", left: 14, top: 13 }} /><input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ ...field, paddingLeft: 42 }} /></div><Message error={error} notice={notice} />{submit("Send reset code")}</form>}
        {step === "code" && <form onSubmit={acceptCode}><Icon><Mail size={22} color={C.accent} /></Icon><Title title="Check your email">Enter the 6-digit code sent to {email}. It expires in 10 minutes.</Title><Label>Reset Code</Label><input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" style={{ ...field, textAlign: "center", letterSpacing: 9, fontSize: 20, fontWeight: 700, marginBottom: 14 }} /><Message error={error} notice={notice} />{submit("Continue")}<button type="button" disabled={!!wait || loading} onClick={() => sendCode()} style={{ width: "100%", marginTop: 14, border: 0, background: "none", color: wait ? C.textMuted : C.accent, cursor: wait ? "default" : "pointer", fontFamily: F, fontWeight: 600, fontSize: 13 }}>{wait ? `Resend code in ${wait}s` : "Resend code"}</button></form>}
        {step === "password" && <form onSubmit={savePassword}><Icon><KeyRound size={22} color={C.accent} /></Icon><Title title="Create a new password">Choose a strong password with at least 8 characters.</Title><Label>New Password</Label><Password value={password} setValue={setPassword} show={show} toggle={() => setShow(!show)} /><Label>Confirm New Password</Label><Password value={confirmation} setValue={setConfirmation} show={show} /><Message error={error} notice={notice} />{submit("Reset password")}</form>}
        {step === "success" && <div style={{ textAlign: "center" }}><div style={{ width: 64, height: 64, borderRadius: 20, background: C.successBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}><CheckCircle2 size={28} color={C.success} /></div><Title title="Password reset successfully">You can now sign in using your new password.</Title><button onClick={() => nav("/login")} style={{ width: "100%", padding: 13, borderRadius: 13, fontSize: 14, fontWeight: 700, color: "#fff", background: C.accent, border: 0, cursor: "pointer", fontFamily: F }}>Back to Sign In</button></div>}
      </div>
    </div>
  </div>;
}

function Icon({ children }: { children: React.ReactNode }) { return <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>{children}</div>; }
function Title({ title, children }: { title: string; children: React.ReactNode }) { return <><h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>{title}</h2><p style={{ fontSize: 14, color: C.textSec, margin: "0 0 25px", lineHeight: 1.6 }}>{children}</p></>; }
function Label({ children }: { children: React.ReactNode }) { return <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 7 }}>{children}</label>; }
function Message({ error, notice }: { error: string; notice: string }) { const text = error || notice; return text ? <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 10, background: error ? C.errorBg : C.successBg, color: error ? C.error : C.success, fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}><AlertCircle size={16} style={{ flexShrink: 0 }} />{text}</div> : null; }
function Password({ value, setValue, show, toggle }: { value: string; setValue: (value: string) => void; show: boolean; toggle?: () => void }) { return <div style={{ position: "relative", marginBottom: 16 }}><input type={show ? "text" : "password"} autoComplete="new-password" value={value} onChange={(e) => setValue(e.target.value)} style={{ ...field, paddingRight: 44 }} />{toggle && <button type="button" onClick={toggle} aria-label={show ? "Hide password" : "Show password"} style={{ position: "absolute", right: 11, top: 9, padding: 3, border: 0, background: "none", cursor: "pointer", color: C.textMuted }}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>}</div>; }
