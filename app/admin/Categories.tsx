import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AlertTriangle,
  Briefcase,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react-native";

import { C, F } from "../../constants/tokens";
import { useSyncRefresh } from "../../context/SyncContext";
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from "../../imports/api";

type Category = {
  id: number;
  name: string;
  jobs_count?: number;
  job_count?: number;
  jobs?: number | unknown[];
};

const jobsCount = (category: Category) =>
  category.jobs_count ??
  category.job_count ??
  (typeof category.jobs === "number"
    ? category.jobs
    : Array.isArray(category.jobs)
      ? category.jobs.length
      : 0);

export default function AdminCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState("");

  const [form, setForm] = useState<
    Category | "new" | null
  >(null);

  const [deleting, setDeleting] =
    useState<Category | null>(null);

  const [name, setName] = useState("");

  const [busy, setBusy] = useState(false);

  const [categoryError, setCategoryError] = useState("");

  const loadCategories = async (
    showLoading = true
  ) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
        const response = await getAdminCategories();

        const data =
          response?.data ?? response;

        const categories = Array.isArray(data)
          ? data
          : data?.categories ??
            data?.data ??
            [];

        setItems(categories);
        setCategoryError("");
    } catch (error: any) {
      console.error("Could not load categories:", error);
      setCategoryError("Could not load job categories.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useSyncRefresh(["admin", "jobs"], () => loadCategories(false));

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", next => {
      if (next === "active") loadCategories(false);
    });
    return () => subscription.remove();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories(false);
  };

  const filtered = useMemo(() => {
    const cleanQuery =
      query.toLowerCase().trim();

    return items.filter((item) =>
      item.name
        .toLowerCase()
        .includes(cleanQuery)
    );
  }, [items, query]);

  const openForm = (
    category?: Category
  ) => {
    setForm(category ?? "new");
    setName(category?.name ?? "");
  };

  const closeForm = () => {
    if (busy) return;

    setForm(null);
    setName("");
  };

  const save = async () => {
    const clean = name.trim();

    if (!clean) {
      Alert.alert(
        "Invalid Category",
        "Category name is required."
      );

      return;
    }

    const duplicate = items.some(
      (item) =>
        item.id !==
          (form === "new"
            ? undefined
            : form?.id) &&
          item.name.trim().toLowerCase() ===
          clean.toLowerCase()
    );

    if (duplicate) {
      Alert.alert(
        "Duplicate Category",
        "This category already exists."
      );

      return;
    }

    try {
      setBusy(true);

      /*
       * Update
       */

      if (
        form !== "new" &&
        form
      ) {
        await updateAdminCategory(
          form.id,
          {
            name: clean,
          }
        );

        setItems((current) =>
          current.map((item) =>
            item.id === form.id
              ? {
                  ...item,
                  name: clean,
                }
              : item
          )
        );

        Alert.alert(
          "Success",
          "Category updated successfully."
        );
      }

      /*
       * Create
       */

      else {
        const response =
          await createAdminCategory({
            name: clean,
          });

        const data =
          response?.data ??
          response;

        const created =
          data?.category ??
          data;

        setItems((current) => [
          ...current,

          created?.id
            ? created
            : {
                id:
                  Math.max(
                    0,
                    ...current.map(
                      (item) =>
                        item.id
                    )
                  ) + 1,

                name: clean,

                jobs_count: 0,
              },
        ]);

        Alert.alert(
          "Success",
          "Category added successfully."
        );
      }

      setForm(null);
      setName("");
    } catch (error: any) {
      console.error(
        "Could not save category:",
        error
      );

      const message =
        error?.response?.data
          ?.message ??
        "Could not save category.";

      Alert.alert(
        "Error",
        message
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) {
      return;
    }

    const count =
      jobsCount(deleting);

    /*
     * Do not allow deletion
     * when category is still used.
     */

    if (count > 0) {
      Alert.alert(
        "Category Cannot Be Deleted",
        `Move its ${count} jobs to another category first.`
      );

      setDeleting(null);

      return;
    }

    try {
      setBusy(true);

      await deleteAdminCategory(
        deleting.id
      );

      setItems((current) =>
        current.filter(
          (item) =>
            item.id !==
            deleting.id
        )
      );

      Alert.alert(
        "Success",
        "Category deleted successfully."
      );

      setDeleting(null);
    } catch (error: any) {
      console.error(
        "Could not delete category:",
        error
      );

      const message =
        error?.response?.data
          ?.message ??
        "The category could not be deleted. It may still be linked to jobs.";

      Alert.alert(
        "Could Not Delete Category",
        message
      );
    } finally {
      setBusy(false);
    }
  };

  const totalJobs = items.reduce(
    (sum, item) =>
      sum + jobsCount(item),
    0
  );

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.contentContainer
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {categoryError && !loading && (
          <View style={styles.warningBanner}>
            <View
              style={
                styles.warningContent
              }
            >
              <Text
                style={
                  styles.warningTitle
                }
              >
                Could not load job categories.
              </Text>

              <Text
                style={
                  styles.warningText
                }
              >
                Categories are loaded only from the categories service.
              </Text>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => loadCategories()}
                style={styles.retryButton}
              >
                <RefreshCw size={13} color={C.warning} />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Header */}

        <View style={styles.header}>
          <View
            style={styles.headerText}
          >
            <Text
              style={styles.title}
            >
              Job Categories
            </Text>

            <Text
              style={styles.subtitle}
            >
              Organize jobs using a consistent
              platform-wide category catalog.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              openForm()
            }
            style={[
              styles.addButton,
            ]}
          >
            <Plus
              size={17}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.addButtonText
              }
            >
              Add
            </Text>
          </TouchableOpacity>
        </View>

        {/* Statistics */}

        <View style={styles.statsRow}>
          <StatCard
            label="Total Categories"
            value={items.length}
            icon={Layers}
            color={C.purple}
            background={C.purpleBg}
            loading={loading}
          />

          <StatCard
            label="Categorized Jobs"
            value={totalJobs}
            icon={Briefcase}
            color={C.info}
            background={C.infoBg}
            loading={loading}
          />
        </View>

        {/* Category Catalog */}

        <View
          style={styles.catalogCard}
        >
          {/* Catalog Header */}

          <View
            style={styles.catalogHeader}
          >
            <View
              style={
                styles.catalogTitleContainer
              }
            >
              <Text
                style={
                  styles.catalogTitle
                }
              >
                Category catalog
              </Text>

              <Text
                style={
                  styles.catalogCount
                }
              >
                {filtered.length}{" "}
                categories
              </Text>
            </View>

            {/* Search */}

            <View
              style={styles.searchContainer}
            >
              <Search
                size={16}
                color={C.textMuted}
              />

              <TextInput
                value={query}
                onChangeText={
                  setQuery
                }
                placeholder="Search categories..."
                placeholderTextColor={
                  C.textMuted
                }
                style={
                  styles.searchInput
                }
                autoCapitalize="none"
              />

              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() =>
                    setQuery("")
                  }
                >
                  <X
                    size={15}
                    color={
                      C.textMuted
                    }
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Loading */}

          {loading ? (
            <View
              style={
                styles.loadingContainer
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
                Loading categories...
              </Text>
            </View>
          ) : filtered.length ===
            0 ? (
            <View
              style={
                styles.emptyContainer
              }
            >
              <Layers
                size={32}
                color={C.textMuted}
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No categories found
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Try changing your search or
                add a new category.
              </Text>
            </View>
          ) : (
            <View>
              {filtered.map(
                (
                  item,
                  index
                ) => (
                  <CategoryRow
                    key={item.id}
                    item={item}
                    index={index}
                    total={
                      filtered.length
                    }
                    onEdit={() =>
                      openForm(item)
                    }
                    onDelete={() =>
                      setDeleting(
                        item
                      )
                    }
                  />
                )
              )}
            </View>
          )}
        </View>

        <View
          style={{
            height: 30,
          }}
        />
      </ScrollView>

      {/* Add / Edit Modal */}

      {form && (
        <CategoryFormModal
          form={form}
          name={name}
          setName={setName}
          busy={busy}
          onClose={
            closeForm
          }
          onSave={save}
        />
      )}

      {/* Delete Modal */}

      {deleting && (
        <DeleteCategoryModal
          category={deleting}
          busy={busy}
          onClose={() => {
            if (!busy) {
              setDeleting(null);
            }
          }}
          onDelete={remove}
        />
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Statistics Card                                                            */
/* -------------------------------------------------------------------------- */

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
  }>;
  color: string;
  background: string;
  loading: boolean;
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  background,
  loading,
}: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor:
              background,
          },
        ]}
      >
        <Icon
          size={19}
          color={color}
        />
      </View>

      <View
        style={
          styles.statInfo
        }
      >
        <Text
          style={
            styles.statValue
          }
        >
          {loading
            ? "—"
            : value.toLocaleString()}
        </Text>

        <Text
          style={
            styles.statLabel
          }
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Category Row                                                               */
/* -------------------------------------------------------------------------- */

