import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { C, F } from "../../constants/tokens";
import { Btn } from "../../components/ui";
import { API } from "../../imports/api";
import {
  Search,
  Filter,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Ban,
  Building2,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Globe,
  ShieldCheck,
  BriefcaseBusiness,
  Eye,
} from "lucide-react";

type Company = {
  id: number;
  user_id?: number;
  company_name: string | null;
  industry: string | null;
  company_size?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  description?: string | null;
  logo?: string | null;
  approval_status: string | null;
  is_verified?: boolean;
  created_at?: string | null;
  joined?: string | null;
  job_posts_count?: number;
  verification_score?: number | null;
  risk_level?: string | null;
  recommendation?: string | null;
  rejection_reason?: string | null;
  reports_count?: number;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

type CompanyDetails = Company & {
  founded_year?: number | null;
  linkedin?: string | null;
  github?: string | null;
};

export default function AdminCompanies() {
  const { pathname } = useLocation();
  const pendingOnly = pathname === "/admin/pending";
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(pendingOnly ? "Pending" : "");
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyDetails | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rejectCompanyId, setRejectCompanyId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const loadCompanies = async (showLoading = true) => {
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

      const response = await API.get("/admin/companies", { params });

      setCompanies(response.data?.companies ?? []);
    } catch (error) {
      console.error("Failed to load companies:", error);
      setCompanies([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCompanies();
    }, 300);

    return () => clearTimeout(timer);
  }, [query, statusFilter]);

  useEffect(() => {
    const refresh = () => loadCompanies(false);
    const interval = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [query, statusFilter]);

  useEffect(() => {
    setStatusFilter(pendingOnly ? "Pending" : "");
  }, [pendingOnly]);

  const handleView = async (id: number) => {
    try {
      setViewLoading(true);

      const response = await API.get(`/admin/companies/${id}`);

      setSelectedCompany(response.data?.company ?? null);
    } catch (error) {
      console.error("Failed to load company details:", error);
    } finally {
      setViewLoading(false);
    }
  };

  const updateCompanyState = (
    id: number,
    updatedCompany: Partial<Company> | undefined,
    status: string,
    isVerified: boolean
  ) => {
    setCompanies((currentCompanies) =>
      currentCompanies.map((company) =>
        company.id === id
          ? {
              ...company,
              ...(updatedCompany ?? {}),
              approval_status: status,
              is_verified: isVerified,
            }
          : company
      )
    );

    setSelectedCompany((current) =>
      current && current.id === id
        ? {
            ...current,
            ...(updatedCompany ?? {}),
            approval_status: status,
            is_verified: isVerified,
          }
        : current
    );
  };

  const handleApprove = async (id: number) => {
    try {
      setUpdatingId(id);

      const response = await API.patch(
        `/admin/companies/${id}/approve`
      );

      updateCompanyState(
        id,
        response.data?.company,
        "Approved",
        true
      );
    } catch (error) {
      console.error("Failed to approve company:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const openRejectModal = (id: number) => {
    setRejectCompanyId(id);
    setRejectReason("");
    setRejectError("");
  };

  const handleReject = async () => {
    if (!rejectCompanyId) return;
    if (rejectReason.trim().length < 10) {
      setRejectError("Please provide a clear reason of at least 10 characters.");
      return;
    }

    try {
      setUpdatingId(rejectCompanyId);

      const response = await API.patch(
        `/admin/companies/${rejectCompanyId}/reject`,
        { rejection_reason: rejectReason.trim() }
      );

      updateCompanyState(
        rejectCompanyId,
        response.data?.company,
        "Rejected",
        false
      );
      setRejectCompanyId(null);
      setRejectReason("");
    } catch (error: any) {
      console.error("Failed to reject company:", error);
      setRejectError(error?.response?.data?.message || "Failed to reject company.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSuspend = async (id: number) => {
    try {
      setUpdatingId(id);

      const response = await API.patch(
        `/admin/companies/${id}/suspend`
      );

      updateCompanyState(
        id,
        response.data?.company,
        "Suspended",
        false
      );
    } catch (error) {
      console.error("Failed to suspend company:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      setUpdatingId(id);

      const response = await API.patch(
        `/admin/companies/${id}/approve`
      );

      updateCompanyState(
        id,
        response.data?.company,
        "Approved",
        true
      );
    } catch (error) {
      console.error("Failed to restore company:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await API.get("/admin/companies/export", {
        responseType: "blob",
        params: {
          status: statusFilter || undefined,
        },
      });

      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "companies.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      window.alert(
        error?.response?.data?.message || "Failed to download companies report."
      );
    } finally {
      setExporting(false);
    }
  };

  const statusColor = (status: string) => {
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

    if (status === "Suspended") {
      return {
        bg: C.errorBg,
        color: C.error,
        icon: Ban,
      };
    }

    return {
      bg: C.warningBg,
      color: C.warning,
      icon: AlertCircle,
    };
  };

  const formatJoined = (company: Company) => {
    if (company.joined) {
      return company.joined;
    }

    if (company.created_at) {
      return company.created_at.substring(0, 10);
    }

    return "—";
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
              letterSpacing: "-0.02em",
            }}
          >
            {pendingOnly ? "Pending Companies" : "Company Management"}
          </h1>

          <p
            style={{
              color: C.textSec,
              fontSize: 13,
              marginTop: 5,
              marginBottom: 0,
            }}
          >
            {pendingOnly ? "Review company registrations awaiting approval" : "Review and manage registered companies"}
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
                { label: "All Companies", value: "" },
                { label: "Approved", value: "Approved" },
                { label: "Pending", value: "Pending" },
                { label: "Rejected", value: "Rejected" },
                { label: "Suspended", value: "Suspended" },
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
            disabled={exporting}
          >
            {exporting ? "Downloading..." : "Download Excel"}
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
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search companies..."
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
              "2fr 1.5fr 120px 120px 120px 240px",
            gap: 14,
            padding: "11px 18px",
            background: C.bg,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          {[
            "Company",
            "Industry",
            "Status",
            "Joined",
            "Jobs",
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
            }}
          >
            Loading companies...
          </div>
        ) : companies.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: C.textSec,
              fontSize: 12,
            }}
          >
            No companies found.
          </div>
        ) : (
          companies.map((company, index) => {
            const status =
              company.approval_status || "Pending";

            const statusData = statusColor(status);
            const StatusIcon = statusData.icon;
            const isSuspended = status === "Suspended";
            const isApproved = status === "Approved";
            const isPending = status === "Pending";
            const isUpdating =
              updatingId === company.id;

            return (
              <div
                key={company.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "2fr 1.5fr 120px 120px 120px 240px",
                  gap: 14,
                  padding: "13px 18px",
                  borderBottom:
                    index < companies.length - 1
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
                    }}
                  >
                    {company.company_name ||
                      "Unknown Company"}
                  </p>

                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 11,
                      color: C.textSec,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {company.email ||
                      company.user?.email ||
                      "No email"}
                  </p>
                </div>

                <span
                  style={{
                    fontSize: 12,
                    color: C.textSec,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {company.industry || "—"}
                </span>

                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 650,
                    background: statusData.bg,
                    color: statusData.color,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    whiteSpace: "nowrap",
                    width: "fit-content",
                  }}
                >
                  <StatusIcon size={11} />
                  {status}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    color: C.textSec,
                  }}
                >
                  {formatJoined(company)}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    color: C.textSec,
                  }}
                >
                  {company.job_posts_count ?? 0}
                </span>

                <div
                  style={{
                    display: "flex",
                    gap: 7,
                    alignItems: "center",
                    flexWrap: "nowrap",
                    minWidth: 0,
                  }}
                >
                  <Btn
                    v="outline"
                    size="sm"
                    icon={Eye}
                    style={{ padding: "7px 10px", borderRadius: 9, whiteSpace: "nowrap" }}
                    onClick={() =>
                      handleView(company.id)
                    }
                  >
                    View
                  </Btn>

                  {isSuspended ? (
                    <Btn
                      v="secondary"
                      size="sm"
                      style={{ padding: "7px 10px", borderRadius: 9, whiteSpace: "nowrap" }}
                      onClick={() =>
                        handleRestore(company.id)
                      }
                    >
                      {isUpdating ? "..." : "Restore"}
                    </Btn>
                  ) : isApproved ? (
                    <Btn
                      v="danger"
                      size="sm"
                      style={{ padding: "7px 10px", borderRadius: 9, whiteSpace: "nowrap" }}
                      onClick={() =>
                        handleSuspend(company.id)
                      }
                    >
                      {isUpdating ? "..." : "Suspend"}
                    </Btn>
                  ) : isPending ? (
                    <>
                      <Btn
                        v="secondary"
                        size="sm"
                        icon={CheckCircle2}
                        style={{ padding: "7px 10px", borderRadius: 9, whiteSpace: "nowrap", background: C.successBg, color: C.success }}
                        onClick={() =>
                          handleApprove(company.id)
                        }
                      >
                        {isUpdating
                          ? "..."
                          : "Approve"}
                      </Btn>

                      <Btn
                        v="danger"
                        size="sm"
                        icon={X}
                        style={{ padding: "7px 10px", borderRadius: 9, whiteSpace: "nowrap" }}
                        onClick={() =>
                          openRejectModal(company.id)
                        }
                      >
                        {isUpdating ? "..." : "Reject"}
                      </Btn>
                    </>
                  ) : status === "Rejected" ? (
                    <Btn
                      v="secondary"
                      size="sm"
                      icon={CheckCircle2}
                      style={{ padding: "7px 10px", borderRadius: 9, whiteSpace: "nowrap", background: C.successBg, color: C.success }}
                      onClick={() =>
                        handleApprove(company.id)
                      }
                    >
                      {isUpdating
                        ? "..."
                        : "Approve"}
                    </Btn>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {rejectCompanyId && (
        <div onClick={() => updatingId === null && setRejectCompanyId(null)} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: 440, maxWidth: "100%", padding: 24, borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 20px 50px rgba(0,0,0,.18)" }}>
            <h2 style={{ margin: "0 0 7px", fontSize: 18, color: C.text }}>Reject Company</h2>
            <p style={{ margin: "0 0 17px", color: C.textSec, fontSize: 13, lineHeight: 1.55 }}>Explain why the company was rejected. This reason will be shown to the company when it attempts to sign in.</p>
            <label style={{ display: "block", marginBottom: 7, color: C.text, fontSize: 12, fontWeight: 700 }}>Rejection reason</label>
            <textarea autoFocus rows={5} value={rejectReason} onChange={(event) => { setRejectReason(event.target.value); setRejectError(""); }} placeholder="Example: The company information could not be verified. Please provide a valid website and business contact details." style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 11, border: `1px solid ${rejectError ? C.error : C.border}`, resize: "vertical", outline: 0, fontFamily: F, color: C.text, fontSize: 13 }} />
            {rejectError && <div style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 9, color: C.error, fontSize: 12 }}><AlertCircle size={15} />{rejectError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 18 }}>
              <Btn v="outline" size="sm" disabled={updatingId !== null} onClick={() => setRejectCompanyId(null)}>Cancel</Btn>
              <Btn v="danger" size="sm" disabled={updatingId !== null} onClick={handleReject}>{updatingId !== null ? "Rejecting..." : "Reject Company"}</Btn>
            </div>
          </div>
        </div>
      )}

      {(selectedCompany || viewLoading) && (
        <div
          onClick={() => {
            if (!viewLoading) {
              setSelectedCompany(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
            boxSizing: "border-box",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
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
                Loading company details...
              </div>
            ) : selectedCompany ? (
              <>
                <div
                  style={{
                    flexShrink: 0,
                    padding: "17px 20px",
                    borderBottom: `1px solid ${C.border}`,
                    background: C.surface,
                    position: "relative",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCompany(null)
                    }
                    style={{
                      position: "absolute",
                      top: 14,
                      right: 16,
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      border: `1px solid ${C.border}`,
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
                      {selectedCompany.logo ? (
                        <img
                          src={selectedCompany.logo}
                          alt={
                            selectedCompany.company_name ||
                            "Company"
                          }
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        (
                          selectedCompany.company_name ||
                          "C"
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
                        {selectedCompany.company_name ||
                          "Unknown Company"}
                      </h2>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          marginTop: 4,
                          fontSize: 11,
                          color: C.textSec,
                        }}
                      >
                        <Mail size={11} />
                        {selectedCompany.email ||
                          selectedCompany.user?.email ||
                          "No email provided"}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                          marginTop: 7,
                        }}
                      >
                        {(() => {
                          const data = statusColor(
                            selectedCompany.approval_status ||
                              "Pending"
                          );

                          const Icon = data.icon;

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
                                  data.bg,
                                color:
                                  data.color,
                              }}
                            >
                              <Icon size={10} />
                              {selectedCompany.approval_status ||
                                "Pending"}
                            </span>
                          );
                        })()}

                        {selectedCompany.is_verified && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 7px",
                              borderRadius: 6,
                              fontSize: 9,
                              fontWeight: 650,
                              background: C.successBg,
                              color: C.success,
                            }}
                          >
                            <CheckCircle2 size={10} />
                            Verified
                          </span>
                        )}
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
                    padding: "18px 20px 24px",
                    boxSizing: "border-box",
                  }}
                >
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
                      icon={ShieldCheck}
                      label="Verification Score"
                      value={
                        selectedCompany.verification_score ??
                        null
                      }
                    />

                    <DetailItem
                      icon={AlertCircle}
                      label="Risk Level"
                      value={
                        selectedCompany.risk_level
                      }
                    />

                    <DetailItem
                      icon={BriefcaseBusiness}
                      label="Job Posts"
                      value={
                        selectedCompany.job_posts_count ??
                        0
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
                    <Building2 size={14} />
                    Company Information
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
                      icon={Building2}
                      label="Company Name"
                      value={
                        selectedCompany.company_name
                      }
                    />

                    <DetailItem
                      icon={BriefcaseBusiness}
                      label="Industry"
                      value={
                        selectedCompany.industry
                      }
                    />

                    <DetailItem
                      icon={Building2}
                      label="Company Size"
                      value={
                        selectedCompany.company_size
                      }
                    />

                    <DetailItem
                      icon={CalendarDays}
                      label="Founded Year"
                      value={
                        selectedCompany.founded_year
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
                    <Building2 size={14} />
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
                        selectedCompany.email ||
                        selectedCompany.user?.email
                      }
                    />

                    <DetailItem
                      icon={Phone}
                      label="Phone"
                      value={
                        selectedCompany.phone
                      }
                    />

                    <DetailItem
                      icon={MapPin}
                      label="Location"
                      value={
                        selectedCompany.location
                      }
                    />

                    <DetailItem
                      icon={CalendarDays}
                      label="Joined"
                      value={formatJoined(
                        selectedCompany
                      )}
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
                    Company Website
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr",
                      gap: 8,
                      marginBottom: 20,
                    }}
                  >
                    <DetailItem
                      icon={Globe}
                      label="Website"
                      value={
                        selectedCompany.website ? (
                          <a
                            href={
                              selectedCompany.website
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: C.dark,
                              textDecoration:
                                "none",
                            }}
                          >
                            Open Website ↗
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
                    <Building2 size={14} />
                    About Company
                  </div>

                  <div
                    style={{
                      padding: "10px 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 9,
                      background: C.bg,
                      marginBottom: 20,
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
                      Description
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: C.text,
                        lineHeight: 1.55,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {selectedCompany.description ||
                        "No description provided."}
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
                      border: `1px solid ${C.border}`,
                      borderRadius: 9,
                      background: C.bg,
                      color: C.textSec,
                      fontSize: 12,
                      lineHeight: 1.55,
                    }}
                  >
                    {selectedCompany.recommendation ||
                      "No recommendation available."}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 7,
                      marginTop: 18,
                    }}
                  >
                    {selectedCompany.approval_status ===
                      "Pending" && (
                      <>
                        <Btn
                          v="secondary"
                          size="sm"
                          onClick={() =>
                            handleApprove(
                              selectedCompany.id
                            )
                          }
                        >
                          {updatingId ===
                          selectedCompany.id
                            ? "..."
                            : "Approve"}
                        </Btn>

                        <Btn
                          v="danger"
                          size="sm"
                          onClick={() =>
                            openRejectModal(
                              selectedCompany.id
                            )
                          }
                        >
                          {updatingId ===
                          selectedCompany.id
                            ? "..."
                            : "Reject"}
                        </Btn>
                      </>
                    )}

                    {selectedCompany.approval_status ===
                      "Approved" && (
                      <Btn
                        v="danger"
                        size="sm"
                        onClick={() =>
                          handleSuspend(
                            selectedCompany.id
                          )
                        }
                      >
                        {updatingId ===
                        selectedCompany.id
                          ? "..."
                          : "Suspend"}
                      </Btn>
                    )}

                    {selectedCompany.approval_status ===
                      "Suspended" && (
                      <Btn
                        v="secondary"
                        size="sm"
                        onClick={() =>
                          handleRestore(
                            selectedCompany.id
                          )
                        }
                      >
                        {updatingId ===
                        selectedCompany.id
                          ? "..."
                          : "Restore"}
                      </Btn>
                    )}

                    {selectedCompany.approval_status ===
                      "Rejected" && (
                      <Btn
                        v="secondary"
                        size="sm"
                        onClick={() =>
                          handleApprove(
                            selectedCompany.id
                          )
                        }
                      >
                        {updatingId ===
                        selectedCompany.id
                          ? "..."
                          : "Approve"}
                      </Btn>
                    )}
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
