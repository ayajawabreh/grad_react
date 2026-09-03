import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";
import * as LegacyFileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { Linking, Platform } from "react-native";
import { API, resolveMediaUrl } from "./api";

async function getToken() {
  return (await AsyncStorage.getItem("cb_token")) || (await AsyncStorage.getItem("token"));
}

export async function openUploadedResumeFile(path: string, fileName = "resume.pdf") {
  const url = resolveMediaUrl(path);
  if (!url) throw new Error("Resume file URL is unavailable");
  if (Platform.OS === "web") { await Linking.openURL(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`); return; }

  const token = await getToken();
  const safeName = fileName.replace(/[^a-zA-Z0-9_.-]+/g, "_") || "resume.pdf";
  const extension = safeName.toLowerCase().split(".").pop();
  const nameWithoutExtension = safeName.replace(/\.[^.]+$/, "") || "resume";
  const destination = new File(
    Paths.cache,
    `${nameWithoutExtension}_${Date.now()}.${extension || "pdf"}`
  );
  const file = await File.downloadFileAsync(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, destination, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!file.exists || file.size <= 0) {
    throw new Error("The uploaded CV file is empty.");
  }

  const mimeType = extension === "docx"
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : "application/pdf";

  if (Platform.OS === "android") {
    const contentUri = await LegacyFileSystem.getContentUriAsync(file.uri);
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: contentUri,
      type: mimeType,
      flags: 1,
    });
    return;
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("File opening is not available on this device.");
  }

  await Sharing.shareAsync(file.uri, {
    mimeType,
    UTI: extension === "docx"
      ? "org.openxmlformats.wordprocessingml.document"
      : "com.adobe.pdf",
    dialogTitle: "Open or share CV",
  });
}

export async function downloadAndOpenResumePdf(resumeId: number, fullName?: string) {
  if (Platform.OS === "web") {
    const url = `${API.defaults.baseURL}/student/resume/${resumeId}/pdf?v=${Date.now()}`;
    await Linking.openURL(url);
    return;
  }

  const file = await downloadResumePdf(resumeId, fullName);

  await shareResumePdf(file.uri);
}

export async function downloadResumePdf(resumeId: number, fullName?: string) {
  const url = `${API.defaults.baseURL}/student/resume/${resumeId}/pdf?v=${Date.now()}`;

  const token = await getToken();
  if (!token) throw new Error("Please sign in again to access your CV.");
  const safeName = (fullName || "Resume").trim().replace(/[^a-zA-Z0-9_-]+/g, "_");
  const destination = new File(
    Paths.cache,
    `${safeName || "Resume"}_resume_${Date.now()}.pdf`
  );
  const file = await File.downloadFileAsync(url, destination, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/pdf" },
  });

  if (!file.exists || file.size <= 0) {
    throw new Error("The downloaded CV file is empty.");
  }

  return file;
}

export async function shareResumePdf(fileUri: string) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("File sharing is not available on this device.");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: "Open or share CV",
  });
}