type CategoryRowProps = {
  item: Category;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
};

function CategoryRow({
  item,
  index,
  total,
  onEdit,
  onDelete,
}: CategoryRowProps) {
  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryInfo}>
        <View style={styles.categoryIcon}>
          <Layers size={17} color={C.purple} />
        </View>
        <View style={styles.categoryTitleGroup}>
          <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.categoryId}>Category #{item.id}</Text>
        </View>
      </View>

      <View style={styles.categoryFooter}>
        <View style={styles.jobsContainer}>
          <Briefcase size={14} color={C.textMuted} />
          <Text style={styles.jobsText}>{jobsCount(item)} {jobsCount(item) === 1 ? "job" : "jobs"}</Text>
        </View>
        <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onEdit}
          style={styles.editButton}
        >
          <Pencil
            size={14}
            color={
              C.info
            }
          />

          <Text
            style={styles.editText}
          >
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onDelete}
          style={styles.deleteButton}
        >
          <Trash2
            size={15}
            color={
              C.error
            }
          />
        </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Add / Edit Modal                                                           */
/* -------------------------------------------------------------------------- */

type CategoryFormModalProps = {
  form: Category | "new";
  name: string;
  setName: (
    value: string
  ) => void;
  busy: boolean;
  onClose: () => void;
  onSave: () => void;
};

