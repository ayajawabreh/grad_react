import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Sparkles,
  MapPin,
  Briefcase,
  CalendarPlus,
  Bookmark,
} from "lucide-react-native";

import { C, F } from "../../constants/tokens";
import { CANDIDATES } from "../../constants/data";

const WHY_MAP: Record<number, string[]> = {
  1: [
    "96% skills overlap with open roles",
    "Portfolio demonstrates end-to-end ownership",
    "Stanford HCI background ideal for product work",
  ],
  2: [
    "React & TypeScript align with engineering needs",
    "MIT graduate with 4 yrs experience",
    "Previous contributions to large-scale systems",
  ],
  3: [
    "Node.js & PostgreSQL match backend roles",
    "Berkeley grad with strong technical foundation",
    "3 yrs at relevant companies",
  ],
  4: [
    "Motion design expertise is rare and valuable",
    "CMU design program top-ranked nationally",
    "Strong portfolio of production work",
  ],
};

export default function RecommendedCandidates() {
  const router = useRouter();

  const handleInvite = (id: number) => {
    router.push(`/company/applicants/${id}` as any);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Recommended Candidates</Text>

          <View style={styles.aiBadge}>
            <Sparkles size={12} color={C.purple} />
            <Text style={styles.aiText}>AI Powered</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Top candidates matched to your open roles
        </Text>
      </View>

      {/* Candidates */}
      <View style={styles.list}>
        {CANDIDATES.map((candidate) => {
          const whyMatches = WHY_MAP[candidate.id] ?? [];

          return (
            <View key={candidate.id} style={styles.card}>
              {/* Candidate top section */}
              <View style={styles.candidateHeader}>
                <Image
                  source={{ uri: candidate.avatar }}
                  style={styles.avatar}
                />

                <View style={styles.candidateInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {candidate.name}
                    </Text>

                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>
                        {candidate.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.candidateTitle} numberOfLines={2}>
                    {candidate.title} · {candidate.univ}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MapPin size={13} color={C.textSec} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {candidate.location}
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Briefcase size={13} color={C.textSec} />
                      <Text style={styles.metaText}>
                        {candidate.exp}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Match */}
              <View style={styles.matchSection}>
                <View style={styles.matchCircle}>
                  <Text style={styles.matchNumber}>
                    {candidate.match}%
                  </Text>

                  <Text style={styles.matchLabel}>MATCH</Text>
                </View>

                <View style={styles.matchInfo}>
                  <Text style={styles.matchTitle}>AI Match Score</Text>

                  <Text style={styles.matchDescription}>
                    Strong candidate match based on skills and experience
                  </Text>
                </View>
              </View>

              {/* Skills */}
              <View style={styles.skillsContainer}>
                {candidate.skills.map((skill) => (
                  <View key={skill} style={styles.skill}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>

              {/* Why this matches */}
              <View style={styles.whyBox}>
                <Text style={styles.whyTitle}>
                  WHY THIS MATCHES
                </Text>

                {whyMatches.map((reason) => (
                  <View key={reason} style={styles.reasonRow}>
                    <View style={styles.bullet} />

                    <Text style={styles.reasonText}>
                      {reason}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.inviteButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleInvite(candidate.id)}
                >
                  <CalendarPlus size={16} color="#FFFFFF" />

                  <Text style={styles.inviteText}>
                    Invite
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {}}
                >
                  <Bookmark size={16} color={C.accent} />

                  <Text style={styles.saveText}>
                    Save
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  content: {
    padding: 16,
    paddingBottom: 32,
  },

  /* Header */

  header: {
    marginBottom: 22,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 5,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
    flexShrink: 1,
  },

  subtitle: {
    fontSize: 13,
    color: C.textSec,
    fontFamily: F,
  },

  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: C.purpleBg,
  },

  aiText: {
    fontSize: 11,
    fontWeight: "600",
    color: C.purple,
    fontFamily: F,
  },

  /* List */

  list: {
    gap: 14,
  },

  /* Card */

  card: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },

  /* Candidate */

  candidateHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: C.bg,
  },

  candidateInfo: {
    flex: 1,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 4,
    flexWrap: "wrap",
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
    flexShrink: 1,
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: C.successBg,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "700",
    color: C.success,
    fontFamily: F,
  },

  candidateTitle: {
    fontSize: 12,
    color: C.textSec,
    fontFamily: F,
    lineHeight: 18,
    marginBottom: 8,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "70%",
  },

  metaText: {
    fontSize: 11,
    color: C.textSec,
    fontFamily: F,
    flexShrink: 1,
  },

  /* Match */

  matchSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: C.bg,
  },

  matchCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  matchNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: C.accent,
    fontFamily: F,
  },

  matchLabel: {
    fontSize: 7,
    fontWeight: "700",
    color: C.textMuted,
    marginTop: 1,
    fontFamily: F,
  },

  matchInfo: {
    flex: 1,
  },

  matchTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
    marginBottom: 3,
  },

  matchDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: C.textSec,
    fontFamily: F,
  },

  /* Skills */

  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },

  skill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: C.accentLight,
  },

  skillText: {
    fontSize: 10,
    fontWeight: "600",
    color: C.accentHover,
    fontFamily: F,
  },

  /* Why */

  whyBox: {
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },

  whyTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textSec,
    letterSpacing: 0.7,
    marginBottom: 8,
    fontFamily: F,
  },

  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 5,
  },

  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.accent,
    marginTop: 5,
    flexShrink: 0,
  },

  reasonText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: C.textSec,
    fontFamily: F,
  },

  /* Actions */

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  inviteButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: C.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  inviteText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: F,
  },

  saveButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.accent,
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  saveText: {
    color: C.accent,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: F,
  },

  pressed: {
    opacity: 0.7,
  },
});