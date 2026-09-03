import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import {
  Upload,
  FileText,
  Briefcase,
  Sparkles,
  PenLine,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Eye,
} from "lucide-react-native";

import { useRouter } from "expo-router";
import { API } from "../../imports/api";
import { openUploadedResumeFile } from "../../imports/resumePdf";

interface ExistingResume {
  id: number;
  file_path: string | null;
  file_url: string | null;
  file_name: string | null;
  full_name?: string;
  professional_title?: string;
  summary?: string;
  education?: any[];
  skills?: any[];
  experience?: any[];
  projects?: any[];
  certificates?: any[];
  languages?: any[];
  activities?: any[];
  achievements?: any[];
}

const COLORS = {
  accent: "#C8A46A",
  text: "#181B1F",
  textSec: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  surface: "#FFFFFF",
  bg: "#F8FAFC",
  success: "#16A34A",
  successBg: "#DCFCE7",
  danger: "#DC2626",
  dangerBg: "#FEE2E2",
};

export default function ResumeUpload() {
  const router = useRouter();

  const [file, setFile] = useState<{
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  } | null>(null);

  const [existingResume, setExistingResume] =
    useState<ExistingResume | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingResume, setLoadingResume] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");
  const [canRetry, setCanRetry] = useState(false);

  const loadResume = useCallback(async () => {
    try {
      setLoadingResume(true);
      setError("");

      const response = await API.get("/student/resume", {
        params: { _: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });

      if (response.data?.file_path || response.data?.file_url) {
        setExistingResume(response.data);
      } else {
        setExistingResume(null);
      }
    } catch (err: any) {
      setExistingResume(null);
      setError(err?.response?.data?.message ?? "Failed to load resume.");
    } finally {
      setLoadingResume(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadResume();
  }, [loadResume]));

  const pickFile = async () => {
    try {
      setError("");

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const selected = result.assets?.[0];

      if (!selected) {
        return;
      }

      const maxSize = 5 * 1024 * 1024;

      if (selected.size && selected.size > maxSize) {
        setError("File size must be less than 5MB.");
        return;
      }

      const lowerName = selected.name.toLowerCase();

      if (
        !lowerName.endsWith(".pdf") &&
        !lowerName.endsWith(".docx")
      ) {
        setError("Please select a PDF or DOCX file.");
        return;
      }

      setFile({
        uri: selected.uri,
        name: selected.name,
        size: selected.size,
        mimeType: selected.mimeType,
      });
    } catch (err) {
      console.error("File picker error:", err);
      setError("Could not select the CV.");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF or DOCX file.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setCanRetry(false);

      console.log("Uploading CV asset:", {
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
      });

      const formData = new FormData();

      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type:
          file.mimeType ||
          (file.name.toLowerCase().endsWith(".pdf")
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
      } as any);

      const token =
        (await AsyncStorage.getItem("cb_token")) ||
        (await AsyncStorage.getItem("token"));

      if (!token) {
        throw new Error("Please sign in again before uploading your CV.");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      let uploadResponse: Response;

      try {
        uploadResponse = await fetch(
          `${API.defaults.baseURL}/student/resume/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            body: formData,
            signal: controller.signal,
          }
        );
      } finally {
        clearTimeout(timeout);
      }

      const responseData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        console.log("Upload status:", uploadResponse.status);
        console.log("Upload response:", responseData);

        const firstError = responseData?.errors
          ? Object.values(responseData.errors).flat()[0]
          : responseData?.message;
        const uploadError: any = new Error(
          String(firstError || "Failed to upload CV.")
        );
        uploadError.status = uploadResponse.status;
        uploadError.data = responseData;
        throw uploadError;
      }

      if (responseData?.resume) {
        const resume = responseData.resume;
        setExistingResume({
          ...resume,
          full_name: resume.full_name ?? "",
          professional_title: resume.professional_title ?? "",
          summary: resume.summary ?? "",
          education: resume.education ?? [],
          skills: Array.isArray(resume.skills) ? resume.skills : [],
          experience: resume.experience ?? [],
          projects: resume.projects ?? [],
          certificates: resume.certificates ?? [],
          languages: resume.languages ?? [],
          activities: Array.isArray(resume.activities) ? resume.activities : [],
          achievements: Array.isArray(resume.achievements) ? resume.achievements : [],
          file_path: resume.file_path ?? responseData.file_path ?? null,
          file_url: resume.file_url ?? responseData.file_url ?? null,
          file_name:
            resume.file_name || responseData.file_name || file.name,
        });
      }

      await loadResume();
      setFile(null);
      setUploaded(true);
    } catch (err: any) {
      console.error("Upload CV error:", err);

      const status = err?.status ?? err?.response?.status;
      const data = err?.data ?? err?.response?.data;
      const fileError = Array.isArray(data?.errors?.file)
        ? data.errors.file[0]
        : undefined;

      if (status === 503) {
        setCanRetry(true);
        setError("Resume analysis is temporarily unavailable. Please try again.");
      } else {
        setCanRetry(false);
        setError(fileError || data?.message || err?.message || "Could not upload the CV.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingResume?.id) {
      return;
    }

    Alert.alert(
      "Delete CV",
      "Are you sure you want to delete your CV? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!existingResume?.id) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await API.delete(
        `/student/resume/${existingResume.id}`
      );

      setExistingResume(null);
      setFile(null);
      setUploaded(false);

      Alert.alert(
        "Deleted",
        "Your CV has been deleted successfully."
      );
    } catch (err: any) {
      console.error("Delete CV error:", err);

      setError(
        err?.response?.data?.message ||
          "Could not delete the CV."
      );
    } finally {
      setDeleting(false);
    }
  };

  const openFile = async () => {
    const path = existingResume?.file_path;

    if (!path) {
      Alert.alert(
        "CV",
        "No preview URL is available for this CV."
      );
      return;
    }

    try {
      await openUploadedResumeFile(path, existingResume?.file_name || "resume.pdf");
    } catch (error: any) {
      console.warn("Open CV error:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message ??
          error?.message ??
          "Could not open the uploaded CV."
      );
    }
  };

  /*
   * =========================
   * Upload Success Screen
   * =========================
   */

  if (uploaded) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.successContainer}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/(student)/MyResume")}
        >
          <ArrowLeft
            size={18}
            color={COLORS.textSec}
          />

          <Text style={styles.backText}>
            Back to My Resume
          </Text>
        </Pressable>

        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <CheckCircle2
              size={38}
              color={COLORS.success}
            />
          </View>

          <Text style={styles.successTitle}>
            CV Uploaded Successfully
          </Text>

          <Text style={styles.successDescription}>
            Your CV has been uploaded and your
            information has been extracted successfully.
            You can now explore available jobs or view
            jobs matched to your skills.
          </Text>

          <View style={styles.successActions}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                router.push("/(student)/JobDiscovery")
              }
            >
              <Briefcase
                size={17}
                color={COLORS.text}
              />

              <Text style={styles.secondaryButtonText}>
                Browse Jobs
              </Text>
            </Pressable>

            <Pressable
              style={styles.primaryButton}
              onPress={() =>
                router.push("/(student)/Recommended")
              }
            >
              <Sparkles
                size={17}
                color="#FFFFFF"
              />

              <Text style={styles.primaryButtonText}>
                Suggested Jobs
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.editButton}
            onPress={() =>
              router.push("/(student)/Resume")
            }
          >
            <PenLine
              size={16}
              color={COLORS.textSec}
            />

            <Text style={styles.editButtonText}>
              Edit Resume
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  /*
   * =========================
   * Upload Screen
   * =========================
   */

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        style={styles.backButton}
        onPress={() => router.replace("/(student)/MyResume")}
      >
        <ArrowLeft
          size={18}
          color={COLORS.textSec}
        />

        <Text style={styles.backText}>
          Back
        </Text>
      </Pressable>

      <Text style={styles.title}>
        Upload Your CV
      </Text>

      <Text style={styles.subtitle}>
        Upload your existing CV and CareerBridge will
        extract your information automatically.
      </Text>

      {/* Upload Area */}

      <Pressable
        style={styles.uploadArea}
        onPress={pickFile}
      >
        <View style={styles.uploadIcon}>
          <Upload
            size={38}
            color={COLORS.accent}
          />
        </View>

        <Text style={styles.uploadTitle}>
          Choose your CV
        </Text>

        <Text style={styles.uploadDescription}>
          PDF or DOCX • Maximum 5MB
        </Text>

        <View style={styles.chooseButton}>
          <Text style={styles.chooseButtonText}>
            Choose File
          </Text>
        </View>
      </Pressable>

      {/* Loading Existing Resume */}

      {loadingResume && (
        <View style={styles.infoCard}>
          <ActivityIndicator
            size="small"
            color={COLORS.accent}
          />

          <Text style={styles.infoText}>
            Loading uploaded CV...
          </Text>
        </View>
      )}

      {/* Existing Resume */}

      {existingResume && !loadingResume && (
        <View style={styles.fileCard}>
          <View style={styles.fileIcon}>
            <FileText
              size={22}
              color={COLORS.accent}
            />
          </View>

          <View style={styles.fileInfo}>
            <Text
              style={styles.fileName}
              numberOfLines={1}
            >
              {existingResume.file_name ||
                existingResume.file_path
                  ?.split("/")
                  .pop() ||
                "Uploaded CV"}
            </Text>

            <Text style={styles.fileSubtext}>
              Uploaded CV
            </Text>
          </View>

          {(existingResume.file_url || existingResume.file_path) && (
            <Pressable
              style={styles.smallButton}
              onPress={openFile}
            >
              <Eye
                size={15}
                color={COLORS.text}
              />

              <Text style={styles.smallButtonText}>
                View
              </Text>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.deleteButton,
              deleting && styles.disabledButton,
            ]}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator
                size="small"
                color={COLORS.danger}
              />
            ) : (
              <Trash2
                size={15}
                color={COLORS.danger}
              />
            )}

            <Text style={styles.deleteText}>
              {deleting
                ? "Deleting..."
                : "Delete"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Selected File */}

      {file && (
        <View style={styles.fileCard}>
          <View style={styles.fileIcon}>
            <FileText
              size={22}
              color={COLORS.accent}
            />
          </View>

          <View style={styles.fileInfo}>
            <Text
              style={styles.fileName}
              numberOfLines={1}
            >
              {file.name}
            </Text>

            <Text style={styles.fileSubtext}>
              {file.size
                ? `${(
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2)} MB`
                : "Selected file"}
            </Text>
          </View>

          <Pressable
            style={styles.removeFileButton}
            onPress={() => setFile(null)}
          >
            <Trash2
              size={16}
              color={COLORS.danger}
            />
          </Pressable>
        </View>
      )}

      {/* Error */}

      {error !== "" && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {error}
          </Text>
          {canRetry && file && (
            <Pressable
              style={styles.retryButton}
              onPress={handleUpload}
              disabled={loading}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Upload Button */}

      <Pressable
        style={[
          styles.uploadButton,
          (!file || loading) &&
            styles.uploadButtonDisabled,
        ]}
        onPress={handleUpload}
        disabled={!file || loading}
      >
        {loading ? (
          <>
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />

            <Text style={styles.uploadButtonText}>
              Uploading and analyzing...
            </Text>
          </>
        ) : (
          <>
            <Upload
              size={18}
              color="#FFFFFF"
            />

            <Text style={styles.uploadButtonText}>
              Upload CV
            </Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  container: {
    padding: 20,
    paddingBottom: 50,
  },

  successContainer: {
    padding: 20,
    paddingBottom: 50,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },

  backText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSec,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 28,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSec,
  },

  uploadArea: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 42,
    paddingHorizontal: 24,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },

  uploadIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#F1EDFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  uploadTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },

  uploadDescription: {
    fontSize: 13,
    color: COLORS.textSec,
    marginBottom: 18,
  },

  chooseButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: "#F1EDFF",
  },

  chooseButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.accent,
  },

  infoCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  infoText: {
    fontSize: 13,
    color: COLORS.textSec,
  },

  fileCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  fileIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: "#F1EDFF",
    alignItems: "center",
    justifyContent: "center",
  },

  fileInfo: {
    flex: 1,
    minWidth: 0,
  },

  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  fileSubtext: {
    fontSize: 12,
    color: COLORS.textSec,
    marginTop: 3,
  },

  smallButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFFFFF",
  },

  smallButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },

  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.dangerBg,
  },

  deleteText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.danger,
  },

  disabledButton: {
    opacity: 0.6,
  },

  removeFileButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.dangerBg,
    alignItems: "center",
    justifyContent: "center",
  },

  errorBox: {
    marginTop: 16,
    padding: 13,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
  },

  errorText: {
    fontSize: 13,
    color: COLORS.danger,
    lineHeight: 19,
  },

  retryButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  uploadButton: {
    width: "100%",
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  uploadButtonDisabled: {
    backgroundColor: "#94A3B8",
  },

  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  successCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },

  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  successDescription: {
    marginTop: 10,
    marginBottom: 28,
    maxWidth: 560,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSec,
    textAlign: "center",
  },

  successActions: {
    width: "100%",
    gap: 10,
  },

  secondaryButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  primaryButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  editButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
  },

  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSec,
  },
});