function CategoryFormModal({
  form,
  name,
  setName,
  busy,
  onClose,
  onSave,
}: CategoryFormModalProps) {
  const isNew =
    form === "new";

  return (
    <Modal
      transparent
      animationType="slide"
      visible
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
        enabled={false}
      >
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalScrollContent}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={false}
          bounces={false}
        >
        <View style={styles.modalCard}>
        {/* Modal Header */}

        <View
          style={
            styles.modalHeader
          }
        >
          <View
            style={
              styles.modalHeaderText
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              {isNew
                ? "Add Category"
                : "Edit Category"}
            </Text>

            <Text
              style={
                styles.modalSubtitle
              }
            >
              Use a clear name that companies
              can understand.
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            disabled={busy}
            style={
              styles.closeButton
            }
          >
            <X
              size={19}
              color={C.textSec}
            />
          </TouchableOpacity>
        </View>

        {/* Input */}

        <Text
          style={
            styles.inputLabel
          }
        >
          Category name
        </Text>

        <TextInput
          value={name}
          onChangeText={
            setName
          }
          onSubmitEditing={
            onSave
          }
          returnKeyType="done"
          placeholder="e.g. Cyber Security"
          placeholderTextColor={
            C.textMuted
          }
          editable={!busy}
          style={
            styles.input
          }
        />

        {/* Buttons */}

        <View
          style={
            styles.modalActions
          }
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            disabled={busy}
            style={
              styles.cancelButton
            }
          >
            <Text
              style={
                styles.cancelText
              }
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onSave}
            disabled={busy}
            style={[
              styles.saveButton,
              busy &&
                styles.buttonDisabled,
            ]}
          >
            {busy ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={
                  styles.saveText
                }
              >
                Save Category
              </Text>
            )}
          </TouchableOpacity>
        </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Delete Modal                                                               */
/* -------------------------------------------------------------------------- */

type DeleteCategoryModalProps = {
  category: Category;
  busy: boolean;
  onClose: () => void;
  onDelete: () => void;
};

