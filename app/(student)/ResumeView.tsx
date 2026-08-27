import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { API, resolveMediaUrl } from "../../imports/api";
import { formatExperienceDates } from "../../imports/experience";
import { C, F } from "../../constants/tokens";
import { downloadAndOpenResumePdf } from "../../imports/resumePdf";

const GOLD = "#B88A45";
const toArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; }
    catch { return []; }
  }
  return [];
};
const firstText = (...values: any[]) => values.find((value) => value != null && String(value).trim()) ?? "";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.goldLine} />{children}</View>;
}

function Description({ value }: { value?: string }) {
  const lines = String(value ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return null;
  if (lines.length === 1) return <Text style={styles.body}>{lines[0]}</Text>;
  return <>{lines.map((line, index) => <Text key={index} style={styles.body}>• {line.replace(/^[-•]\s*/, "")}</Text>)}</>;
}

export default function ResumeView() {
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [resumeResponse, profileResponse] = await Promise.all([
        API.get("/student/resume"),
        API.get("/student/profile").catch(() => ({ data: {} })),
      ]);
      setResume({ ...(profileResponse.data ?? {}), ...(resumeResponse.data ?? {}) });
    } catch (error) {
      console.error("Failed to load resume:", error);
      Alert.alert("Error", "Failed to load your resume. Please try again.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const openLink = async (value: string) => {
    const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try { await Linking.openURL(url); } catch { Alert.alert("Error", "Could not open this link."); }
  };

  const downloadPdf = async () => {
    if (!resume?.id) { Alert.alert("Resume Not Saved", "Save your resume before downloading it."); return; }
    try {
      setDownloading(true);
      await downloadAndOpenResumePdf(resume.id, resume.full_name);
    } catch (error) {
      console.error("PDF error:", error);
      Alert.alert("Error", "Failed to download PDF. Please try again.");
    } finally { setDownloading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={GOLD} /><Text style={styles.muted}>Loading resume...</Text></View>;
  if (!resume) return <View style={styles.center}><Text style={styles.emptyTitle}>No Resume Found</Text><Pressable style={styles.goldButton} onPress={load}><Text style={styles.goldButtonText}>Try Again</Text></Pressable></View>;

  const education = toArray(resume.education);
  const skills = toArray(resume.skills);
  const experience = toArray(resume.experience);
  const projects = toArray(resume.projects);
  const certificates = toArray(resume.certificates);
  const languages = toArray(resume.languages);
  const achievements = toArray(resume.achievements);
  const avatar = resolveMediaUrl(firstText(resume.avatar, resume.profile_image, resume.photo));
  const showPhoto = resume.include_profile_photo !== false && resume.include_profile_photo !== 0 && !!avatar;
  const links = [["GitHub", resume.github], ["LinkedIn", resume.linkedin], ["Portfolio", resume.portfolio]].filter(([, value]) => Boolean(value));
  const groupedSkills = skills.reduce<Record<string, string[]>>((groups, skill) => {
    const name = typeof skill === "string" ? skill : firstText(skill.name, skill.title);
    if (!name) return groups;
    const category = typeof skill === "object" ? firstText(skill.category, "Other") : "Other";
    (groups[category] ||= []).push(String(name));
    return groups;
  }, {});

  return <SafeAreaView style={styles.safe} edges={["bottom"]}>
    <View style={styles.toolbar}>
      <Pressable onPress={() => router.replace("/(student)/Resume")}><Text style={styles.toolbarText}>← Back to Editor</Text></Pressable>
      <Pressable style={styles.goldButton} onPress={downloadPdf} disabled={downloading}>
        {downloading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.goldButtonText}>Download PDF</Text>}
      </Pressable>
    </View>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.paper}>
        <View style={styles.header}>
          <View style={styles.identity}>
            {!!resume.full_name && <Text style={styles.name}>{resume.full_name}</Text>}
            {!!resume.professional_title && <Text style={styles.jobTitle}>{resume.professional_title}</Text>}
            {!![resume.location, resume.phone, resume.email].filter(Boolean).length && <Text style={styles.contact}>{[resume.location, resume.phone, resume.email].filter(Boolean).join("  |  ")}</Text>}
            {!!links.length && <View style={styles.links}>{links.map(([label, value]) => <Pressable key={String(label)} onPress={() => openLink(String(value))}><Text style={styles.link}>{label}</Text></Pressable>)}</View>}
          </View>
          {showPhoto && <Image source={{ uri: avatar! }} style={styles.avatar} resizeMode="cover" />}
        </View>

        {!!resume.summary && <Section title="SUMMARY"><Text style={styles.body}>{resume.summary}</Text></Section>}
        {!!experience.length && <Section title="PROFESSIONAL EXPERIENCE">{experience.map((item, index) => <View key={item.id ?? index} style={styles.entry}>
          <View style={styles.entryHeader}><Text style={styles.entryTitle}>{firstText(item.title, item.position, "Experience")}{item.company ? ` — ${item.company}` : ""}</Text><Text style={styles.date}>{formatExperienceDates(item.start_date, item.end_date)}</Text></View><Description value={item.description} />
        </View>)}</Section>}
        {!!education.length && <Section title="EDUCATION">{education.map((item, index) => <View key={item.id ?? index} style={styles.entry}>
          <Text style={styles.entryTitle}>{firstText(item.degree, "Education")}{item.field_of_study ? ` in ${item.field_of_study}` : ""}</Text>
          {!!firstText(item.university, item.institution) && <Text style={styles.body}>{firstText(item.university, item.institution)}</Text>}
          {!![item.start_date, item.end_date].filter(Boolean).length && <Text style={styles.date}>{[item.start_date, item.end_date].filter(Boolean).join(" — ")}</Text>}
          {!!item.gpa && <Text style={styles.body}>GPA: {item.gpa}</Text>}
        </View>)}</Section>}
        {!!Object.keys(groupedSkills).length && <Section title="TECHNICAL SKILLS">{Object.entries(groupedSkills).map(([category, names]) => <Text key={category} style={styles.body}><Text style={styles.bold}>{category}: </Text>{names.join(" · ")}</Text>)}</Section>}
        {!!projects.length && <Section title="PROJECTS">{projects.map((item, index) => <View key={item.id ?? index} style={styles.entry}>
          <Text style={styles.entryTitle}>{firstText(item.name, item.title, "Project")}</Text><Description value={firstText(item.description, item.summary)} />
          {!!item.link && <Pressable onPress={() => openLink(item.link)}><Text style={styles.link}>{item.link}</Text></Pressable>}
        </View>)}</Section>}
        {!!achievements.length && <Section title="ACTIVITIES & ACHIEVEMENTS">{achievements.map((item, index) => <View key={item.id ?? index} style={styles.entry}>
          <Text style={styles.entryTitle}>{firstText(item.title, item.name, "Achievement")}</Text><Text style={styles.date}>{[item.organization, item.year].filter(Boolean).join(" · ")}</Text><Description value={item.description} />
        </View>)}</Section>}
        {(!!languages.length || !!certificates.length) && <Section title="ADDITIONAL INFORMATION">
          {!!languages.length && <Text style={styles.body}><Text style={styles.bold}>Languages: </Text>{languages.map((item) => typeof item === "string" ? item : `${firstText(item.language, item.name)}${item.level ? ` (${item.level})` : ""}`).join(" · ")}</Text>}
          {!!certificates.length && <Text style={styles.body}><Text style={styles.bold}>Certificates: </Text>{certificates.map((item) => typeof item === "string" ? item : `${firstText(item.name, item.title)}${item.issuer ? ` — ${item.issuer}` : ""}`).join(" · ")}</Text>}
        </Section>}
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F1ED" }, scroll: { flex: 1 }, content: { padding: 14, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: C.bg }, muted: { fontFamily: F, color: C.textSec },
  emptyTitle: { fontFamily: F, fontSize: 20, fontWeight: "800", color: C.text },
  toolbar: { minHeight: 58, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E8E3DA" },
  toolbarText: { fontFamily: F, fontSize: 13, fontWeight: "700", color: C.text }, goldButton: { minHeight: 38, paddingHorizontal: 14, borderRadius: 8, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" }, goldButtonText: { fontFamily: F, fontSize: 12, fontWeight: "800", color: "#fff" },
  paper: { width: "100%", maxWidth: 760, alignSelf: "center", backgroundColor: "#fff", paddingHorizontal: 22, paddingVertical: 28, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16, paddingBottom: 18 }, identity: { flex: 1 },
  name: { fontFamily: F, fontSize: 27, lineHeight: 32, fontWeight: "900", color: "#24201B", textTransform: "uppercase" }, jobTitle: { marginTop: 4, fontFamily: F, fontSize: 14, fontWeight: "700", color: GOLD, textTransform: "uppercase", letterSpacing: 0.8 },
  contact: { marginTop: 10, fontFamily: F, fontSize: 10.5, lineHeight: 16, color: "#625D55" }, links: { marginTop: 5, flexDirection: "row", flexWrap: "wrap", gap: 12 }, link: { fontFamily: F, fontSize: 10.5, lineHeight: 17, color: GOLD, textDecorationLine: "underline" },
  avatar: { width: 96, height: 96, borderRadius: 0, backgroundColor: "#EEEAE4" }, section: { marginTop: 18 }, sectionTitle: { fontFamily: F, fontSize: 12.5, fontWeight: "900", color: "#2B2722", letterSpacing: 1.1 }, goldLine: { height: 2, marginTop: 6, marginBottom: 10, backgroundColor: GOLD },
  entry: { marginBottom: 12 }, entryHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 5 }, entryTitle: { flexShrink: 1, fontFamily: F, fontSize: 12.5, fontWeight: "800", color: "#29251F" }, body: { fontFamily: F, fontSize: 11, lineHeight: 17, color: "#514C45" }, date: { fontFamily: F, fontSize: 10, lineHeight: 16, color: "#81796E" }, bold: { fontWeight: "800", color: "#37322B" },
});
