import { useState } from "react";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Lock, CheckCircle2, ChevronLeft } from "lucide-react-native";
import { C } from "../../constants/tokens";
import { postPublicJson } from "../../imports/api";

export default function ForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [passwordStep, setPasswordStep] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSendReset = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    // لاحقًا نربطها مع Laravel API
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const response = await postPublicJson<{ message?: string }>("/forgot-password", { email: email.trim() });
      if (sent) {
        setCode("");
        setNotice(response?.message ?? "A new reset code was sent.");
      }
      setSent(true);
    } catch (requestError: any) {
      setError(requestError?.message || "Could not send the reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code sent to your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Password confirmation does not match.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await postPublicJson<{ message?: string }>("/reset-password", {
        email: email.trim().toLowerCase(),
        code,
        password,
        password_confirmation: passwordConfirmation,
      });
      setResetComplete(true);
    } catch (requestError: any) {
      const body = requestError?.body;
      const validationErrors = body?.errors;
      const firstError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null;
      const attempts = body?.attempts_remaining;
      const errorMessage = body?.message ?? firstError ?? requestError?.message ?? "Could not reset password.";
      setError(attempts == null ? String(errorMessage) : `${errorMessage} ${attempts} attempts remaining.`);
    } finally {
      setLoading(false);
    }
  };

  const continueToPassword = () => {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code sent to your email.");
      return;
    }
    setError(null);
    Keyboard.dismiss();
    setPasswordStep(true);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Back */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/login")}
        >
          <ChevronLeft size={18} color="#6B7280" />
          <Text allowFontScaling={false} style={styles.backText}>Back to sign in</Text>
        </TouchableOpacity>

        <View style={styles.card}>

          {!sent ? (
            <>
              {/* Icon */}
              <View style={styles.iconBox}>
                <Lock size={24} color={C.accentHover} />
              </View>

              <Text allowFontScaling={false} style={styles.title}>
                Forgot your password?
              </Text>

              <Text allowFontScaling={false} style={styles.description}>
                Enter your email and we&apos;ll send you a password reset code.
              </Text>

              {/* Email */}
              <Text allowFontScaling={false} style={styles.label}>
                Email Address
              </Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                allowFontScaling={false}
                style={styles.input}
              />
              {error ? <Text allowFontScaling={false} style={styles.errorText}>{error}</Text> : null}

              {/* Send */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSendReset}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                  <Text allowFontScaling={false} style={styles.primaryButtonText}>Send Reset Code</Text>
                )}
              </TouchableOpacity>
            </>
          ) : resetComplete ? (
            <View style={styles.successContainer}>

              <View style={styles.successIcon}>
                <CheckCircle2 size={30} color="#22C55E" />
              </View>

              <Text allowFontScaling={false} style={styles.title}>
                Password reset successfully
              </Text>

              <Text allowFontScaling={false} style={styles.description}>
                You can now sign in using your new password.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push("/login")}
              >
                <Text allowFontScaling={false} style={styles.primaryButtonText}>
                  Back to Sign In
                </Text>
              </TouchableOpacity>

            </View>
          ) : !passwordStep ? (
            <>
              <View style={styles.iconBox}>
                <Lock size={24} color={C.accentHover} />
              </View>

              <Text allowFontScaling={false} style={styles.title}>Enter reset code</Text>
              <Text allowFontScaling={false} style={styles.description}>
                Enter the 6-digit code sent to {email}. Check Spam or Junk if you cannot find it.
              </Text>

              <Text allowFontScaling={false} style={styles.label}>Reset Code</Text>
              <TextInput
                key="reset-code-input"
                value={code}
                onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
                allowFontScaling={false}
                style={[styles.input, styles.codeInput]}
              />

              {error ? <Text allowFontScaling={false} style={styles.errorText}>{error}</Text> : null}
              {notice ? <Text allowFontScaling={false} style={styles.noticeText}>{notice}</Text> : null}

              <TouchableOpacity style={styles.primaryButton} onPress={continueToPassword}>
                <Text allowFontScaling={false} style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleSendReset} disabled={loading}>
                {loading ? <ActivityIndicator color={C.accent} /> : (
                  <Text allowFontScaling={false} style={styles.secondaryButtonText}>Resend Code</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.iconBox}>
                <Lock size={24} color={C.accentHover} />
              </View>

              <Text allowFontScaling={false} style={styles.title}>Create new password</Text>
              <Text allowFontScaling={false} style={styles.description}>
                Choose a new password with at least 8 characters.
              </Text>

              <Text allowFontScaling={false} style={styles.label}>New Password</Text>
              <TextInput
                key="new-password-input"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                keyboardType="default"
                textContentType="none"
                autoComplete="off"
                autoCapitalize="none"
                allowFontScaling={false}
                style={styles.input}
              />

              <Text allowFontScaling={false} style={styles.label}>Confirm New Password</Text>
              <TextInput
                key="confirm-new-password-input"
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                placeholder="Enter the password again"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                keyboardType="default"
                textContentType="none"
                autoComplete="off"
                autoCapitalize="none"
                allowFontScaling={false}
                style={styles.input}
              />

              {error ? <Text allowFontScaling={false} style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.primaryButton} onPress={handleResetPassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                  <Text allowFontScaling={false} style={styles.primaryButtonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => { setPasswordStep(false); setError(null); }} disabled={loading}>
                <Text allowFontScaling={false} style={styles.secondaryButtonText}>Back to Code</Text>
              </TouchableOpacity>
            </>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F6",
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
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
    lineHeight: 19,
    fontWeight: "400",
    letterSpacing: 0,
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
    lineHeight: 30,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: "#111827",
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: 0,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 24,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0,
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
    fontWeight: "400",
    letterSpacing: 0,
    color: "#111827",
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },

  codeInput: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 5,
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
    lineHeight: 19,
    fontWeight: "600",
    letterSpacing: 0,
  },

  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    marginTop: 8,
  },

  secondaryButtonText: {
    color: C.accent,
    fontSize: 13,
    fontWeight: "600",
  },

  errorText: {
    color: "#DC2626",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "400",
    letterSpacing: 0,
    marginTop: -8,
    marginBottom: 14,
  },

  noticeText: {
    color: "#15803D",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    marginTop: -8,
    marginBottom: 14,
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
