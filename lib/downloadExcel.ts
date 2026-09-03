import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../imports/api";

export const EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function excelExportErrorMessage(error: any) {
  const message = String(error?.message ?? "");
  if (/\b401\b/.test(message)) return "Unauthenticated.";
  if (/\b403\b/.test(message)) return "Unauthorized. Admin access required.";
  return error?.response?.data?.message ?? (message || "Failed to download Excel file.");
}

export async function downloadAdminExcel(
  endpoint: string,
  filename: "students.xlsx" | "companies.xlsx",
  params: { status?: string; search?: string }
) {
  const token =
    (await AsyncStorage.getItem("cb_token")) ||
    (await AsyncStorage.getItem("token"));
  if (!token) throw new Error("Admin authentication token is missing.");

  const query = Object.entries(params)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  const url = `${API_URL}${endpoint}${query ? `?${query}` : ""}`;
  const destination = new File(Paths.document, filename);

  // Some iOS/Expo Go builds still reject an existing destination even when
  // idempotent is enabled. Remove only this known export file before replacing it.
  if (destination.exists) {
    destination.delete();
  }

  const file = await File.downloadFileAsync(url, destination, {
    idempotent: true,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: EXCEL_MIME,
    },
  });
  const info = file.info();
  const fileSize = Number(info.size ?? 0);

  console.log("Downloaded file URI:", file.uri);
  console.log("Downloaded file size:", fileSize);

  if (!file.exists || fileSize <= 0 || !file.uri.toLowerCase().endsWith(".xlsx")) {
    throw new Error("The Excel file could not be saved on this device.");
  }
  return file.uri;
}

export async function shareExcelFile(uri: string) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("File sharing is not available on this device.");
  }
  const file = new File(uri);
  const info = file.info();
  if (!file.exists || !info.size) {
    throw new Error("The downloaded Excel file could not be found.");
  }

  // The app uses a custom Modal for Alert.alert. Give iOS time to dismiss
  // that modal before presenting the native share sheet.
  await new Promise((resolve) => setTimeout(resolve, 400));

  await Sharing.shareAsync(file.uri, {
    mimeType: EXCEL_MIME,
    UTI: "org.openxmlformats.spreadsheetml.sheet",
    dialogTitle: "Open or share Excel file",
  });
}
