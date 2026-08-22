import { useEffect, useState } from "react";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import { API } from "../../imports/api";
import { downloadCsv } from "../../lib/download";
import {
  Search,
  Filter,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Ban,
  GraduationCap,
  School,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Linkedin,
  Github,
  Globe,
  ShieldCheck,
  UserRound,
  Award,
} from "lucide-react";

type Student = {
  id: number;
  user_id: number;
  name: string | null;
  email: string | null;
  avatar: string | null;
  university: string | null;
  major: string | null;
  graduation_year: number | null;
  phone: string | null;
  profile_completion: number | null;
  verification_status: string | null;
  account_status: string | null;
  verification_score: number | null;
  recommendation: string | null;
  email_verified: boolean;
  joined: string | null;
};

type StudentDetails = Student & {
  gpa?: number | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
  bio?: string | null;
  headline?: string | null;
  location?: string | null;
};

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentDetails | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const loadStudents = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const params: Record<string, string> = {};

      if (query.trim()) {
        params.search = query.trim();
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await API.get("/admin/students", { params });

      setStudents(response.data?.students ?? []);
    } catch (error) {
      console.error("Failed to load students:", error);
      setStudents([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 300);

    return () => clearTimeout(timer);
  }, [query, statusFilter]);

  const handleView = async (id: number) => {
    try {
      setViewLoading(true);

      const response = await API.get(`/admin/students/${id}`);

      setSelectedStudent(response.data?.student ?? null);
    } catch (error) {
      console.error("Failed to load student details:", error);
    } finally {
      setViewLoading(false);
    }
  };

  const updateStudent = async (
    id: number,
    action:
      | "approve"
      | "reject"
      | "suspend"
      | "restore"
      | "activate"
  ) => {
    try {
      setUpdatingId(id);

      await API.patch(`/admin/students/${id}/${action}`);

      await loadStudents(false);

      if (selectedStudent?.id === id) {
        const response = await API.get(`/admin/students/${id}`);
        setSelectedStudent(response.data?.student ?? null);
      }
    } catch (error) {
      console.error(`Failed to ${action} student:`, error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExport = () => {
    if (!students.length) {
      return;
    }

    const exportData = students.map((student, index) => ({
      No: index + 1,
      Name: student.name || "Unknown Student",
      Email: student.email || "",
      University: student.university || "",
      Major: student.major || "",
      "Graduation Year": student.graduation_year ?? "",
      "Verification Status": student.verification_status || "Pending",
      "Account Status": student.account_status || "Active",
      "Verification Score": student.verification_score ?? "",
      "Email Verified": student.email_verified ? "Yes" : "No",
      Phone: student.phone || "",
      "Profile Completion":
        student.profile_completion !== null &&
        student.profile_completion !== undefined
          ? `${student.profile_completion}%`
          : "",
      Joined: student.joined || "",
    }));

    downloadCsv(exportData, "CareerBridge_Students_Report.csv");
  };

  const statusColor = (
    status: string,
    type: "verification" | "account"
  ) => {
    if (type === "account") {
      return status === "Suspended"
        ? {
            bg: C.errorBg,
            color: C.error,
            icon: Ban,
          }
        : {
            bg: C.successBg,
            color: C.success,
            icon: CheckCircle2,
          };
    }

    if (status === "Approved") {
      return {
        bg: C.successBg,
        color: C.success,
        icon: CheckCircle2,
      };
    }

    if (status === "Rejected") {
      return {
        bg: C.errorBg,
        color: C.error,
        icon: AlertCircle,
      };
    }

    return {
      bg: C.warningBg,
      color: C.warning,
      icon: AlertCircle,
    };
  };

  const DetailItem = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
  }) => (
    <div
      style={{
        padding: "10px 12px",
        border: `1px solid ${C.border}`,
        borderRadius: 9,
        background: C.surface,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 4,
          color: C.textMuted,
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        <Icon size={12} strokeWidth={1.8} />
        <span>{label}</span>
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.text,
          wordBreak: "break-word",
        }}
      >
        {value !== null &&
        value !== undefined &&
        value !== "" ? (
          value
        ) : (
          <span
            style={{
              color: C.textMuted,
              fontWeight: 500,
            }}
          >
            —
          </span>
        )}
      </div>
    </div>
  );

  const renderStudentActions = (
    student: Student | StudentDetails,
    compact = false
  ) => {
    const verificationStatus =
      student.verification_status || "Pending";

    const accountStatus =
      student.account_status || "Active";

    const isUpdating = updatingId === student.id;
    const isSuspended = accountStatus === "Suspended";
    const isApproved = verificationStatus === "Approved";
    const isRejected = verificationStatus === "Rejected";
    const isPending = verificationStatus === "Pending";

    return (
      <div
        style={{
          display: "flex",
          gap: 5,
          flexWrap: compact ? "nowrap" : "wrap",
        }}
      >
        {compact && (
          <Btn
            v="outline"
            size="sm"
            onClick={() => handleView(student.id)}
          >
            View
          </Btn>
        )}

        {isPending && (
          <>
            <Btn
              v="secondary"
              size="sm"
              onClick={() =>
                updateStudent(student.id, "approve")
              }
            >
              {isUpdating ? "..." : "Approve"}
            </Btn>

            <Btn
              v="danger"
              size="sm"
              onClick={() =>
                updateStudent(student.id, "reject")
              }
            >
              {isUpdating ? "..." : "Reject"}
            </Btn>
          </>
        )}

        {isRejected && (
          <Btn
            v="secondary"
            size="sm"
            onClick={() =>
              updateStudent(student.id, "approve")
            }
          >
            {isUpdating ? "..." : "Approve"}
          </Btn>
        )}

        {isSuspended ? (
          <>
            <Btn
              v="secondary"
              size="sm"
              onClick={() =>
                updateStudent(student.id, "restore")
              }
            >
              {isUpdating ? "..." : "Restore"}
            </Btn>

            <Btn
              v="secondary"
              size="sm"
              onClick={() =>
                updateStudent(student.id, "activate")
              }
            >
              {isUpdating ? "..." : "Activate"}
            </Btn>
          </>
        ) : isApproved ? (
          <Btn
            v="danger"
            size="sm"
            onClick={() =>
              updateStudent(student.id, "suspend")
            }
          >
            {isUpdating ? "..." : "Suspend"}
          </Btn>
        ) : null}
      </div>
    );
  };

  return (
    <div
      style={{
        fontFamily: F,
        color: C.text,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 26,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              margin: 0,
              fontFamily: F,
              letterSpacing: "-0.02em",
            }}
          >
            Student Management
          </h1>

          <p
            style={{
              color: C.textSec,
              fontSize: 13,
              marginTop: 5,
              marginBottom: 0,
              fontFamily: F,
            }}
          >
            Manage registered students on the platform
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            position: "relative",
          }}
        >
          <Btn
            v="outline"
            icon={Filter}
            onClick={() =>
              setShowFilter((value) => !value)
            }
          >
            {statusFilter || "Filter"}
          </Btn>

          {showFilter && (
            <div
              style={{
                position: "absolute",
                top: 42,
                left: 0,
                width: 160,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                boxShadow:
                  "0 12px 30px rgba(0,0,0,0.12)",
                padding: 5,
                zIndex: 50,
              }}
            >
              {[
                {
                  label: "All Students",
                  value: "",
                },
                {
                  label: "Approved",
                  value: "Approved",
                },
                {
                  label: "Pending",
                  value: "Pending",
                },
                {
                  label: "Rejected",
                  value: "Rejected",
                },
                {
                  label: "Suspended",
                  value: "Suspended",
                },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    setStatusFilter(option.value);
                    setShowFilter(false);
                  }}
                  style={{
                    width: "100%",
                    border: "none",
                    background:
                      statusFilter === option.value
                        ? C.bg
                        : "transparent",
                    padding: "8px 10px",
                    borderRadius: 7,
                    textAlign: "left",
                    fontFamily: F,
                    fontSize: 12,
                    color: C.text,
                    cursor: "pointer",
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          <Btn
            v="outline"
            icon={Download}
            onClick={handleExport}
          >
            Export Excel
          </Btn>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          marginBottom: 18,
        }}
      >
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: C.textMuted,
          }}
        />

        <input
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          placeholder="Search students..."
          style={{
            width: "100%",
            padding: "10px 12px 10px 36px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            fontFamily: F,
            fontSize: 12,
            background: C.surface,
            boxSizing: "border-box",
            color: C.text,
            outline: "none",
          }}
        />
      </div>

      <div
        style={{
          background: C.surface,
          borderRadius: 14,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "2fr 2fr 130px 120px 280px",
            gap: 14,
            padding: "11px 18px",
            background: C.bg,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          {[
            "Name",
            "University",
            "Status",
            "Joined",
            "Actions",
          ].map((header) => (
            <span
              key={header}
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontFamily: F,
              }}
            >
              {header}
            </span>
          ))}
        </div>

        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: C.textSec,
              fontSize: 12,
              fontFamily: F,
            }}
          >
            Loading students...
          </div>
        ) : students.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: C.textSec,
              fontSize: 12,
              fontFamily: F,
            }}
          >
            No students found.
          </div>
        ) : (
          students.map((student, index) => {
            const verificationStatus =
              student.verification_status || "Pending";

            const accountStatus =
              student.account_status || "Active";

            const isSuspended =
              accountStatus === "Suspended";

            const status = isSuspended
              ? statusColor("Suspended", "account")
              : statusColor(
                  verificationStatus,
                  "verification"
                );

            const StatusIcon = status.icon;

            return (
              <div
                key={student.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "2fr 2fr 130px 120px 280px",
                  gap: 14,
                  padding: "13px 18px",
                  borderBottom:
                    index < students.length - 1
                      ? `1px solid ${C.divider}`
                      : "none",
                  alignItems: "center",
                  transition:
                    "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    C.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "transparent";
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 650,
                      fontSize: 12,
                      fontFamily: F,
                    }}
                  >
                    {student.name ||
                      "Unknown Student"}
                  </p>

                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 11,
                      color: C.textSec,
                      fontFamily: F,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {student.email || "No email"}
                  </p>
                </div>

                <span
                  style={{
                    fontSize: 12,
                    color: C.textSec,
                    fontFamily: F,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {student.university || "—"}
                </span>

                <div>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 99,
                      fontSize: 10,
                      fontWeight: 650,
                      background: status.bg,
                      color: status.color,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontFamily: F,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <StatusIcon size={11} />
                    {isSuspended
                      ? "Suspended"
                      : verificationStatus}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    color: C.textSec,
                    fontFamily: F,
                  }}
                >
                  {student.joined || "—"}
                </span>

                {renderStudentActions(
                  student,
                  true
                )}
              </div>
            );
          })
        )}
      </div>

      {(selectedStudent || viewLoading) && (
        <div
          onClick={() => {
            if (!viewLoading) {
              setSelectedStudent(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
            fontFamily: F,
            boxSizing: "border-box",
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: 720,
              height: "min(88vh, 720px)",
              background: C.surface,
              borderRadius: 15,
              border: `1px solid ${C.border}`,
              boxShadow:
                "0 18px 50px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            {viewLoading ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.textSec,
                  fontSize: 12,
                }}
              >
                Loading student details...
              </div>
            ) : selectedStudent ? (
              <>
                <div
                  style={{
                    flexShrink: 0,
                    padding: "17px 20px",
                    borderBottom:
                      `1px solid ${C.border}`,
                    background: C.surface,
                    position: "relative",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedStudent(null)
                    }
                    style={{
                      position: "absolute",
                      top: 14,
                      right: 16,
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      border:
                        `1px solid ${C.border}`,
                      background: C.surface,
                      color: C.textSec,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </button>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      paddingRight: 38,
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 13,
                        overflow: "hidden",
                        background: C.dark,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 19,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {selectedStudent.avatar ? (
                        <img
                          src={selectedStudent.avatar}
                          alt={
                            selectedStudent.name ||
                            "Student"
                          }
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        (
                          selectedStudent.name ||
                          "S"
                        )
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </div>

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          fontSize: 17,
                          lineHeight: 1.3,
                          fontWeight: 700,
                          color: C.text,
                        }}
                      >
                        {selectedStudent.name ||
                          "Unknown Student"}
                      </h2>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          marginTop: 4,
                          fontSize: 11,
                          color: C.textSec,
                          overflow: "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Mail size={11} />
                        {selectedStudent.email ||
                          "No email provided"}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          flexWrap: "wrap",
                          marginTop: 7,
                        }}
                      >
                        {(() => {
                          const account =
                            statusColor(
                              selectedStudent.account_status ||
                                "Active",
                              "account"
                            );

                          const AccountIcon =
                            account.icon;

                          return (
                            <span
                              style={{
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                gap: 4,
                                padding:
                                  "3px 7px",
                                borderRadius: 6,
                                fontSize: 9,
                                fontWeight: 650,
                                background:
                                  account.bg,
                                color:
                                  account.color,
                              }}
                            >
                              <AccountIcon
                                size={10}
                              />
                              {selectedStudent.account_status ||
                                "Active"}
                            </span>
                          );
                        })()}

                        {(() => {
                          const verification =
                            statusColor(
                              selectedStudent.verification_status ||
                                "Pending",
                              "verification"
                            );

                          const VerificationIcon =
                            verification.icon;

                          return (
                            <span
                              style={{
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                gap: 4,
                                padding:
                                  "3px 7px",
                                borderRadius: 6,
                                fontSize: 9,
                                fontWeight: 650,
                                background:
                                  verification.bg,
                                color:
                                  verification.color,
                              }}
                            >
                              <VerificationIcon
                                size={10}
                              />
                              {selectedStudent.verification_status ||
                                "Pending"}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    overflowX: "hidden",
                    padding:
                      "18px 20px 24px",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginBottom: 16,
                    }}
                  >
                    {renderStudentActions(
                      selectedStudent
                    )}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: 8,
                      marginBottom: 20,
                    }}
                  >
                    <DetailItem
                      icon={ShieldCheck}
                      label="Verification Score"
                      value={
                        selectedStudent.verification_score ??
                        null
                      }
                    />

                    <DetailItem
                      icon={
                        selectedStudent.email_verified
                          ? CheckCircle2
                          : AlertCircle
                      }
                      label="Email Status"
                      value={
                        <span
                          style={{
                            color:
                              selectedStudent.email_verified
                                ? C.success
                                : C.warning,
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            gap: 4,
                          }}
                        >
                          {selectedStudent.email_verified
                            ? "Verified"
                            : "Not Verified"}

                          {selectedStudent.email_verified ? (
                            <CheckCircle2
                              size={12}
                            />
                          ) : (
                            <AlertCircle
                              size={12}
                            />
                          )}
                        </span>
                      }
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.text,
                      marginBottom: 9,
                    }}
                  >
                    <GraduationCap size={14} />
                    Academic Information
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: 8,
                      marginBottom: 20,
                    }}
                  >
                    <DetailItem
                      icon={School}
                      label="University"
                      value={
                        selectedStudent.university
                      }
                    />

                    <DetailItem
                      icon={GraduationCap}
                      label="Major"
                      value={
                        selectedStudent.major
                      }
                    />

                    <DetailItem
                      icon={CalendarDays}
                      label="Graduation Year"
                      value={
                        selectedStudent.graduation_year
                      }
                    />

                    <DetailItem
                      icon={Award}
                      label="GPA"
                      value={
                        selectedStudent.gpa
                      }
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.text,
                      marginBottom: 9,
                    }}
                  >
                    <UserRound size={14} />
                    Contact Information
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: 8,
                      marginBottom: 20,
                    }}
                  >
                    <DetailItem
                      icon={Mail}
                      label="Email"
                      value={
                        selectedStudent.email
                      }
                    />

                    <DetailItem
                      icon={Phone}
                      label="Phone"
                      value={
                        selectedStudent.phone
                      }
                    />

                    <DetailItem
                      icon={MapPin}
                      label="Location"
                      value={
                        selectedStudent.location
                      }
                    />

                    <DetailItem
                      icon={CalendarDays}
                      label="Joined"
                      value={
                        selectedStudent.joined
                      }
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.text,
                      marginBottom: 9,
                    }}
                  >
                    <Globe size={14} />
                    Professional Links
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(3, minmax(0, 1fr))",
                      gap: 8,
                      marginBottom: 20,
                    }}
                  >
                    <DetailItem
                      icon={Linkedin}
                      label="LinkedIn"
                      value={
                        selectedStudent.linkedin ? (
                          <a
                            href={String(
                              selectedStudent.linkedin
                            )}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: C.dark,
                              textDecoration:
                                "none",
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              gap: 4,
                            }}
                          >
                            Open Profile
                            <span>↗</span>
                          </a>
                        ) : null
                      }
                    />

                    <DetailItem
                      icon={Github}
                      label="GitHub"
                      value={
                        selectedStudent.github ? (
                          <a
                            href={String(
                              selectedStudent.github
                            )}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: C.dark,
                              textDecoration:
                                "none",
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              gap: 4,
                            }}
                          >
                            Open Profile
                            <span>↗</span>
                          </a>
                        ) : null
                      }
                    />

                    <DetailItem
                      icon={Globe}
                      label="Portfolio"
                      value={
                        selectedStudent.portfolio ? (
                          <a
                            href={String(
                              selectedStudent.portfolio
                            )}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: C.dark,
                              textDecoration:
                                "none",
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              gap: 4,
                            }}
                          >
                            Open Website
                            <span>↗</span>
                          </a>
                        ) : null
                      }
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.text,
                      marginBottom: 9,
                    }}
                  >
                    <UserRound size={14} />
                    About Student
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: 8,
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 12px",
                        border:
                          `1px solid ${C.border}`,
                        borderRadius: 9,
                        background: C.bg,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: C.textMuted,
                          marginBottom: 4,
                          fontWeight: 600,
                        }}
                      >
                        Headline
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.text,
                        }}
                      >
                        {selectedStudent.headline ||
                          "No headline provided"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "10px 12px",
                        border:
                          `1px solid ${C.border}`,
                        borderRadius: 9,
                        background: C.bg,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: C.textMuted,
                          marginBottom: 4,
                          fontWeight: 600,
                        }}
                      >
                        Bio
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: C.text,
                          lineHeight: 1.55,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {selectedStudent.bio ||
                          "No bio provided"}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.text,
                      marginBottom: 9,
                    }}
                  >
                    <ShieldCheck size={14} />
                    Verification Recommendation
                  </div>

                  <div
                    style={{
                      padding: "11px 13px",
                      border:
                        `1px solid ${C.border}`,
                      borderRadius: 9,
                      background: C.bg,
                      color: C.textSec,
                      fontSize: 12,
                      lineHeight: 1.55,
                    }}
                  >
                    {selectedStudent.recommendation ||
                      "No recommendation available."}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
