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
  const destination = new File(Paths.cache, safeName);
  if (destination.exists) {
    destination.delete();
  }
  const file = await File.downloadFileAsync(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, destination, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const extension = safeName.toLowerCase().split(".").pop();
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

  await Linking.openURL(file.uri);
}

export async function downloadAndOpenResumePdf(resumeId: number, fullName?: string) {
  const url = `${API.defaults.baseURL}/student/resume/${resumeId}/pdf?v=${Date.now()}`;

  if (Platform.OS === "web") {
    await Linking.openURL(url);
    return;
  }

  const token = await getToken();
  const safeName = (fullName || "Resume").trim().replace(/[^a-zA-Z0-9_-]+/g, "_");
  const destination = new File(Paths.cache, `${safeName || "Resume"}.pdf`);
  if (destination.exists) {
    destination.delete();
  }
  const file = await File.downloadFileAsync(url, destination, {
    headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/pdf" } : undefined,
  });

  if (!(await Sharing.isAvailableAsync())) {
    await Linking.openURL(file.uri);
    return;
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: "Open or save resume PDF",
  });
}
