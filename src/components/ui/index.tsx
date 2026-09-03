import { C, F } from "../../constants/tokens";

// ─── Button ───────────────────────────────────────────────────────────────────
interface BtnProps {
  children?: React.ReactNode;
  v?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg";
  onClick?: (e: React.MouseEvent) => void;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: React.CSSProperties;
}

export function Btn({ children, v = "primary", size = "md", onClick, icon: Icon, disabled, type = "button", style: extraStyle }: BtnProps) {
  const p = size === "sm" ? "8px 16px" : size === "lg" ? "16px 32px" : "10px 20px";
  const fs = size === "sm" ? 12 : size === "lg" ? 15 : 13;
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: C.accent, color: "#fff" },
    secondary: { background: C.divider, color: C.text },
    outline: { background: "transparent", color: C.text, border: `1px solid ${C.border}` },
    ghost: { background: "transparent", color: C.textSec },
    danger: { background: C.errorBg, color: C.error },
    dark: { background: C.dark, color: "#fff" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ padding: p, borderRadius: 12, fontSize: fs, fontWeight: 600, fontFamily: F, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, border: "none", transition: "all 0.15s", opacity: disabled ? 0.4 : 1, ...styles[v], ...extraStyle }}
      onMouseEnter={e => { if (v === "primary" && !disabled) e.currentTarget.style.background = C.accentHover; }}
      onMouseLeave={e => { if (v === "primary") e.currentTarget.style.background = C.accent; }}
    >
      {Icon && <Icon size={fs - 1} />}{children}
    </button>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const BADGE_MAP: Record<string, [string, string]> = {
  Published:   [C.successBg, C.success],
  Active:      [C.successBg, C.success],
  Draft:       [C.warningBg, C.warning],
  Closed:      [C.divider,   C.textSec],
  Applied:     [C.infoBg,    C.info],
  Shortlisted: [C.accentLight, C.accentHover],
  Interview:   [C.purpleBg,  C.purple],
  Hired:       [C.successBg, C.success],
  Confirmed:   [C.successBg, C.success],
  Pending:     [C.warningBg, C.warning],
  Rejected:    [C.errorBg,   C.error],
  Suspended:   [C.errorBg,   C.error],
};

export function SBadge({ s }: { s: string }) {
  const [bg, color] = BADGE_MAP[s] ?? [C.divider, C.textSec];
  return <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, fontFamily: F, background: bg, color }}>{s}</span>;
}

// ─── Match Ring ───────────────────────────────────────────────────────────────
export function MatchRing({ v, sz = 52 }: { v: number; sz?: number }) {
  const r = (sz - 6) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (v / 100) * circ;
  const color = v >= 90 ? C.success : v >= 80 ? C.accent : C.info;
  return (
    <div style={{ position: "relative", width: sz, height: sz, flexShrink: 0 }}>
      <svg width={sz} height={sz} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={C.divider} strokeWidth={5} />
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: sz < 50 ? 9 : 11, fontWeight: 900, color, fontFamily: F }}>{v}%</span>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: string;
  delta?: number;
  color: string;
  sub?: string;
  trend?: string;
  onClick?: () => void;
}

export function StatCard({ icon: Icon, label, value, delta, color, sub, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) onClick();
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ padding: 24, borderRadius: 20, border: `1px solid ${C.border}`, background: C.surface, display: "flex", flexDirection: "column", gap: 16, cursor: onClick ? "pointer" : "default" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} style={{ color }} />
        </div>
        {delta !== undefined && (
          <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, fontFamily: F, background: delta >= 0 ? C.successBg : C.errorBg, color: delta >= 0 ? C.success : C.error }}>
            {delta >= 0 ? "+" : ""}{delta}%
          </span>
        )}
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 900, margin: "0 0 2px", color: C.text, fontFamily: F }}>{value}</p>
        <p style={{ fontSize: 13, color: C.textSec, margin: 0, fontFamily: F }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0", fontFamily: F }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
export function CCTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ padding: "8px 12px", borderRadius: 12, background: C.dark, fontFamily: F, fontSize: 12 }}>
      <p style={{ color: "#fff", fontWeight: 700, margin: "0 0 4px" }}>{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.color, margin: 0 }}>{p.name}: {p.value}</p>)}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
interface SectionHeadProps {
  label: string;
  title: string;
  action?: () => void;
  actionLabel?: string;
}

export function SectionHead({ label, title, action, actionLabel }: SectionHeadProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px", fontFamily: F }}>{label}</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0, fontFamily: F }}>{title}</h2>
      </div>
      {action && (
        <button onClick={action} style={{ fontSize: 13, fontWeight: 600, color: C.accent, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: F }}>
          {actionLabel} →
        </button>
      )}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, background: on ? C.accent : C.border, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
        <span style={{ position: "absolute", top: 2, left: on ? "calc(100% - 22px)" : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </button>
      {label && <span style={{ fontSize: 13, color: C.text, fontFamily: F }}>{label}</span>}
    </div>
  );
}

// ─── Page Title ───────────────────────────────────────────────────────────────
export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: "0 0 4px", fontFamily: F }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: C.textSec, margin: 0, fontFamily: F }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
