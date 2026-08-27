import { router } from "expo-router";
import { ArrowRight, Briefcase, Building2, Shield, Sparkles, User } from "lucide-react-native";
import { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GOLD = "#C4A066";
const BG = "#FAFAFB";
const DARK = "#1E232A";
const TEXT = "#1F242D";
const MUTED = "#6C757D";
const BORDER = "#E2E8F0";
const WHITE = "#FFFFFF";

export default function LandingPage() {
  const { width } = useWindowDimensions();
  const mobile = width < 700;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={[styles.navbar, mobile && styles.navbarMobile]}>
          <View style={styles.brand}>
            <View style={styles.logo}><Text style={styles.logoText}>CB</Text></View>
            <Text style={styles.brandName}>CareerBridge</Text>
          </View>
          <View style={styles.navActions}>
            <Pressable style={styles.signIn} onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.signInText}>Sign In</Text>
            </Pressable>
            {!mobile && (
              <Pressable style={styles.getStarted} onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.getStartedText}>Get Started</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={[styles.hero, mobile && styles.heroMobile]}>
          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <Sparkles size={14} color={GOLD} />
              <Text style={styles.badgeText}>THE GRADUATE RECRUITMENT PLATFORM</Text>
            </View>
            <Text style={[styles.heroTitle, mobile && styles.heroTitleMobile]}>
              Launch Your Career{"\n"}<Text style={styles.gold}>with Confidence</Text>
            </Text>
            <Text style={[styles.heroDescription, mobile && styles.heroDescriptionMobile]}>
              CareerBridge connects ambitious graduates with leading companies shaping tomorrow&apos;s industry landscape.
            </Text>
            <View style={[styles.heroActions, mobile && styles.heroActionsMobile]}>
              <Pressable style={[styles.primaryButton, mobile && styles.full]} onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.primaryText}>Get Started Free</Text>
              </Pressable>
              <Pressable style={[styles.secondaryButton, mobile && styles.full]} onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.secondaryText}>Sign In</Text>
              </Pressable>
              <Pressable style={[styles.secondaryButton, styles.postJob, mobile && styles.full]} onPress={() => router.push("/(auth)/login")}>
                <Building2 size={16} color={WHITE} />
                <Text style={styles.secondaryText}>Post a Job</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat value="50,000+" label="Graduate Profiles" />
          <Stat value="500+" label="Partner Companies" />
          <Stat value="12,000+" label="Successful Hires" />
          <Stat value="94%" label="Satisfaction Rate" />
        </View>

        <View style={[styles.section, mobile && styles.sectionMobile]}>
          <Text style={styles.sectionLabel}>WHY CAREERBRIDGE</Text>
          <Text style={[styles.sectionTitle, mobile && styles.sectionTitleMobile]}>Everything you need to succeed</Text>
          <View style={styles.cards}>
            <Feature icon={<Briefcase size={22} color={GOLD} />} title="10,000+ Live Jobs" text="Curated graduate opportunities from startups and leading companies." />
            <Feature icon={<Sparkles size={22} color={GOLD} />} title="AI-Powered Matching" text="Accurate matches based on your skills, education and goals." />
            <Feature icon={<Building2 size={22} color="#3B82F6" />} title="500+ Partner Companies" text="Connect directly with verified hiring teams." />
            <Feature icon={<Shield size={22} color="#22C55E" />} title="Verified & Secure" text="Verified employers and protected personal information." />
          </View>
        </View>

        <View style={[styles.section, styles.rolesSection, mobile && styles.sectionMobile]}>
          <Text style={[styles.sectionTitle, mobile && styles.sectionTitleMobile]}>Who are you?</Text>
          <View style={styles.cards}>
            <Role icon={<User size={24} color="#22C55E" />} title="Student / Graduate" text="Discover opportunities and launch your career." />
            <Role icon={<Building2 size={24} color={GOLD} />} title="Company" text="Find graduate talent and grow your team." />
            <Role icon={<Shield size={24} color="#EF4444" />} title="Admin" text="Manage platform operations and security." />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 CareerBridge. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <View style={styles.card}><View style={styles.featureIcon}>{icon}</View><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardText}>{text}</Text></View>;
}