function DeleteCategoryModal({
  category,
  busy,
  onClose,
  onDelete,
}: DeleteCategoryModalProps) {
  const count =
    jobsCount(category);

  const inUse =
    count > 0;

  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, styles.centeredOverlay]}>
      <View style={styles.modalCard}>
        {/* Icon */}

        <View
          style={[
            styles.alertIcon,
            {
              backgroundColor:
                inUse
                  ? C.warningBg
                  : C.errorBg,
            },
          ]}
        >
          <AlertTriangle
            size={24}
            color={
              inUse
                ? C.warning
                : C.error
            }
          />
        </View>

        {/* Title */}

        <Text
          style={
            styles.deleteTitle
          }
        >
          Delete &quot;{category.name}&quot;?
        </Text>

        {/* Description */}

        <Text
          style={
            styles.deleteDescription
          }
        >
          {inUse
            ? `This category contains ${count} jobs and cannot be safely deleted. Move those jobs first.`
            : "This category has no linked jobs. This action cannot be undone."}
        </Text>

        {/* Actions */}

        <View
          style={
            styles.modalActions
          }
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            disabled={busy}
            style={
              styles.cancelButton
            }
          >
            <Text
              style={
                styles.cancelText
              }
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onDelete}
            disabled={
              busy || inUse
            }
            style={[
              styles.deleteConfirmButton,
              (busy ||
                inUse) &&
                styles.buttonDisabled,
            ]}
          >
            {busy ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={
                  styles.deleteConfirmText
                }
              >
                {inUse
                  ? "Category in use"
                  : "Delete Category"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  contentContainer: {
    paddingHorizontal: 17,
    paddingTop: 12,
    paddingBottom: 25,
  },

  /* Warning */

  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: C.warningBg,
    borderRadius: 14,
    padding: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F3DFC0",
  },

  warningContent: {
    flex: 1,
    marginLeft: 9,
  },

  warningTitle: {
    color: C.warning,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 3,
  },

  warningText: {
    color: C.warning,
    fontSize: 11,
    lineHeight: 17,
  },

  retryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
    paddingHorizontal: 9,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,.55)",
  },

  retryText: {
    color: C.warning,
    fontSize: 10,
    fontWeight: "800",
  },

  /* Header */

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    color: C.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  subtitle: {
    color: C.textSec,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: C.accent,
    borderRadius: 11,
    paddingHorizontal: 14,
    height: 40,
    shadowColor: C.accent,
    shadowOpacity: 0.18,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.5,
  },

  /* Statistics */

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 9,
    marginBottom: 14,
  },

  statCard: {
    width: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  statInfo: {
    flex: 1,
    marginLeft: 11,
  },

  statValue: {
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
  },

  statLabel: {
    color: C.textSec,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },

  /* Catalog */

  catalogCard: {
    backgroundColor: "transparent",
  },

  catalogHeader: {
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    backgroundColor: C.surface,
    marginBottom: 12,
  },

  catalogTitleContainer: {
    marginBottom: 12,
  },

  catalogTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "800",
  },

  catalogCount: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 3,
  },

  /* Search */

  searchContainer: {
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAF9",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 11,
  },

  searchInput: {
    flex: 1,
    color: C.text,
    fontFamily: F,
    fontSize: 12,
    marginLeft: 8,
    paddingVertical: 0,
  },

  /* Loading */

  loadingContainer: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: C.textSec,
    fontSize: 12,
    marginTop: 9,
  },

  /* Empty */

  emptyContainer: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },

  emptyText: {
    color: C.textSec,
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 18,
  },

  /* Category Row */

  categoryRow: {
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    backgroundColor: C.surface,
    marginBottom: 9,
    shadowColor: "#0F172A",
    shadowOpacity: 0.025,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.purpleBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  categoryTitleGroup: {
    flex: 1,
  },

  categoryName: {
    color: C.text,
    fontSize: 15,
    fontWeight: "800",
  },

  categoryId: {
    color: C.textMuted,
    fontSize: 10,
    marginTop: 4,
  },

  categoryFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.divider,
    marginTop: 12,
    paddingTop: 11,
  },

  jobsContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 30,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: C.bg,
  },

  jobsText: {
    color: C.textSec,
    fontSize: 12,
    marginLeft: 5,
  },

  /* Actions */

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 9,
    paddingHorizontal: 10,
    height: 32,
  },

  editText: {
    color: C.info,
    fontSize: 11,
    fontWeight: "700",
  },

  deleteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: "#F5D2CF",
    borderRadius: 9,
  },

  actionDisabled: {
    opacity: 0.45,
  },

  disabledText: {
    color: C.textMuted,
  },

  /* Modal */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.52)",
  },

  centeredOverlay: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  modalScroll: {
    flex: 1,
  },

  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 185 : 148,
    paddingBottom: 24,
  },

  modalCard: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: C.surface,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 26 : 20,
    alignSelf: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.18,
    shadowRadius: 25,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  modalHeaderText: {
    flex: 1,
    paddingRight: 10,
  },

  modalTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: C.textSec,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Input */

  inputLabel: {
    color: C.text,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },

  input: {
    width: "100%",
    height: 46,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.bg,
    color: C.text,
    fontFamily: F,
    fontSize: 13,
    paddingHorizontal: 12,
  },

  /* Modal Actions */

  modalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },

  cancelButton: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
  },

  cancelText: {
    color: C.textSec,
    fontSize: 12,
    fontWeight: "700",
  },

  saveButton: {
    flex: 1.4,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.accent,
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  /* Delete Modal */

  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  deleteTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
  },

  deleteDescription: {
    color: C.textSec,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },

  deleteConfirmButton: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.error,
  },

  deleteConfirmText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
