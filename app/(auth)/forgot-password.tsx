import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Lock, CheckCircle2, ChevronLeft } from "lucide-react-native";
import { C } from "../../constants/tokens";

export default function ForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSendReset = () => {
    if (!email.trim()) {
      return;
    }

    // لاحقًا نربطها مع Laravel API
    setSent(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>

        {/* Back */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/login")}
        >
          <ChevronLeft size={18} color="#6B7280" />
          <Text style={styles.backText}>Back to sign in</Text>
        </TouchableOpacity>

        <View style={styles.card}>

          {!sent ? (
            <>
              {/* Icon */}
              <View style={styles.iconBox}>
                <Lock size={24} color={C.accentHover} />
              </View>

              <Text style={styles.title}>
                Forgot your password?
              </Text>

              <Text style={styles.description}>
                Enter your email and we&apos;ll send you a reset link.
              </Text>

              {/* Email */}
              <Text style={styles.label}>
                Email Address
              </Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              {/* Send */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSendReset}
              >
                <Text style={styles.primaryButtonText}>
                  Send Reset Link
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>

              <View style={styles.successIcon}>
                <CheckCircle2 size={30} color="#22C55E" />
              </View>

              <Text style={styles.title}>
                Check your email
              </Text>

              <Text style={styles.description}>
                We&apos;ve sent a password reset link to your inbox.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.primaryButtonText}>
                  Back to Sign In
                </Text>
              </TouchableOpacity>

            </View>
          )}

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F6",
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: "center",
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 24,
  },

  backText: {
    fontSize: 14,
    color: "#6B7280",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 24,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 7,
  },

  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },

  primaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 13,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  successContainer: {
    alignItems: "center",
  },

  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
});
