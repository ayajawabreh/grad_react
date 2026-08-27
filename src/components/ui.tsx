import React from "react";
import { C, F } from "../../constants/tokens";
interface MatchRingProps {
  v: number;
  sz?: number;
}

export function MatchRing({ v, sz = 46 }: MatchRingProps) {
  const value = Math.max(0, Math.min(100, Number(v) || 0));
  const radius = (sz - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      style={{
        width: sz,
        height: sz,
        position: "relative",
        flexShrink: 0,
      }}
    >
      <svg
        width={sz}
        height={sz}
        viewBox={`0 0 ${sz} ${sz}`}
        style={{
          transform: "rotate(-90deg)",
          display: "block",
        }}
      >
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={4}
        />

        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={radius}
          fill="none"
          stroke={C.accent}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          color: C.text,
          fontFamily: F,
        }}
      >
        {Math.round(value)}%
      </div>
    </div>
  );
}

interface SBadgeProps {
  s?: string;
}

export function SBadge({ s = "Applied" }: SBadgeProps) {
  const status = String(s);

  const getColors = () => {
    switch (status.toLowerCase()) {
      case "shortlisted":
        return {
          background: "#ECFDF5",
          color: "#059669",
          border: "#A7F3D0",
        };

      case "accepted":
        return {
          background: "#ECFDF5",
          color: "#059669",
          border: "#A7F3D0",
        };

      case "rejected":
        return {
          background: "#FEF2F2",
          color: "#DC2626",
          border: "#FECACA",
        };

      case "interview":
      case "interviewed":
        return {
          background: "#EFF6FF",
          color: "#2563EB",
          border: "#BFDBFE",
        };

      case "pending":
        return {
          background: "#FFFBEB",
          color: "#D97706",
          border: "#FDE68A",
        };

      case "review":
      case "under review":
        return {
          background: "#F5EDD8",
          color: "#B8924A",
          border: "#DDD6FE",
        };

      default:
        return {
          background: "#F3F4F6",
          color: "#6B7280",
          border: "#E5E7EB",
        };
    }
  };

  const colors = getColors();

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3px 8px",
        borderRadius: 999,
        background: colors.background,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: F,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

interface BtnProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  style?: React.CSSProperties;
  type?: "button" | "submit" | "reset";
}

export function Btn({
  children,
  onClick,
  size = "md",
  disabled = false,
  style,
  type = "button",
}: BtnProps) {
  const sizes = {
    sm: {
      height: 32,
      padding: "0 10px",
      fontSize: 12,
    },
    md: {
      height: 38,
      padding: "0 14px",
      fontSize: 13,
    },
    lg: {
      height: 44,
      padding: "0 18px",
      fontSize: 14,
    },
  };

  const currentSize = sizes[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: currentSize.height,
        padding: currentSize.padding,
        borderRadius: 8,
        border: `1px solid ${C.accent}`,
        background: C.accent,
        color: "#FFFFFF",
        fontSize: currentSize.fontSize,
        fontWeight: 600,
        fontFamily: F,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