function Role({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <Pressable style={styles.card} onPress={() => router.push("/(auth)/login")}><View style={styles.featureIcon}>{icon}</View><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardText}>{text}</Text><View style={styles.roleAction}><Text style={styles.roleActionText}>Sign In</Text><ArrowRight size={14} color={GOLD} /></View></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  page: { backgroundColor: BG },
  navbar: { minHeight: 70, paddingHorizontal: 36, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navbarMobile: { minHeight: 62, paddingHorizontal: 18 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 9, backgroundColor: DARK, alignItems: "center", justifyContent: "center" },
  logoText: { color: WHITE, fontWeight: "900", fontSize: 12 },
  brandName: { color: TEXT, fontSize: 19, fontWeight: "800" },
  navActions: { flexDirection: "row", gap: 9 },
  signIn: { minHeight: 40, paddingHorizontal: 16, borderWidth: 1, borderColor: BORDER, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  signInText: { color: TEXT, fontWeight: "700" },
  getStarted: { minHeight: 40, paddingHorizontal: 17, borderRadius: 9, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  getStartedText: { color: WHITE, fontWeight: "700" },
  hero: { minHeight: 520, paddingHorizontal: 24, paddingVertical: 78, backgroundColor: DARK, alignItems: "center", justifyContent: "center" },
  heroMobile: { minHeight: 500, paddingHorizontal: 18, paddingVertical: 52 },
  heroContent: { width: "100%", maxWidth: 780, alignItems: "center" },
  badge: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "#C4A06650", backgroundColor: "#C4A06618", paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, marginBottom: 23 },
  badgeText: { color: GOLD, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  heroTitle: { color: WHITE, fontSize: 50, lineHeight: 59, fontWeight: "900", textAlign: "center", letterSpacing: -1 },
  heroTitleMobile: { fontSize: 33, lineHeight: 42 },
  gold: { color: GOLD },
  heroDescription: { maxWidth: 610, color: "#A0AEC0", fontSize: 17, lineHeight: 26, textAlign: "center", marginTop: 20, marginBottom: 34 },
  heroDescriptionMobile: { fontSize: 14, lineHeight: 22 },
  heroActions: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  heroActionsMobile: { width: "100%", flexDirection: "column" },
  primaryButton: { minHeight: 47, paddingHorizontal: 23, borderRadius: 9, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  primaryText: { color: WHITE, fontWeight: "800" },
  secondaryButton: { minHeight: 47, paddingHorizontal: 23, borderRadius: 9, borderWidth: 1, borderColor: "#FFFFFF35", backgroundColor: "#FFFFFF0A", alignItems: "center", justifyContent: "center" },
  postJob: { flexDirection: "row", gap: 8 },
  secondaryText: { color: WHITE, fontWeight: "700" },
  full: { width: "100%" },
  stats: { backgroundColor: WHITE, paddingHorizontal: 18, paddingVertical: 30, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", gap: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  stat: { minWidth: 135, alignItems: "center" },
  statValue: { color: TEXT, fontSize: 29, fontWeight: "900" },
  statLabel: { color: MUTED, fontSize: 12, marginTop: 3 },
  section: { width: "100%", maxWidth: 1180, alignSelf: "center", paddingHorizontal: 36, paddingVertical: 60 },
  sectionMobile: { paddingHorizontal: 18, paddingVertical: 42 },
  rolesSection: { paddingTop: 20 },
  sectionLabel: { color: GOLD, fontSize: 11, fontWeight: "800", letterSpacing: 1.5, textAlign: "center" },
  sectionTitle: { color: TEXT, fontSize: 31, lineHeight: 40, fontWeight: "900", textAlign: "center", marginTop: 9, marginBottom: 34 },
  sectionTitleMobile: { fontSize: 24, lineHeight: 31 },
  cards: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center" },
  card: { flex: 1, minWidth: 235, maxWidth: 360, minHeight: 190, backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 22 },
  featureIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: "#C4A06616", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  cardTitle: { color: TEXT, fontSize: 17, fontWeight: "800", marginBottom: 8 },
  cardText: { color: MUTED, fontSize: 13, lineHeight: 20 },
  roleAction: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18 },
  roleActionText: { color: GOLD, fontSize: 13, fontWeight: "800" },
  footer: { paddingHorizontal: 24, paddingVertical: 25, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: BORDER, alignItems: "center" },
  footerText: { color: MUTED, fontSize: 12 },
});
