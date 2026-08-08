import { useState } from "react";
import { X, Calendar, Clock, Video, MapPin, Link2, Sparkles, Users, AlertTriangle } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { C, F } from "../../constants/tokens";
import { bulkScheduleInterviews } from "../../imports/interviews";

interface Props {
  applicationIds: number[];
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BulkScheduleModal({
  applicationIds,
  onClose,
  onSuccess,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [type, setType] = useState<"Online" | "Onsite">("Online");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    try {
      setLoading(true);
      setErrorMsg(null);

      const formattedDate = selectedDate.toISOString().split("T")[0];

      await bulkScheduleInterviews({
        application_ids: applicationIds,
        interview_date: formattedDate,
        start_time: startTime,
        duration: Number(duration),
        type,
        location: type === "Onsite" ? location : "",
        meeting_link: type === "Online" ? meetingLink : "",
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.log("FULL ERROR:", error.response?.data);
      setErrorMsg(
        error.response?.data?.message || "Failed to schedule interviews."
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    selectedDate &&
    startTime &&
    Number(duration) >= 5 &&
    (type === "Online" ? meetingLink : location);

  return (
    <div
      lang="en"
      dir="ltr"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        fontFamily: F || "'Inter', system-ui, sans-serif",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: C?.surface || "#ffffff",
          borderRadius: 24,
          padding: 28,
          border: `1px solid ${C?.border || "#e2e8f0"}`,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
              Schedule Interviews
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Users size={13} />
              {applicationIds.length} candidate{applicationIds.length > 1 ? "s" : ""} selected
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "#f1f5f9",
              color: "#64748b",
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>
                <Calendar size={14} style={{ marginRight: 6, color: "#64748b" }} />
                Start Date
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select Date"
                className="custom-datepicker-input"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>
                <Clock size={14} style={{ marginRight: 6, color: "#64748b" }} />
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              <Clock size={14} style={{ marginRight: 6, color: "#64748b" }} />
              Duration per Interview (minutes)
            </label>
            <input
              type="number"
              min={5}
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={inputStyle}
            />
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#94a3b8" }}>
              Each interview starts this many minutes after the previous one.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Interview Type</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                background: "#f8fafc",
                padding: 4,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
              }}
            >
              <button
                type="button"
                onClick={() => setType("Online")}
                style={{
                  ...typeButtonStyle,
                  ...(type === "Online" ? activeTypeStyle : {}),
                }}
              >
                <Video size={15} />
                Online
              </button>
              <button
                type="button"
                onClick={() => setType("Onsite")}
                style={{
                  ...typeButtonStyle,
                  ...(type === "Onsite" ? activeTypeStyle : {}),
                }}
              >
                <MapPin size={15} />
                Onsite
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            {type === "Online" ? (
              <div>
                <label style={labelStyle}>
                  <Link2 size={14} style={{ marginRight: 6, color: "#64748b" }} />
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="e.g. https://meet.google.com/abc-defg-hij"
                  style={inputStyle}
                  required
                />
              </div>
            ) : (
              <div>
                <label style={labelStyle}>
                  <MapPin size={14} style={{ marginRight: 6, color: "#64748b" }} />
                  Location / Address
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. HQ Office, Room 402"
                  style={inputStyle}
                  required
                />
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#475569",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              style={{
                flex: 1.5,
                height: 44,
                borderRadius: 12,
                border: "none",
                background: C?.accent || "#2563eb",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: 14,
                cursor: loading || !isFormValid ? "not-allowed" : "pointer",
                opacity: loading || !isFormValid ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                "Scheduling..."
              ) : (
                <>
                  <Sparkles size={16} />
                  Confirm Schedule
                </>
              )}
            </button>
          </div>
        </form>

        <style>{`
          .custom-datepicker-input {
            width: 100%;
            height: 42px;
            padding: 0 12px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            outline: none;
            font-size: 14px;
            color: #0f172a;
            background: #ffffff;
            box-sizing: border-box;
          }
          .react-datepicker-wrapper {
            width: 100%;
          }
        `}</style>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontSize: 13,
  fontWeight: 600,
  color: "#334155",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 42,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  outline: "none",
  fontSize: 14,
  color: "#0f172a",
  background: "#ffffff",
  boxSizing: "border-box",
};

const typeButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  height: 36,
  borderRadius: 8,
  border: "none",
  background: "transparent",
  color: "#64748b",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const activeTypeStyle: React.CSSProperties = {
  background: "#ffffff",
  color: "#0f172a",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};