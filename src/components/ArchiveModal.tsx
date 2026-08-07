import { C, F } from "../constants/tokens";
import { Btn } from "./ui";
import { Archive } from "lucide-react";

interface ArchiveModalProps {
  isOpen: boolean;
  jobTitle: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function ArchiveModal({
  isOpen,
  jobTitle,
  onClose,
  onConfirm,
  loading = false,
}: ArchiveModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        fontFamily: F,
      }}
    >
      <div
        style={{
          background: C.surface,
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: 400,
          border: `1px solid ${C.border}`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: `${String(C.accent)}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            color: C.accent,
          }}
        >
          <Archive size={24} />
        </div>

        <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 700, color: C.text }}>
          Archive Job Listing?
        </h3>
        <p style={{ margin: "0 0 20px 0", fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>
          Are you sure you want to archive <strong>"{jobTitle}"</strong>? It will no longer be visible to active job seekers.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn v="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Btn>
          <Btn v="primary" onClick={onConfirm} disabled={loading}>
            {loading ? "Archiving..." : "Archive Job"}
          </Btn>
        </div>
      </div>
    </div>
  );
}