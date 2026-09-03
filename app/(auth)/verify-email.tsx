import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { postPublicJson } from "../../imports/api";

function verificationErrorMessage(error: any, fallback: string) {
  const body = error?.body ?? error?.response?.data;
  const errors = body?.errors;
  const firstValidationError = errors && typeof errors === "object"
    ? Object.values(errors).flat().find(Boolean)
    : null;

  return body?.message || (firstValidationError ? String(firstValidationError) : null) || error?.message || fallback;
}

export default function VerifyEmail() {
  const params = useLocalSearchParams<{ userId?: string }>();
  const [userId, setUserId] = useState(params.userId || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const autoResendStarted = useRef(false);

  const lockExpiresAt = lockedUntil ? Date.parse(lockedUntil) : 0;
  const lockSecondsRemaining = Math.max(0, Math.ceil((lockExpiresAt - now) / 1000));
  const isLocked = lockSecondsRemaining > 0;
  const lockCountdown = `${Math.floor(lockSecondsRemaining / 60)}:${String(lockSecondsRemaining % 60).padStart(2, "0")}`;

  const handleRequestError = useCallback((requestError: any, fallback: string) => {
    const status = requestError?.status ?? requestError?.response?.status;
    const body = requestError?.body ?? requestError?.response?.data;

    console.log("VERIFICATION STATUS:", status);
    console.log("VERIFICATION RESPONSE:", body);
    setError(verificationErrorMessage(requestError, fallback));

    const remaining = Number(body?.attempts_remaining);
    setAttemptsRemaining(Number.isFinite(remaining) ? remaining : null);

    if (status === 429) {
      const parsedLock = Date.parse(String(body?.locked_until ?? ""));
      setLockedUntil(
        Number.isFinite(parsedLock)
          ? new Date(parsedLock).toISOString()
          : new Date(Date.now() + 10 * 60 * 1000).toISOString()
      );
      setNow(Date.now());
    }
  }, []);

  const sendVerificationCode = useCallback(async (targetUserId: string) => {
    setError(null);
    setMessage(null);
    setAttemptsRemaining(null);
    setResending(true);
    try {
      const data = await postPublicJson<{ message?: string }>("/resend-verification", {
        user_id: Number(targetUserId),
      });
      setMessage(data.message || "A new verification code was sent.");
    } catch (requestError: any) {
      handleRequestError(requestError, "Failed to send verification code.");
    } finally {
      setResending(false);
    }
  }, [handleRequestError]);

  useEffect(() => {
    if (!lockedUntil) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  useEffect(() => {
    if (lockedUntil && !isLocked) setLockedUntil(null);
  }, [isLocked, lockedUntil]);

  useEffect(() => {
    if (!userId) {
      AsyncStorage.getItem("pending_verification_user_id").then((stored) => stored && setUserId(stored));
      return;
    }

    if (!autoResendStarted.current) {
      autoResendStarted.current = true;
      void sendVerificationCode(userId);
    }
  }, [sendVerificationCode, userId]);

  const verify = async () => {
    if (!userId) return setError("Missing registration user ID. Please register again.");
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit verification code.");
    setError(null); setMessage(null); setAttemptsRemaining(null); setLoading(true);
    try {
      const data = await postPublicJson<{ message?: string }>("/verify-email", { user_id: Number(userId), code });
      await AsyncStorage.removeItem("pending_verification_user_id");
      setMessage(data.message || "Email verified successfully.");
      setTimeout(() => router.replace("/(auth)/login"), 1000);
    } catch (requestError: any) {
      handleRequestError(requestError, "Verification failed.");
    } finally { setLoading(false); }
  };

  const resend = async () => {
    if (!userId) return setError("Missing registration user ID. Please register again.");
    await sendVerificationCode(userId);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.description}>Enter the 6-digit code sent to your email. Check Spam or Junk if it is not in your inbox.</Text>
        <TextInput value={code} onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} placeholder="123456" style={styles.input} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {attemptsRemaining !== null ? (
          <Text style={styles.attempts}>Attempts remaining: {attemptsRemaining}</Text>
        ) : null}
        {isLocked ? (
          <Text style={styles.locked}>Verification is locked. Try again in {lockCountdown}.</Text>
        ) : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}
        <Pressable style={[styles.primary, (loading || isLocked) && styles.disabled]} onPress={verify} disabled={loading || resending || isLocked}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{isLocked ? `Try again in ${lockCountdown}` : "Verify Email"}</Text>}
        </Pressable>
        <Pressable style={[styles.secondary, isLocked && styles.disabled]} onPress={resend} disabled={loading || resending || isLocked}>
          {resending ? <ActivityIndicator color="#9B7B48" /> : <Text style={styles.secondaryText}>{isLocked ? "Resend locked" : "Resend code"}</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#F8F8F6" },
  card: { padding: 26, borderRadius: 22, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff" },
  title: { fontSize: 25, fontWeight: "800", color: "#181B1F", marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 21, color: "#6B7280", marginBottom: 22 },
  input: { height: 54, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, paddingHorizontal: 16, fontSize: 22, letterSpacing: 7, textAlign: "center", color: "#181B1F" },
  error: { color: "#DC2626", fontSize: 12, marginTop: 10 },
  attempts: { color: "#B45309", fontSize: 12, marginTop: 6 },
  locked: { color: "#B45309", fontSize: 12, lineHeight: 18, marginTop: 6 },
  success: { color: "#15803D", fontSize: 12, marginTop: 10 },
  primary: { height: 52, marginTop: 18, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#C8A46A" },
  disabled: { opacity: 0.65 },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  secondary: { height: 48, marginTop: 8, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: "#9B7B48", fontSize: 14, fontWeight: "700" },
});
