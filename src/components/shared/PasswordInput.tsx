import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { C, F } from "../../constants/tokens";

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function PasswordInput({ value, onChange, placeholder = "••••••••" }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "11px 44px 11px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, fontFamily: F, outline: "none", boxSizing: "border-box" }}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 30, height: 30, padding: 0, border: 0, background: "transparent", color: C.textSec, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
