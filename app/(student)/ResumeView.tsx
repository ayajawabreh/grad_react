import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { API } from "../../imports/api";
import { downloadResumePdf, shareResumePdf } from "../../imports/resumePdf";
import { C, F } from "../../constants/tokens";

const GOLD = "#B88A45";

type ResumeSummary = {
  id: number | null;
  full_name?: string | null;
  template?: string | null;
};

const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ?? error?.message ?? fallback;

export default function ResumeView() {
  const [resume, setResume] = useState<ResumeSummary | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await API.get("/student/resume", {
        params: { _: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      const nextResume = response.data as ResumeSummary;
      setResume(nextResume);

      if (!nextResume?.id) {
        setPdfUri(null);
        setError("Save your resume before viewing its PDF.");
        return;
      }

      const file = await downloadResumePdf(nextResume.id, nextResume.full_name ?? undefined);
      setPdfUri(file.uri);
    } catch (requestError: any) {
      setPdfUri(null);
      setError(errorMessage(requestError, "Failed to display the CV."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const downloadAndShare = async () => {
    if (!resume?.id) {
      Alert.alert("Resume Not Saved", "Save your resume before downloading it.");
      return;
    }

    try {
      setDownloading(true);
      const file = await downloadResumePdf(resume.id, resume.full_name ?? undefined);
      setPdfUri(file.uri);
      await shareResumePdf(file.uri);
      Alert.alert("Success", "CV downloaded successfully.");
    } catch (requestError: any) {
      Alert.alert("Error", errorMessage(requestError, "Failed to download the CV."));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.toolbar}>
        <Pressable style={styles.toolbarButton} onPress={() => router.replace("/(student)/Resume")}>
          <Text style={styles.toolbarText}>← Back to Editor</Text>
        </Pressable>
        <Pressable style={styles.goldButton} onPress={downloadAndShare} disabled={downloading || !resume?.id}>
          {downloading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.goldButtonText}>Open / Share</Text>}
        </Pressable>
      </View>

      {loading ? (
        <State loading text="Loading CV PDF..." />
      ) : error || !pdfUri ? (
        <State text={error || "Failed to display the CV."} retry={load} />
      ) : (
        <WebView
          key={pdfUri}
          source={{ uri: pdfUri }}
          style={styles.viewer}
          originWhitelist={["file://*"]}
          allowFileAccess
          allowUniversalAccessFromFileURLs={false}
          onError={() => setError("Failed to display the CV.")}
          startInLoadingState
          renderLoading={() => <State loading text="Opening CV PDF..." />}
        />
      )}
    </SafeAreaView>
  );
}

function State({ text, loading, retry }: { text: string; loading?: boolean; retry?: () => void }) {
  return (
    <View style={styles.center}>
      {loading ? <ActivityIndicator color={GOLD} /> : null}
      <Text style={styles.message}>{text}</Text>
      {retry ? <Pressable style={styles.goldButton} onPress={retry}><Text style={styles.goldButtonText}>Try Again</Text></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F1ED" },
  toolbar: { minHeight: 58, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E8E3DA" },
  toolbarButton: { minHeight: 44, justifyContent: "center" },
  toolbarText: { fontFamily: F, fontSize: 13, fontWeight: "700", color: C.text },
  goldButton: { minHeight: 40, paddingHorizontal: 14, borderRadius: 8, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  goldButtonText: { fontFamily: F, fontSize: 12, fontWeight: "800", color: "#FFFFFF" },
  viewer: { flex: 1, width: "100%", backgroundColor: "#D8D5D0" },
  center: { flex: 1, minHeight: 180, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 28, backgroundColor: C.bg },
  message: { fontFamily: F, color: C.textSec, fontSize: 13, lineHeight: 20, textAlign: "center" },
});
