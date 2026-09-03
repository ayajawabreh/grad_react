import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { C, F } from "../../constants/tokens";
import { API, resolveMediaUrl } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

import {
  Search,
  Filter,
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
  ChevronDown,
  Download,
} from "lucide-react-native";
import { downloadAdminExcel, excelExportErrorMessage, shareExcelFile } from "../../lib/downloadExcel";

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
  logo_url?: string | null;
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

type StatusData = {
  bg: string;
  color: string;
  icon: React.ComponentType<any>;
};

function companyLogoUrl(company: Company) {
  return resolveMediaUrl(company.logo_url ?? company.logo);
}

function CompanyLogo({ company, details = false }: { company: Company; details?: boolean }) {
  const [failed, setFailed] = useState(false);
  const uri = companyLogoUrl(company);
  const initial = (company.company_name || "C").charAt(0).toUpperCase();

  if (!uri || failed) {
    return (
      <Text style={details ? styles.detailsAvatarText : styles.avatarText}>
        {initial}
      </Text>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={details ? styles.detailsLogo : styles.companyLogo}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
}

const FILTER_OPTIONS = [
  { label: "All Companies", value: "" },
  { label: "Approved", value: "Approved" },
  { label: "Pending", value: "Pending" },
  { label: "Rejected", value: "Rejected" },
  { label: "Suspended", value: "Suspended" },
];

export default function AdminCompanies() {
  /*
   * إذا كانت هذه الصفحة مستخدمة أيضاً لمسار Pending في Expo Router،
   * غيّر هذه القيمة إلى true في صفحة Pending.
   *
   * حالياً false = جميع الشركات.
   */
  const pendingOnly = false;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    pendingOnly ? "Pending" : ""
  );

  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadedFileUri, setDownloadedFileUri] = useState<string | null>(null);

  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [selectedCompany, setSelectedCompany] =
    useState<CompanyDetails | null>(null);

  const [viewLoading, setViewLoading] = useState(false);

  const [rejectCompanyId, setRejectCompanyId] =
    useState<number | null>(null);

  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  /*
   * ---------------------------------------------------------
   * Load Companies
   * ---------------------------------------------------------
   */

  const loadCompanies = useCallback(
    async (showLoading = true) => {
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

        const response = await API.get("/admin/companies", {
          params,
        });

        setCompanies(response.data?.companies ?? []);
      } catch (error) {
        console.error("Failed to load companies:", error);
        setCompanies([]);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [query, statusFilter]
  );
  useSyncRefresh(["admin", "company"], () => loadCompanies(false));

  /*
   * Search / filter debounce
   */

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCompanies();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadCompanies]);

  /*
   * Refresh every 5 seconds
   *
   * Web had:
   * window.setInterval()
   *
   * In React Native:
   * setInterval()
   */

  useEffect(() => {
    const interval = setInterval(() => {
      loadCompanies(false);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [loadCompanies]);

  /*
   * Pending mode
   */

  useEffect(() => {
    setStatusFilter(pendingOnly ? "Pending" : "");
  }, [pendingOnly]);

  /*
   * Pull to refresh
   */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadCompanies(false);
    } finally {
      setRefreshing(false);
    }
  };

  const exportCompanies = async () => {
    try {
      setExporting(true);
      const uri = await downloadAdminExcel("/admin/companies/export", "companies.xlsx", {
        status: statusFilter || undefined,
        search: query.trim() || undefined,
      });
      setDownloadedFileUri(uri);
      Alert.alert("Success", "Excel file downloaded successfully.");
    } catch (requestError: any) {
      Alert.alert("Export failed", excelExportErrorMessage(requestError));
    } finally {
      setExporting(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * View Company
   * ---------------------------------------------------------
   */

  const handleView = async (id: number) => {
    try {
      setViewLoading(true);

      const response = await API.get(`/admin/companies/${id}`);

      setSelectedCompany(response.data?.company ?? null);
    } catch (error) {
      console.error("Failed to load company details:", error);

      Alert.alert(
        "Error",
        "Failed to load company details."
      );
    } finally {
      setViewLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * Update local company state
   * ---------------------------------------------------------
   */

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

  /*
   * ---------------------------------------------------------
   * Approve
   * ---------------------------------------------------------
   */

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

      Alert.alert(
        "Error",
        "Failed to approve company."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /*
   * ---------------------------------------------------------
   * Reject
   * ---------------------------------------------------------
   */

  const openRejectModal = (id: number) => {
    setRejectCompanyId(id);
    setRejectReason("");
    setRejectError("");
  };

  const closeRejectModal = () => {
    if (updatingId !== null) {
      return;
    }

    setRejectCompanyId(null);
    setRejectReason("");
    setRejectError("");
  };

  const handleReject = async () => {
    if (!rejectCompanyId) {
      return;
    }

    if (rejectReason.trim().length < 10) {
      setRejectError(
        "Please provide a clear reason of at least 10 characters."
      );
      return;
    }

    try {
      setUpdatingId(rejectCompanyId);

      const response = await API.patch(
        `/admin/companies/${rejectCompanyId}/reject`,
        {
          rejection_reason: rejectReason.trim(),
        }
      );

      updateCompanyState(
        rejectCompanyId,
        response.data?.company,
        "Rejected",
        false
      );

      setRejectCompanyId(null);
      setRejectReason("");
      setRejectError("");
    } catch (error: any) {
      console.error(
        "Failed to reject company:",
        error
      );

      setRejectError(
        error?.response?.data?.message ||
          "Failed to reject company."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /*
   * ---------------------------------------------------------
   * Suspend
   * ---------------------------------------------------------
   */

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
      console.error(
        "Failed to suspend company:",
        error
      );

      Alert.alert(
        "Error",
        "Failed to suspend company."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /*
   * ---------------------------------------------------------
   * Restore
   * ---------------------------------------------------------
   */

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
      console.error(
        "Failed to restore company:",
        error
      );

      Alert.alert(
        "Error",
        "Failed to restore company."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /*
   * ---------------------------------------------------------
   * Status
   * ---------------------------------------------------------
   */

  const statusColor = (
    status: string
  ): StatusData => {
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

  /*
   * ---------------------------------------------------------
   * Date
   * ---------------------------------------------------------
   */

  const formatJoined = (
    company: Company
  ) => {
    if (company.joined) {
      return company.joined;
    }

    if (company.created_at) {
      return company.created_at.substring(0, 10);
    }

    return "—";
  };

  /*
   * ---------------------------------------------------------
   * Filtered Companies
   * ---------------------------------------------------------
   */

  const filteredCompanies = useMemo(() => {
    const normalizedQuery =
      query.trim().toLowerCase();

    return companies.filter((company) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        company.company_name
          ?.toLowerCase()
          .includes(normalizedQuery) ||
        company.industry
          ?.toLowerCase()
          .includes(normalizedQuery) ||
        company.email
          ?.toLowerCase()
          .includes(normalizedQuery) ||
        company.user?.email
          ?.toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [companies, query]);

  /*
   * ---------------------------------------------------------
   * Company Card
   * ---------------------------------------------------------
   */

  const renderCompany = ({
    item,
  }: {
    item: Company;
    index: number;
  }) => {
    const status =
      item.approval_status || "Pending";

    const statusData = statusColor(status);
    const StatusIcon = statusData.icon;

    const isSuspended =
      status === "Suspended";

    const isApproved =
      status === "Approved";

    const isPending =
      status === "Pending";

    const isUpdating =
      updatingId === item.id;

    return (
      <View style={styles.companyCard}>
        {/* Header */}

        <View style={styles.companyHeader}>
          <View style={styles.companyAvatar}>
            <CompanyLogo company={item} />
          </View>

          <View style={styles.companyMain}>
            <Text
              style={styles.companyName}
              numberOfLines={1}
            >
              {item.company_name ||
                "Unknown Company"}
            </Text>

            <View style={styles.emailRow}>
              <Mail
                size={12}
                color={C.textMuted}
              />

              <Text
                style={styles.companyEmail}
                numberOfLines={1}
              >
                {item.email ||
                  item.user?.email ||
                  "No email"}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusData.bg,
              },
            ]}
          >
            <StatusIcon
              size={12}
              color={statusData.color}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color:
                    statusData.color,
                },
              ]}
            >
              {status}
            </Text>
          </View>
        </View>

        {/* Company Info */}

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>
              INDUSTRY
            </Text>

            <Text
              style={styles.infoValue}
              numberOfLines={1}
            >
              {item.industry || "—"}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>
              JOINED
            </Text>

            <Text
              style={styles.infoValue}
              numberOfLines={1}
            >
              {formatJoined(item)}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>
              JOBS
            </Text>

            <Text style={styles.infoValue}>
              {item.job_posts_count ?? 0}
            </Text>
          </View>
        </View>

        {/* Actions */}

        <View style={styles.actions}>
          <ActionButton
            title="View"
            icon={Eye}
            variant="outline"
            onPress={() =>
              handleView(item.id)
            }
          />

          {isSuspended ? (
            <ActionButton
              title={
                isUpdating
                  ? "..."
                  : "Restore"
              }
              variant="secondary"
              onPress={() =>
                handleRestore(item.id)
              }
              disabled={isUpdating}
            />
          ) : isApproved ? (
            <ActionButton
              title={
                isUpdating
                  ? "..."
                  : "Suspend"
              }
              variant="danger"
              onPress={() =>
                handleSuspend(item.id)
              }
              disabled={isUpdating}
            />
          ) : isPending ? (
            <>
              <ActionButton
                title={
                  isUpdating
                    ? "..."
                    : "Approve"
                }
                icon={CheckCircle2}
                variant="success"
                onPress={() =>
                  handleApprove(item.id)
                }
                disabled={isUpdating}
              />

              <ActionButton
                title={
                  isUpdating
                    ? "..."
                    : "Reject"
                }
                icon={X}
                variant="danger"
                onPress={() =>
                  openRejectModal(item.id)
                }
                disabled={isUpdating}
              />
            </>
          ) : status === "Rejected" ? (
            <ActionButton
              title={
                isUpdating
                  ? "..."
                  : "Approve"
              }
              icon={CheckCircle2}
              variant="success"
              onPress={() =>
                handleApprove(item.id)
              }
              disabled={isUpdating}
            />
          ) : null}
        </View>
      </View>
    );
  };

  /*
   * ---------------------------------------------------------
   * Empty / Loading
   * ---------------------------------------------------------
   */

  const ListHeader = (
    <View>
      {/* Page Header */}

      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderText}>
          <Text style={styles.pageTitle}>
            {pendingOnly
              ? "Pending Companies"
              : "Company Management"}
          </Text>

          <Text style={styles.pageSubtitle}>
            {pendingOnly
              ? "Review company registrations awaiting approval"
              : "Review and manage registered companies"}
          </Text>
        </View>
      </View>

      {/* Search */}

      <View style={styles.searchContainer}>
        <Search
          size={17}
          color={C.textMuted}
        />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search companies..."
          placeholderTextColor={C.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {query.length > 0 && (
          <Pressable
            onPress={() => setQuery("")}
            hitSlop={8}
          >
            <X
              size={16}
              color={C.textMuted}
            />
          </Pressable>
        )}
      </View>

      {/* Filter */}

      <View style={styles.filterRow}>
        <Pressable
          style={styles.filterButton}
          onPress={() =>
            setShowFilter((value) => !value)
          }
        >
          <Filter
            size={15}
            color={C.text}
          />

          <Text style={styles.filterButtonText}>
            {statusFilter ||
              "All Companies"}
          </Text>

          <ChevronDown
            size={15}
            color={C.textMuted}
          />
        </Pressable>

        <Pressable style={[styles.filterButton, exporting && { opacity: 0.6 }]} onPress={exportCompanies} disabled={exporting}>
          {exporting ? <ActivityIndicator size="small" color={C.text} /> : <Download size={15} color={C.text} />}
          <Text style={styles.filterButtonText}>Export Excel</Text>
        </Pressable>
        {downloadedFileUri ? (
          <Pressable style={styles.filterButton} onPress={() => void shareExcelFile(downloadedFileUri).catch((shareError) => Alert.alert("Error", shareError.message))}>
            <Text style={styles.filterButtonText}>Open / Share</Text>
          </Pressable>
        ) : null}

        <Text style={styles.resultsText}>
          {filteredCompanies.length}{" "}
          {filteredCompanies.length === 1
            ? "company"
            : "companies"}
        </Text>
      </View>

      {/* Filter Menu */}

      {showFilter && (
        <View style={styles.filterMenu}>
          {FILTER_OPTIONS.map((option) => (
            <Pressable
              key={option.label}
              style={[
                styles.filterOption,
                statusFilter ===
                  option.value &&
                  styles.filterOptionActive,
              ]}
              onPress={() => {
                setStatusFilter(
                  option.value
                );
                setShowFilter(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  statusFilter ===
                    option.value &&
                    styles.filterOptionTextActive,
                ]}
              >
                {option.label}
              </Text>

              {statusFilter ===
                option.value && (
                <CheckCircle2
                  size={16}
                  color={C.accent}
                />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  /*
   * ---------------------------------------------------------
   * Main Render
   * ---------------------------------------------------------
   */

  return (
    <View style={styles.container}>
      <FlatList
        data={loading ? [] : filteredCompanies}
        keyExtractor={(item) =>
          String(item.id)
        }
        renderItem={renderCompany}
        ListHeaderComponent={
          ListHeader
        }
        contentContainerStyle={
          styles.listContent
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.accent}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator
                size="small"
                color={C.accent}
              />

              <Text
                style={styles.emptyText}
              >
                Loading companies...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Building2
                size={32}
                color={C.textMuted}
              />

              <Text
                style={[
                  styles.emptyText,
                  {
                    fontWeight: "700",
                  },
                ]}
              >
                No companies found.
              </Text>

              <Text
                style={
                  styles.emptySubtext
                }
              >
                Try changing your search
                or filter.
              </Text>
            </View>
          )
        }
      />

      {/* ---------------------------------------------------
          Reject Modal
      --------------------------------------------------- */}

      <Modal
        visible={
          rejectCompanyId !== null
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeRejectModal
        }
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={closeRejectModal}
          />

          <View
            style={styles.rejectModal}
          >
            <View
              style={styles.modalHeader}
            >
              <View
                style={styles.modalIcon}
              >
                <AlertCircle
                  size={22}
                  color={C.error}
                />
              </View>

              <Pressable
                onPress={
                  closeRejectModal
                }
                style={styles.closeButton}
                disabled={
                  updatingId !== null
                }
              >
                <X
                  size={18}
                  color={C.textSec}
                />
              </Pressable>
            </View>

            <Text
              style={styles.modalTitle}
            >
              Reject Company
            </Text>

            <Text
              style={styles.modalDescription}
            >
              Explain why the company was
              rejected. This reason will be
              shown to the company when it
              attempts to sign in.
            </Text>

            <Text
              style={styles.inputLabel}
            >
              Rejection reason
            </Text>

            <TextInput
              value={rejectReason}
              onChangeText={(text) => {
                setRejectReason(text);
                setRejectError("");
              }}
              placeholder="Example: The company information could not be verified. Please provide a valid website and business contact details."
              placeholderTextColor={
                C.textMuted
              }
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={[
                styles.reasonInput,
                rejectError
                  ? {
                      borderColor:
                        C.error,
                    }
                  : null,
              ]}
              autoFocus
            />

            {rejectError ? (
              <View
                style={
                  styles.errorRow
                }
              >
                <AlertCircle
                  size={15}
                  color={C.error}
                />

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {rejectError}
                </Text>
              </View>
            ) : null}

            <View
              style={styles.modalActions}
            >
              <ActionButton
                title="Cancel"
                variant="outline"
                onPress={
                  closeRejectModal
                }
                disabled={
                  updatingId !== null
                }
              />

              <ActionButton
                title={
                  updatingId !== null
                    ? "Rejecting..."
                    : "Reject Company"
                }
                variant="danger"
                onPress={handleReject}
                disabled={
                  updatingId !== null
                }
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ---------------------------------------------------
          Company Details Modal
      --------------------------------------------------- */}

      <Modal
        visible={
          selectedCompany !== null ||
          viewLoading
        }
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!viewLoading) {
            setSelectedCompany(null);
          }
        }}
      >
        <View
          style={styles.detailsOverlay}
        >
          <View
            style={styles.detailsModal}
          >
            {viewLoading ? (
              <View
                style={
                  styles.detailsLoading
                }
              >
                <ActivityIndicator
                  size="small"
                  color={C.accent}
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Loading company
                  details...
                </Text>
              </View>
            ) : selectedCompany ? (
              <>
                {/* Details Header */}

                <View
                  style={
                    styles.detailsHeader
                  }
                >
                  <View
                    style={
                      styles.detailsCompanyAvatar
                    }
                  >
                    <CompanyLogo company={selectedCompany} details />
                  </View>

                  <View
                    style={
                      styles.detailsHeaderInfo
                    }
                  >
                    <Text
                      style={
                        styles.detailsCompanyName
                      }
                      numberOfLines={2}
                    >
                      {selectedCompany.company_name ||
                        "Unknown Company"}
                    </Text>

                    <View
                      style={
                        styles.detailsEmailRow
                      }
                    >
                      <Mail
                        size={12}
                        color={
                          C.textSec
                        }
                      />

                      <Text
                        style={
                          styles.detailsEmail
                        }
                        numberOfLines={1}
                      >
                        {selectedCompany.email ||
                          selectedCompany.user?.email ||
                          "No email provided"}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.badgesRow
                      }
                    >
                      {(() => {
                        const data =
                          statusColor(
                            selectedCompany.approval_status ||
                              "Pending"
                          );

                        const Icon =
                          data.icon;

                        return (
                          <View
                            style={[
                              styles.smallBadge,
                              {
                                backgroundColor:
                                  data.bg,
                              },
                            ]}
                          >
                            <Icon
                              size={10}
                              color={
                                data.color
                              }
                            />

                            <Text
                              style={[
                                styles.smallBadgeText,
                                {
                                  color:
                                    data.color,
                                },
                              ]}
                            >
                              {selectedCompany.approval_status ||
                                "Pending"}
                            </Text>
                          </View>
                        );
                      })()}

                      {selectedCompany.is_verified && (
                        <View
                          style={[
                            styles.smallBadge,
                            {
                              backgroundColor:
                                C.successBg,
                            },
                          ]}
                        >
                          <CheckCircle2
                            size={10}
                            color={
                              C.success
                            }
                          />

                          <Text
                            style={[
                              styles.smallBadgeText,
                              {
                                color:
                                  C.success,
                              },
                            ]}
                          >
                            Verified
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Pressable
                    style={
                      styles.detailsCloseButton
                    }
                    onPress={() =>
                      setSelectedCompany(
                        null
                      )
                    }
                  >
                    <X
                      size={18}
                      color={C.textSec}
                    />
                  </Pressable>
                </View>

                {/* Details Body */}

                <ScrollView
                  style={
                    styles.detailsScroll
                  }
                  contentContainerStyle={
                    styles.detailsContent
                  }
                  showsVerticalScrollIndicator={
                    false
                  }
                >
                  {/* Stats */}

                  <View
                    style={
                      styles.statsRow
                    }
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
                      icon={
                        BriefcaseBusiness
                      }
                      label="Job Posts"
                      value={
                        selectedCompany.job_posts_count ??
                        0
                      }
                    />
                  </View>

                  {/* Company Information */}

                  <SectionTitle
                    icon={Building2}
                    title="Company Information"
                  />

                  <View
                    style={
                      styles.detailGrid
                    }
                  >
                    <DetailItem
                      icon={Building2}
                      label="Company Name"
                      value={
                        selectedCompany.company_name
                      }
                    />

                    <DetailItem
                      icon={
                        BriefcaseBusiness
                      }
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
                  </View>

                  {/* Contact Information */}

                  <SectionTitle
                    icon={Building2}
                    title="Contact Information"
                  />

                  <View
                    style={
                      styles.detailGrid
                    }
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
                  </View>

                  {/* Website */}

                  <SectionTitle
                    icon={Globe}
                    title="Company Website"
                  />

                  <DetailItem
                    icon={Globe}
                    label="Website"
                    value={
                      selectedCompany.website ||
                      null
                    }
                  />

                  {/* About */}

                  <SectionTitle
                    icon={Building2}
                    title="About Company"
                  />

                  <View
                    style={
                      styles.descriptionBox
                    }
                  >
                    <Text
                      style={
                        styles.descriptionLabel
                      }
                    >
                      Description
                    </Text>

                    <Text
                      style={
                        styles.descriptionText
                      }
                    >
                      {selectedCompany.description ||
                        "No description provided."}
                    </Text>
                  </View>

                  {/* Recommendation */}

                  <SectionTitle
                    icon={ShieldCheck}
                    title="Verification Recommendation"
                  />

                  <View
                    style={
                      styles.recommendationBox
                    }
                  >
                    <Text
                      style={
                        styles.recommendationText
                      }
                    >
                      {selectedCompany.recommendation ||
                        "No recommendation available."}
                    </Text>
                  </View>

                  {/* Actions */}

                  <View
                    style={
                      styles.detailsActions
                    }
                  >
                    {selectedCompany.approval_status ===
                      "Pending" && (
                      <>
                        <ActionButton
                          title={
                            updatingId ===
                            selectedCompany.id
                              ? "..."
                              : "Approve"
                          }
                          variant="success"
                          onPress={() =>
                            handleApprove(
                              selectedCompany.id
                            )
                          }
                          disabled={
                            updatingId ===
                            selectedCompany.id
                          }
                        />

                        <ActionButton
                          title={
                            updatingId ===
                            selectedCompany.id
                              ? "..."
                              : "Reject"
                          }
                          variant="danger"
                          onPress={() =>
                            openRejectModal(
                              selectedCompany.id
                            )
                          }
                          disabled={
                            updatingId ===
                            selectedCompany.id
                          }
                        />
                      </>
                    )}

                    {selectedCompany.approval_status ===
                      "Approved" && (
                      <ActionButton
                        title={
                          updatingId ===
                          selectedCompany.id
                            ? "..."
                            : "Suspend"
                        }
                        variant="danger"
                        onPress={() =>
                          handleSuspend(
                            selectedCompany.id
                          )
                        }
                        disabled={
                          updatingId ===
                          selectedCompany.id
                        }
                      />
                    )}

                    {selectedCompany.approval_status ===
                      "Suspended" && (
                      <ActionButton
                        title={
                          updatingId ===
                          selectedCompany.id
                            ? "..."
                            : "Restore"
                        }
                        variant="secondary"
                        onPress={() =>
                          handleRestore(
                            selectedCompany.id
                          )
                        }
                        disabled={
                          updatingId ===
                          selectedCompany.id
                        }
                      />
                    )}

                    {selectedCompany.approval_status ===
                      "Rejected" && (
                      <ActionButton
                        title={
                          updatingId ===
                          selectedCompany.id
                            ? "..."
                            : "Approve"
                        }
                        variant="success"
                        onPress={() =>
                          handleApprove(
                            selectedCompany.id
                          )
                        }
                        disabled={
                          updatingId ===
                          selectedCompany.id
                        }
                      />
                    )}
                  </View>

                  <View
                    style={{
                      height: 30,
                    }}
                  />
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/*
 * =========================================================
 * Action Button
 * =========================================================
 */

type ActionButtonProps = {
  title: string;
  icon?: React.ComponentType<any>;
  variant:
    | "outline"
    | "secondary"
    | "success"
    | "danger";
  onPress: () => void;
  disabled?: boolean;
};

function ActionButton({
  title,
  icon: Icon,
  variant,
  onPress,
  disabled = false,
}: ActionButtonProps) {
  const getStyles = () => {
    switch (variant) {
      case "success":
        return {
          backgroundColor: C.successBg,
          borderColor: C.success,
          textColor: C.success,
        };

      case "danger":
        return {
          backgroundColor: C.errorBg,
          borderColor: C.error,
          textColor: C.error,
        };

      case "secondary":
        return {
          backgroundColor: C.accentLight,
          borderColor: C.accent,
          textColor: C.accent,
        };

      default:
        return {
          backgroundColor: C.surface,
          borderColor: C.border,
          textColor: C.text,
        };
    }
  };

  const colors = getStyles();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor:
            colors.backgroundColor,
          borderColor: colors.borderColor,
          opacity: disabled
            ? 0.55
            : pressed
            ? 0.75
            : 1,
        },
      ]}
    >
      {Icon && (
        <Icon
          size={14}
          color={colors.textColor}
        />
      )}

      <Text
        style={[
          styles.actionButtonText,
          {
            color: colors.textColor,
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/*
 * =========================================================
 * Section Title
 * =========================================================
 */

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<any>;
  title: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Icon
        size={15}
        color={C.text}
      />

      <Text
        style={styles.sectionTitleText}
      >
        {title}
      </Text>
    </View>
  );
}

/*
 * =========================================================
 * Detail Item
 * =========================================================
 */

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: React.ReactNode;
}) {
  const hasValue =
    value !== null &&
    value !== undefined &&
    value !== "";

  return (
    <View style={styles.detailItem}>
      <View style={styles.detailItemHeader}>
        <Icon
          size={12}
          color={C.textMuted}
        />

        <Text
          style={styles.detailItemLabel}
        >
          {label}
        </Text>
      </View>

      {hasValue ? (
        <Text
          style={styles.detailItemValue}
        >
          {String(value)}
        </Text>
      ) : (
        <Text
          style={[
            styles.detailItemValue,
            {
              color: C.textMuted,
            },
          ]}
        >
          —
        </Text>
      )}
    </View>
  );
}

/*
 * =========================================================
 * Styles
 * =========================================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  listContent: {
    paddingHorizontal: 17,
    paddingTop: 22,
    paddingBottom: 30,
  },

  pageHeader: {
    marginBottom: 18,
  },

  pageHeaderText: {
    flex: 1,
  },

  pageTitle: {
    fontFamily: F,
    fontSize: 25,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.4,
  },

  pageSubtitle: {
    fontFamily: F,
    fontSize: 13,
    color: C.textSec,
    marginTop: 5,
    lineHeight: 19,
  },

  searchContainer: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    paddingVertical: 0,
    fontFamily: F,
    fontSize: 13,
    color: C.text,
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },

  filterButtonText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
    color: C.text,
  },

  resultsText: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
  },

  filterMenu: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 5,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 5,
  },

  filterOption: {
    minHeight: 42,
    paddingHorizontal: 11,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  filterOptionActive: {
    backgroundColor: C.bg,
  },

  filterOptionText: {
    fontFamily: F,
    fontSize: 13,
    color: C.text,
  },

  filterOptionTextActive: {
    fontWeight: "700",
    color: C.accent,
  },

  companyCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  companyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  companyAvatar: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: C.accentLight,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 11,
  },

  companyLogo: {
    width: "82%",
    height: "82%",
  },

  avatarText: {
    fontFamily: F,
    fontSize: 18,
    fontWeight: "800",
    color: C.accent,
  },

  companyMain: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },

  companyName: {
    fontFamily: F,
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },

  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 5,
  },

  companyEmail: {
    flex: 1,
    fontFamily: F,
    fontSize: 11,
    color: C.textSec,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 99,
  },

  statusText: {
    fontFamily: F,
    fontSize: 10,
    fontWeight: "700",
  },

  infoGrid: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 13,
  },

  infoBox: {
    flex: 1,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 8,
    minWidth: 0,
  },

  infoLabel: {
    fontFamily: F,
    fontSize: 8,
    fontWeight: "700",
    color: C.textMuted,
    marginBottom: 4,
  },

  infoValue: {
    fontFamily: F,
    fontSize: 11,
    fontWeight: "600",
    color: C.text,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },

  actionButton: {
    minHeight: 38,
    flexGrow: 1,
    paddingHorizontal: 10,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  actionButtonText: {
    fontFamily: F,
    fontSize: 11,
    fontWeight: "700",
  },

  emptyState: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  emptyText: {
    fontFamily: F,
    color: C.textSec,
    fontSize: 13,
    marginTop: 10,
  },

  emptySubtext: {
    fontFamily: F,
    color: C.textMuted,
    fontSize: 11,
    marginTop: 5,
    textAlign: "center",
  },

  /*
   * Reject Modal
   */

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,.48)",
  },

  rejectModal: {
    backgroundColor: C.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 10,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.errorBg,
    alignItems: "center",
    justifyContent: "center",
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    fontFamily: F,
    fontSize: 19,
    fontWeight: "800",
    color: C.text,
    marginTop: 15,
  },

  modalDescription: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    lineHeight: 18,
    marginTop: 7,
    marginBottom: 17,
  },

  inputLabel: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
    marginBottom: 7,
  },

  reasonInput: {
    minHeight: 120,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    fontFamily: F,
    fontSize: 13,
    color: C.text,
    backgroundColor: C.bg,
  },

  errorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 9,
  },

  errorText: {
    flex: 1,
    fontFamily: F,
    fontSize: 11,
    color: C.error,
    lineHeight: 16,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 18,
  },

  /*
   * Details Modal
   */

  detailsOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(15,23,42,.58)",
    justifyContent: "flex-end",
  },

  detailsModal: {
    height: "94%",
    backgroundColor: C.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },

  detailsLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    marginTop: 10,
  },

  detailsHeader: {
    paddingHorizontal: 17,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: "row",
    alignItems: "center",
  },

  detailsCompanyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: C.accentLight,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 11,
  },

  detailsLogo: {
    width: "84%",
    height: "84%",
  },

  detailsAvatarText: {
    fontFamily: F,
    fontSize: 20,
    fontWeight: "800",
    color: C.accent,
  },

  detailsHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },

  detailsCompanyName: {
    fontFamily: F,
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
  },

  detailsEmailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },

  detailsEmail: {
    flex: 1,
    fontFamily: F,
    fontSize: 11,
    color: C.textSec,
  },

  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 7,
  },

  smallBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
  },

  smallBadgeText: {
    fontFamily: F,
    fontSize: 9,
    fontWeight: "700",
  },

  detailsCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
  },

  detailsScroll: {
    flex: 1,
  },

  detailsContent: {
    paddingHorizontal: 17,
    paddingTop: 17,
    paddingBottom: 30,
  },

  statsRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 21,
  },

  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },

  detailItem: {
    flex: 1,
    minWidth: "47%",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.surface,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },

  detailItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },

  detailItemLabel: {
    fontFamily: F,
    fontSize: 9,
    fontWeight: "600",
    color: C.textMuted,
  },

  detailItemValue: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "600",
    color: C.text,
    lineHeight: 17,
  },

  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 9,
  },

  sectionTitleText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
  },

  descriptionBox: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.bg,
    marginBottom: 20,
  },

  descriptionLabel: {
    fontFamily: F,
    fontSize: 9,
    color: C.textMuted,
    marginBottom: 5,
    fontWeight: "600",
  },

  descriptionText: {
    fontFamily: F,
    fontSize: 12,
    color: C.text,
    lineHeight: 19,
  },

  recommendationBox: {
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.bg,
    marginBottom: 18,
  },

  recommendationText: {
    fontFamily: F,
    fontSize: 12,
    color: C.textSec,
    lineHeight: 19,
  },

  detailsActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
});
