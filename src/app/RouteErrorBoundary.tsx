import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router";
import { C, F } from "../constants/tokens";

export default function RouteErrorBoundary() {
  const error = useRouteError() as any;
  const navigate = useNavigate();
  const message = isRouteErrorResponse(error)
    ? error.statusText || error.data?.message
    : error?.message;

  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: C.bg, fontFamily: F, color: C.text }}><section style={{ width: 440, maxWidth: "100%", padding: 28, borderRadius: 20, border: `1px solid ${C.border}`, background: C.surface, boxShadow: "0 20px 60px rgba(15,23,42,.1)", textAlign: "center" }}><div style={{ width: 48, height: 48, margin: "0 auto 15px", borderRadius: 14, background: C.errorBg, color: C.error, display: "grid", placeItems: "center" }}><AlertCircle size={22}/></div><h1 style={{ margin: "0 0 8px", fontSize: 20 }}>This screen couldn’t be displayed</h1><p style={{ margin: "0 auto 22px", color: C.textSec, fontSize: 13, lineHeight: 1.6 }}>Your data is safe. {message || "An unexpected value was received. Please try opening the screen again."}</p><div style={{ display: "flex", justifyContent: "center", gap: 9 }}><button onClick={() => navigate(-1)} style={{ display: "flex", gap: 7, alignItems: "center", padding: "9px 13px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer", fontFamily: F }}><ArrowLeft size={15}/>Go back</button><button onClick={() => navigate("/")} style={{ display: "flex", gap: 7, alignItems: "center", padding: "9px 13px", borderRadius: 10, border: 0, background: C.accent, color: "white", cursor: "pointer", fontFamily: F }}><Home size={15}/>Home</button></div></section></main>;
}
