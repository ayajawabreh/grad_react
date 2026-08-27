import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Upload,
  PenLine,
  ArrowRight,
  FileText,
} from "lucide-react-native";

import { C, F } from "../../constants/tokens";

export default function MyResume() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              Resume Builder
            </Text>
          </View>

          <Text style={styles.title}>
            Build Your Resume
          </Text>

          <Text style={styles.subtitle}>
            Create a professional resume that showcases your
            skills, experience, and achievements.
          </Text>
        </View>

        {/* Cards */}
        <View style={styles.cardsContainer}>
          {/* Upload CV */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push("/(student)/ResumeUpload")
            }
            style={styles.card}
          >
            {/* Decorative circle */}
            <View style={styles.decorativeCircle} />

            <View style={styles.cardTopRow}>
              <View style={styles.uploadIconBox}>
                <Upload
                  size={24}
                  color={C.accent}
                />
              </View>

              <View style={styles.arrowBox}>
                <ArrowRight
                  size={17}
                  color={C.textMuted}
                />
              </View>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                Upload Existing CV
              </Text>

              <Text style={styles.cardDescription}>
                Already have a CV? Upload your PDF or DOCX and
                let CareerBridge extract your information for you.
              </Text>

              <View style={styles.actionRow}>
                <Text style={styles.uploadAction}>
                  Upload your CV
                </Text>

                <ArrowRight
                  size={14}
                  color={C.accent}
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* Create Resume */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push("/(student)/Resume")
            }
            style={styles.card}
          >
            {/* Decorative circle */}
            <View
              style={[
                styles.decorativeCircle,
                styles.successCircle,
              ]}
            />

            <View style={styles.cardTopRow}>
              <View style={styles.createIconBox}>
                <PenLine
                  size={24}
                  color={C.success}
                />
              </View>

              <View style={styles.arrowBox}>
                <ArrowRight
                  size={17}
                  color={C.textMuted}
                />
              </View>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                Create New Resume
              </Text>

              <Text style={styles.cardDescription}>
                Start from scratch and build your professional
                resume step by step with our easy-to-use builder.
              </Text>

              <View style={styles.actionRow}>
                <Text style={styles.createAction}>
                  Start building
                </Text>

                <ArrowRight
                  size={14}
                  color={C.success}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Information */}
        <View style={styles.infoBox}>
          <FileText
            size={15}
            color={C.textMuted}
          />

          <Text style={styles.infoText}>
            Your resume can be saved, edited, previewed, and
            downloaded as a PDF anytime.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },

  header: {
    alignItems: "center",
    marginBottom: 28,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.accent + "12",
    marginBottom: 12,
  },

  badgeText: {
    color: C.accent,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: F,
  },

  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: "900",
    color: C.text,
    fontFamily: F,
    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,
    maxWidth: 520,
    fontSize: 14,
    lineHeight: 22,
    color: C.textSec,
    fontFamily: F,
    textAlign: "center",
  },

  cardsContainer: {
    gap: 16,
  },

  savedCard: {
    marginBottom: 18,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.accent + "55",
    backgroundColor: "#FFFFFF",
  },

  savedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  savedTitle: {
    fontFamily: F,
    fontSize: 16,
    fontWeight: "800",
    color: C.text,
  },

  savedDate: {
    marginTop: 3,
    fontFamily: F,
    fontSize: 11.5,
    color: C.textSec,
  },

  savedActions: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  savedButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#F8FAFC",
  },

  savedButtonText: {
    fontFamily: F,
    fontSize: 11.5,
    fontWeight: "700",
    color: C.text,
  },

  deleteSavedButton: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },

  deleteSavedText: {
    fontFamily: F,
    fontSize: 11.5,
    fontWeight: "700",
    color: "#DC2626",
  },

  card: {
    position: "relative",
    overflow: "hidden",
    minHeight: 270,
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#fff",
  },

  decorativeCircle: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.accent + "08",
  },

  successCircle: {
    backgroundColor: C.success + "08",
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  uploadIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: C.accent + "12",
    alignItems: "center",
    justifyContent: "center",
  },

  createIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: C.success + "12",
    alignItems: "center",
    justifyContent: "center",
  },

  arrowBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },

  cardContent: {
    marginTop: 24,
  },

  cardTitle: {
    marginBottom: 8,
    fontSize: 19,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  cardDescription: {
    fontSize: 13.5,
    lineHeight: 22,
    color: C.textSec,
    fontFamily: F,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
  },

  uploadAction: {
    color: C.accent,
    fontSize: 12.5,
    fontWeight: "700",
    fontFamily: F,
  },

  createAction: {
    color: C.success,
    fontSize: 12.5,
    fontWeight: "700",
    fontFamily: F,
  },

  infoBox: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  infoText: {
    flex: 1,
    color: C.textSec,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: F,
    textAlign: "center",
  },
});

