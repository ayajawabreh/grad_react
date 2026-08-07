import { useEffect, useState } from "react";
import { C, F } from "../../constants/tokens";
import {
  fetchInterviews,
  fetchInterviewStats,
  fetchInterviewCalendar,
  cancelInterview,
  completeInterview,
  updateInterview,
  fetchInterviewFeedback,
  createInterviewFeedback,
  updateInterviewFeedback,
  deleteInterviewFeedback,
} from "../../imports/interviews";
import { SBadge } from "../../components/ui";
import {
  CalendarCheck,
  Clock,
  Users,
  CheckCircle,
  X,
  Video,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Pencil,
  Trash2,
  MessageSquare,
  Star,
  RotateCcw,
} from "lucide-react";

type ToastType = "success" | "danger" | "info";

interface ToastState {
  message: string;
  type: ToastType;
}

export default function CompanyInterviews() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [stats, setStats] = useState({
    scheduled: 0,
    this_week: 0,
    completed: 0,
    candidates: 0,
  });
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState<"upcoming" | "completed" | "cancelled">("upcoming");

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    date: "",
    time: "",
    type: "Online",
    meeting_link: "",
    location: "",
  });

  const [feedback, setFeedback] = useState<any | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    technical_score: "",
    communication_score: "",
    decision: "Accepted",
    notes: "",
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return null;
    const formattedStr = dateStr.includes(" ")
      ? dateStr.replace(" ", "T")
      : dateStr;
    const date = new Date(formattedStr);
    if (isNaN(date.getTime())) return null;
    return date;
  };

  const loadData = () => {
    fetchInterviews().then((res) => {
      setInterviews(res.data || []);
    });

    fetchInterviewStats().then((res) => {
      setStats(res.data);
    });

    fetchInterviewCalendar().then((res) => {
      setCalendar(res.data || []);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedInterview =
    selected !== null ? interviews.find((i) => i.id === selected) : null;

  useEffect(() => {
    if (selectedInterview && selectedInterview.status === "Completed") {
      setFeedbackLoading(true);
      fetchInterviewFeedback(selectedInterview.id)
        .then((res: any) => {
          setFeedback(res.data || null);
        })
        .catch(() => {
          setFeedback(null);
        })
        .finally(() => {
          setFeedbackLoading(false);
        });
    } else {
      setFeedback(null);
    }
  }, [selected]);

  const displayedInterviews = interviews.filter((iv) => {
    if (filter === "completed") return iv.status === "Completed";
    if (filter === "cancelled") return iv.status === "Cancelled";
    return iv.status !== "Completed" && iv.status !== "Cancelled";
  });

  const handleCancel = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancel Interview",
      message: "Are you sure you want to cancel this interview?",
      onConfirm: () => {
        cancelInterview(id).then(() => {
          loadData();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          showToast("Interview cancelled successfully", "danger");
        });
      },
    });
  };

  const handleComplete = (id: number) => {
    completeInterview(id).then(() => {
      loadData();
      showToast("Interview completed successfully", "success");
    });
  };

  const handleEditClick = () => {
    if (!selectedInterview) return;

    const rawDate =
      selectedInterview.interview_date || selectedInterview.date || "";
    let dateVal = "";
    let timeVal = "";

    if (rawDate) {
      const d = formatDate(rawDate);
      if (d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        dateVal = `${year}-${month}-${day}`;
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        timeVal = `${hours}:${minutes}`;
      }
    }

    const openEditForm = () => {
      setEditData({
        date: dateVal,
        time: timeVal,
        type: selectedInterview.type || "Online",
        meeting_link: selectedInterview.meeting_link || "",
        location: selectedInterview.location || "",
      });
      setEditMode(true);
    };

    if (
      selectedInterview.status === "Cancelled" ||
      selectedInterview.status === "cancelled"
    ) {
      setConfirmModal({
        isOpen: true,
        title: "Reschedule Interview",
        message: "This interview is cancelled. Do you want to reschedule it?",
        onConfirm: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          openEditForm();
        },
      });
    } else {
      openEditForm();
    }
  };

  const handleUpdate = () => {
    if (!selectedInterview) return;

    const fullDateTime = `${editData.date} ${editData.time}`;

    updateInterview(selectedInterview.id, {
      interview_date: fullDateTime,
      type: editData.type,
      meeting_link: editData.meeting_link,
      location: editData.location,
    }).then(() => {
      loadData();
      setEditMode(false);
      showToast("Interview updated successfully", "success");
    });
  };

  const handleFeedbackClick = () => {
    if (!selectedInterview) return;

    setFeedbackData({
      technical_score: feedback?.technical_score?.toString() || "",
      communication_score: feedback?.communication_score?.toString() || "",
      decision: feedback?.decision || "Hire",
      notes: feedback?.notes || "",
    });
    setFeedbackMode(true);
  };

 const handleSaveFeedback = () => {
  if (!selectedInterview) return;

 const payload = {
  technical_score: Number(feedbackData.technical_score) || 0,
  communication_score: Number(feedbackData.communication_score) || 0,
  final_decision: feedbackData.decision,
  notes: feedbackData.notes,
};

  console.log("Payload:", payload);

  const action = feedback
  ? updateInterviewFeedback(selectedInterview.id, payload)
  : createInterviewFeedback(selectedInterview.id, payload);

action
  .then((res: any) => {
    console.log(
  "FINAL DECISION VALUE:",
  res.data.feedback.final_decision
);

    setFeedback({
    ...res.data.feedback,
    final_decision: res.data.feedback.final_decision,
  });
    setFeedbackMode(false);

    showToast(
      feedback
        ? "Feedback updated successfully"
        : "Feedback added successfully",
      "success"
    );
  })
  .catch((err) => {
    console.log("STATUS:", err.response?.status);
    console.log("DATA:", err.response?.data);

    showToast(
      err.response?.data?.message || "Failed to save feedback",
      "danger"
    );
  });
};

  const handleDeleteFeedback = () => {
    if (!selectedInterview) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete Feedback",
      message: "Are you sure you want to delete this feedback?",
      onConfirm: () => {
        deleteInterviewFeedback(selectedInterview.id).then(() => {
          setFeedback(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          showToast("Feedback deleted successfully", "danger");
        });
      },
    });
  };

  const toastStyles = {
    success: {
      bg: "rgba(16, 185, 129, 0.08)",
      border: "rgba(16, 185, 129, 0.25)",
      iconColor: "#10B981",
      textColor: "#065F46",
      Icon: CheckCircle2,
    },
    danger: {
      bg: "rgba(239, 68, 68, 0.08)",
      border: "rgba(239, 68, 68, 0.25)",
      iconColor: "#EF4444",
      textColor: "#991B1B",
      Icon: XCircle,
    },
    info: {
      bg: "rgba(59, 130, 246, 0.08)",
      border: "rgba(59, 130, 246, 0.25)",
      iconColor: "#3B82F6",
      textColor: "#1E40AF",
      Icon: Info,
    },
  };

  return (
    <div style={{ fontFamily: F, color: C.text, position: "relative" }}>
      {toast && (() => {
        const style = toastStyles[toast.type];
        const ToastIcon = style.Icon;
        return (
          <div
            style={{
              position: "fixed",
              bottom: 28,
              right: 28,
              backgroundColor: C.surface,
              background: `linear-gradient(135deg, ${C.surface} 0%, ${style.bg} 100%)`,
              color: C.text,
              padding: "14px 22px",
              borderRadius: "14px",
              border: `1px solid ${style.border}`,
              boxShadow: "0 12px 30px -8px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.05)",
              fontSize: 14,
              fontWeight: 600,
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              gap: 12,
              backdropFilter: "blur(12px)",
              animation: "toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: style.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ToastIcon size={18} color={style.iconColor} />
            </div>
            <span style={{ color: C.text, fontWeight: 600 }}>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{
                background: "transparent",
                border: "none",
                color: C.textSec,
                cursor: "pointer",
                padding: 2,
                marginLeft: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.6,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
            >
              <X size={14} />
            </button>
          </div>
        );
      })()}

      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          Interviews
        </h1>
        <p style={{ color: C.textSec, fontSize: 14, marginTop: 6 }}>
          Schedule and manage candidate interviews
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: "Scheduled",
            value: stats.scheduled,
            icon: CalendarCheck,
            color: C.info,
          },
          {
            label: "This Week",
            value: stats.this_week,
            icon: Clock,
            color: C.accent,
          },
          {
            label: "Completed",
            value: stats.completed,
            icon: CheckCircle,
            color: C.success,
          },
          {
            label: "Candidates",
            value: stats.candidates,
            icon: Users,
            color: C.purple,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: C.surface,
              borderRadius: 16,
              padding: "16px 20px",
              border: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: `${s.color}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                {s.value}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.textSec }}>
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: C.surface,
          borderRadius: 20,
          padding: 24,
          border: `1px solid ${C.border}`,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>
          This Week
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 10,
          }}
        >
          {calendar.map((day) => {
            const hasInterview = day.has_interviews;

            return (
              <div
                key={day.date}
                onClick={() => {
                  if (!hasInterview) return;
                  const interview = interviews.find((iv) => {
                    const d = formatDate(iv.interview_date || iv.date);
                    if (!d) return false;
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    const dateStr = String(d.getDate()).padStart(2, "0");
                    return `${year}-${month}-${dateStr}` === day.date;
                  });
                  if (interview) {
                    setSelected(interview.id);
                  }
                }}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: `1px solid ${hasInterview ? C.accent : C.border}`,
                  background: hasInterview ? `${C.accent}15` : C.bg,
                  cursor: hasInterview ? "pointer" : "default",
                  transition: "all 0.15s",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 11,
                    color: C.textSec,
                    fontWeight: 500,
                  }}
                >
                  {day.day}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: hasInterview ? C.accent : C.text,
                  }}
                >
                  {day.number}
                </p>
                {hasInterview && (
                  <div
                    style={{
                      marginTop: 6,
                      height: 4,
                      background: C.accent,
                      borderRadius: 99,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: selectedInterview ? "1fr 340px" : "1fr",
          gap: 20,
        }}
      >
        <div
          style={{
            background: C.surface,
            borderRadius: 20,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${C.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
              {filter === "upcoming"
                ? "Upcoming Interviews"
                : filter === "completed"
                ? "Completed Interviews"
                : "Cancelled Interviews"}
            </h2>

            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "upcoming", label: "Upcoming" },
                { key: "completed", label: "Completed" },
                { key: "cancelled", label: "Cancelled" },
              ].map((f) => {
                const isActive = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key as "upcoming" | "completed" | "cancelled")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 99,
                      border: `1px solid ${isActive ? C.accent : C.border}`,
                      background: isActive ? `${C.accent}15` : C.bg,
                      color: isActive ? C.accent : C.textSec,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {displayedInterviews.length === 0 ? (
            <div style={{ padding: "24px 20px", fontSize: 13, color: C.textSec }}>
              No interviews found.
            </div>
          ) : (
            displayedInterviews.map((iv, i) => {
              const dateObj = formatDate(iv.interview_date || iv.date);
              return (
                <div
                  key={iv.id}
                  onClick={() => {
                    setSelected(iv.id === selected ? null : iv.id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    borderBottom:
                      i < displayedInterviews.length - 1 ? `1px solid ${C.divider}` : "none",
                    cursor: "pointer",
                    background:
                      selected === iv.id ? `${C.accent}12` : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (selected !== iv.id) e.currentTarget.style.background = C.bg;
                  }}
                  onMouseLeave={(e) => {
                    if (selected !== iv.id)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <img
                    src={iv.avatar}
                    alt={iv.candidate_name || iv.name}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
                      {iv.candidate_name || iv.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: C.textSec }}>
                      {iv.headline || iv.role} · {iv.type}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>
                      {dateObj ? dateObj.toLocaleDateString("en-US") : "-"}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: C.textSec }}>
                      {dateObj
                        ? dateObj.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}{" "}
                      · {iv.duration || "-"}
                    </p>
                  </div>
                  <SBadge s={iv.status} />
                </div>
              );
            })
          )}
        </div>

        {selectedInterview && (
          <div
            style={{
              background: C.surface,
              borderRadius: 20,
              padding: 24,
              border: `1px solid ${C.accent}`,
              height: "fit-content",
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>
              Interview Details
            </h3>
            <img
              src={selectedInterview.avatar}
              alt={selectedInterview.candidate_name || selectedInterview.name}
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: 12,
              }}
            />
            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 16 }}>
              {selectedInterview.candidate_name || selectedInterview.name}
            </p>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: C.textSec }}>
              {selectedInterview.headline || selectedInterview.role}
            </p>

            {[
              { label: "Type", value: selectedInterview.type || "-" },
              {
                label: "Date",
                value: formatDate(
                  selectedInterview.interview_date || selectedInterview.date
                )
                  ? formatDate(
                      selectedInterview.interview_date || selectedInterview.date
                    )!.toLocaleDateString("en-US")
                  : "-",
              },
              {
                label: "Time",
                value: formatDate(
                  selectedInterview.interview_date || selectedInterview.date
                )
                  ? formatDate(
                      selectedInterview.interview_date || selectedInterview.date
                    )!.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-",
              },
              { label: "Duration", value: selectedInterview.duration || "-" },
              { label: "Status", value: selectedInterview.status || "-" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  padding: "8px 0",
                  borderBottom: `1px solid ${C.divider}`,
                }}
              >
                <span style={{ fontSize: 12, color: C.textSec }}>
                  {item.label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  {item.value}
                </span>
              </div>
            ))}

            {selectedInterview.status !== "Completed" &&
              selectedInterview.status !== "Cancelled" && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 20,
                  }}
                >
                  <button
                    onClick={handleEditClick}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      background: C.bg,
                      color: C.text,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleCancel(selectedInterview.id)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 10,
                      border: "none",
                      background: "#fee2e2",
                      color: "#ef4444",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleComplete(selectedInterview.id)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 10,
                      border: "none",
                      background: `${C.success}20`,
                      color: C.success,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Complete
                  </button>
                </div>
              )}

            {selectedInterview.status === "Cancelled" && (
              <div
                style={{
                  marginTop: 20,
                }}
              >
                <button
                  onClick={handleEditClick}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "10px",
                    borderRadius: 10,
                    border: `1px solid ${C.accent}`,
                    background: `${C.accent}15`,
                    color: C.accent,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={15} />
                  Reschedule
                </button>
              </div>
            )}

            {selectedInterview.status === "Completed" && (
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MessageSquare size={14} color={C.textSec} />
                    Feedback
                  </h4>
                </div>

                {feedbackLoading ? (
                  <p style={{ fontSize: 12, color: C.textSec, margin: 0 }}>
                    Loading feedback...
                  </p>
                ) : feedback ? (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 10,
                        padding: "8px 0",
                        borderBottom: `1px solid ${C.divider}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: C.textSec,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Star size={12} color={C.textSec} />
                        Technical Score
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>
                        {feedback.technical_score ?? "-"}/100
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 10,
                        padding: "8px 0",
                        borderBottom: `1px solid ${C.divider}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: C.textSec,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Star size={12} color={C.textSec} />
                        Communication Score
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>
                        {feedback.communication_score ?? "-"}/100
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                        padding: "8px 0",
                        borderBottom: `1px solid ${C.divider}`,
                      }}
                    >
                      <span style={{ fontSize: 12, color: C.textSec }}>
                        Final Decision
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 99,
                          background:
                            feedback.decision === "Accepted"
                              ? `${C.success}20`
                              : feedback.decision === "Rejected"
                              ? "#fee2e2"
                              : `${C.accent}15`,
                          color:
                            feedback.decision === "Accepted"
                              ? C.success
                              : feedback.decision === "Rejected"
                              ? "#ef4444"
                              : C.accent,
                        }}
                      >
                        {feedback.final_decision || "-"}
                      </span>
                    </div>
                    {feedback.notes && (
                      <div style={{ marginBottom: 14, padding: "8px 0" }}>
                        <span
                          style={{
                            fontSize: 12,
                            color: C.textSec,
                            display: "block",
                            marginBottom: 6,
                          }}
                        >
                          Notes
                        </span>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            fontWeight: 500,
                            lineHeight: 1.5,
                          }}
                        >
                          {feedback.notes}
                        </p>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleFeedbackClick}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "10px",
                          borderRadius: 10,
                          border: `1px solid ${C.border}`,
                          background: C.bg,
                          color: C.text,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        onClick={handleDeleteFeedback}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "10px",
                          borderRadius: 10,
                          border: "none",
                          background: "#fee2e2",
                          color: "#ef4444",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 12, color: C.textSec, margin: "0 0 12px" }}>
                      No feedback added yet for this interview.
                    </p>
                    <button
                      onClick={handleFeedbackClick}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 10,
                        border: "none",
                        background: C.accent,
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Add Feedback
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {editMode && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: C.surface,
              borderRadius: 20,
              padding: 24,
              width: "100%",
              maxWidth: 460,
              border: `1px solid ${C.border}`,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Edit Interview
              </h3>
              <button
                onClick={() => setEditMode(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: C.textSec,
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.textSec,
                      marginBottom: 6,
                    }}
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    value={editData.date}
                    onChange={(e) =>
                      setEditData({ ...editData, date: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                      background: C.bg,
                      color: C.text,
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.textSec,
                      marginBottom: 6,
                    }}
                  >
                    Time
                  </label>
                  <input
                    type="time"
                    value={editData.time}
                    onChange={(e) =>
                      setEditData({ ...editData, time: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                      background: C.bg,
                      color: C.text,
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.textSec,
                    marginBottom: 6,
                  }}
                >
                  Interview Type
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { key: "Online", label: "Online", icon: Video },
                    { key: "Onsite", label: "Onsite", icon: MapPin },
                  ].map((item) => {
                    const isSelected = editData.type === item.key;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setEditData({ ...editData, type: item.key })
                        }
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "10px",
                          borderRadius: 10,
                          border: `1px solid ${
                            isSelected ? C.accent : C.border
                          }`,
                          background: isSelected ? `${C.accent}15` : C.bg,
                          color: isSelected ? C.accent : C.text,
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: 13,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <Icon size={16} color={isSelected ? C.accent : C.textSec} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {editData.type === "Online" ? (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.textSec,
                      marginBottom: 6,
                    }}
                  >
                    Meeting Link
                  </label>
                  <input
                    placeholder="https://meet.google.com/..."
                    value={editData.meeting_link}
                    onChange={(e) =>
                      setEditData({ ...editData, meeting_link: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                      background: C.bg,
                      color: C.text,
                    }}
                  />
                </div>
              ) : (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.textSec,
                      marginBottom: 6,
                    }}
                  >
                    Location
                  </label>
                  <input
                    placeholder="Company Office, Floor 3..."
                    value={editData.location}
                    onChange={(e) =>
                      setEditData({ ...editData, location: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                      background: C.bg,
                      color: C.text,
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    color: C.text,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 10,
                    border: "none",
                    background: C.accent,
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {feedbackMode && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: C.surface,
              borderRadius: 20,
              padding: 24,
              width: "100%",
              maxWidth: 460,
              border: `1px solid ${C.border}`,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {feedback ? "Edit Feedback" : "Add Feedback"}
              </h3>
              <button
                onClick={() => setFeedbackMode(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: C.textSec,
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.textSec,
                      marginBottom: 6,
                    }}
                  >
                    Technical Score (0-100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={feedbackData.technical_score}
                    onChange={(e) =>
                      setFeedbackData({
                        ...feedbackData,
                        technical_score: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                      background: C.bg,
                      color: C.text,
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.textSec,
                      marginBottom: 6,
                    }}
                  >
                    Communication Score (0-100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={feedbackData.communication_score}
                    onChange={(e) =>
                      setFeedbackData({
                        ...feedbackData,
                        communication_score: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                      background: C.bg,
                      color: C.text,
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.textSec,
                    marginBottom: 6,
                  }}
                >
                  Final Decision
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                    {["Accepted", "Rejected"].map((d) => {
                    const isSelected = feedbackData.decision === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          setFeedbackData({ ...feedbackData, decision: d })
                        }
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: 10,
                          border: `1px solid ${
                            isSelected ? C.accent : C.border
                          }`,
                          background: isSelected ? `${C.accent}15` : C.bg,
                          color: isSelected ? C.accent : C.text,
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: 13,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.textSec,
                    marginBottom: 6,
                  }}
                >
                  Notes
                </label>
                <textarea
                  placeholder="Additional notes about the candidate..."
                  value={feedbackData.notes}
                  onChange={(e) =>
                    setFeedbackData({ ...feedbackData, notes: e.target.value })
                  }
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    boxSizing: "border-box",
                    outline: "none",
                    background: C.bg,
                    color: C.text,
                    resize: "vertical",
                    fontFamily: F,
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setFeedbackMode(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    color: C.text,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveFeedback}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 10,
                    border: "none",
                    background: C.accent,
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Save Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: C.surface,
              borderRadius: 20,
              padding: 24,
              width: "100%",
              maxWidth: 380,
              border: `1px solid ${C.border}`,
              textAlign: "center",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <AlertTriangle size={24} color="#ef4444" />
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>
              {confirmModal.title}
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: C.textSec }}>
              {confirmModal.message}
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() =>
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                }
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  color: C.text,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}