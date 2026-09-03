import { router } from "expo-router";
import { ArrowRight, BadgeCheck, Briefcase, Building2, MapPin, Shield, Sparkles, User } from "lucide-react-native";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ORIGIN, resolveMediaUrl } from "../imports/api";

const GOLD = "#C4A066";
const BG = "#FAFAFB";
const DARK = "#1E232A";
const TEXT = "#1F242D";
const MUTED = "#6C757D";
const BORDER = "#E2E8F0";
const WHITE = "#FFFFFF";

type LandingCompany = {
  id?: number | string;
  logo?: string | null;
  company_name?: string | null;
  industry?: string | null;
  location?: string | null;
  is_verified?: boolean | number;
};

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

        <CompaniesCarousel width={width} />

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

function CompaniesCarousel({ width }: { width: number }) {
  const [companies, setCompanies] = useState<LandingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const marqueeOffset = useRef(new Animated.Value(0)).current;
  const cardWidth = Math.min(280, width - 48);
  const itemStride = cardWidth + 14;
  const marqueeCompanies = useMemo(() => {
    if (!companies.length) return [];
    const minimumCount = Math.max(
      companies.length,
      Math.ceil((width + itemStride) / itemStride) + 1
    );
    return Array.from(
      { length: minimumCount },
      (_, index) => companies[index % companies.length]
    );
  }, [companies, itemStride, width]);
  const marqueeWidth = marqueeCompanies.length * itemStride;

  useEffect(() => {
    if (!marqueeWidth) return;
    marqueeOffset.setValue(0);
    const animation = Animated.loop(
      Animated.timing(marqueeOffset, {
        toValue: -marqueeWidth,
        duration: marqueeWidth * 20,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [marqueeOffset, marqueeWidth]);

  useEffect(() => {
    let active = true;

    async function loadCompanies() {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(`${API_ORIGIN}/api/landing/companies`, {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Companies request failed: ${response.status}`);
        const body = await response.json();
        if (active) setCompanies(Array.isArray(body?.companies) ? body.companies : []);
      } catch (requestError) {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCompanies();
    return () => { active = false; };
  }, [reloadKey]);

  return (
    <View style={styles.companiesSection}>
      <Text style={styles.companiesEyebrow}>OUR PARTNER COMPANIES</Text>
      <Text style={styles.companiesTitle}>Trusted by leading companies</Text>
      {loading ? (
        <View style={styles.companiesState}>
          <ActivityIndicator color={GOLD} />
          <Text style={styles.companiesStateText}>Loading companies...</Text>
        </View>
      ) : error ? (
        <View style={styles.companiesState}>
          <Text style={styles.companiesStateText}>Could not load companies.</Text>
          <Pressable style={styles.retryButton} onPress={() => setReloadKey((value) => value + 1)}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : companies.length === 0 ? (
        <Text style={styles.companiesStateText}>No companies are available yet.</Text>
      ) : (
        <View style={styles.marqueeViewport} pointerEvents="none">
          <Animated.View
            style={[
              styles.marqueeTrack,
              { transform: [{ translateX: marqueeOffset }] },
            ]}
          >
            {[...marqueeCompanies, ...marqueeCompanies].map((company, index) => (
              <CompanyCard
                key={`${company.id ?? company.company_name ?? "company"}-${index}`}
                company={company}
                width={cardWidth}
              />
            ))}
          </Animated.View>
        </View>
      )}
    </View>
  );
}

function CompanyCard({ company, width }: { company: LandingCompany; width: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const name = company.company_name?.trim() || "Company";
  const logo = resolveMediaUrl(company.logo);

  return (
    <View style={[styles.companyCard, { width }]}>
      {logo && !imageFailed ? (
        <Image source={{ uri: logo }} style={styles.companyLogo} resizeMode="contain" onError={() => setImageFailed(true)} />
      ) : (
        <View style={styles.companyLogoFallback}>
          <Text style={styles.companyLogoLetter}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.companyNameRow}>
        <Text style={styles.companyName} numberOfLines={1}>{name}</Text>
        {!!company.is_verified && <BadgeCheck size={18} color="#3B82F6" fill="#DBEAFE" />}
      </View>
      <View style={styles.companyMetaRow}>
        <Briefcase size={14} color={MUTED} />
        <Text style={styles.companyMeta} numberOfLines={1}>{company.industry || "Industry not specified"}</Text>
      </View>
      <View style={styles.companyMetaRow}>
        <MapPin size={14} color={MUTED} />
        <Text style={styles.companyMeta} numberOfLines={1}>{company.location || "Location not specified"}</Text>
      </View>
    </View>
  );
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
  companiesSection: { backgroundColor: WHITE, paddingVertical: 34, borderBottomWidth: 1, borderBottomColor: BORDER },
  companiesEyebrow: { color: GOLD, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textAlign: "center" },
  companiesTitle: { color: TEXT, fontSize: 23, fontWeight: "900", textAlign: "center", marginTop: 7, marginBottom: 24 },
  marqueeViewport: { width: "100%", overflow: "hidden", paddingLeft: 18 },
  marqueeTrack: { flexDirection: "row" },
  companiesState: { minHeight: 150, alignItems: "center", justifyContent: "center", gap: 10 },
  companiesStateText: { color: MUTED, fontSize: 13, textAlign: "center" },
  retryButton: { minHeight: 39, paddingHorizontal: 18, borderRadius: 9, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
  retryText: { color: WHITE, fontSize: 12, fontWeight: "800" },
  companyCard: { minHeight: 190, marginRight: 14, padding: 18, backgroundColor: BG, borderWidth: 1, borderColor: BORDER, borderRadius: 16 },
  companyLogo: { width: 58, height: 58, borderRadius: 13, backgroundColor: WHITE, marginBottom: 15 },
  companyLogoFallback: { width: 58, height: 58, borderRadius: 13, backgroundColor: "#C4A06620", alignItems: "center", justifyContent: "center", marginBottom: 15 },
  companyLogoLetter: { color: GOLD, fontSize: 24, fontWeight: "900" },
  companyNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  companyName: { flexShrink: 1, color: TEXT, fontSize: 17, fontWeight: "900" },
  companyMetaRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 7 },
  companyMeta: { flex: 1, color: MUTED, fontSize: 12 },
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
