
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../../imports/api";
import { useAuth } from "../../context/AuthContext";

type Role = "student" | "company" | "admin";
const COLORS = {
  bg: "#F8F8F6",
  surface: "#FFFFFF",
  darker: "#111315",
  dark: "#181B1F",
  text: "#181B1F",
  textSec: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  divider: "#F1F2F4",
  accent: "#C8A46A",
  accentLight: "#F5EDD8",
  success: "#22C55E",
  info: "#3B82F6",
  error: "#EF4444",
};
const ROLES = [
  {
    key: "student" as Role,
    title: "Student",
    icon: "person-outline" as const,
    color: COLORS.accent,
  },
  {
    key: "company" as Role,
    title: "Company",
    icon: "business-outline" as const,
    color: COLORS.accent,
  },
  {
    key: "admin" as Role,
    title: "Admin",
    icon: "shield-checkmark-outline" as const,
    color: COLORS.error,
  },
];

export default function Login() {
  const { refreshSession } = useAuth();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      await AsyncStorage.multiRemove(["cb_token", "token"]);

      const response = await API.post("/login", {
        email: email.trim(),
        password,
        role,
      });

      const data = response.data;

      console.log("LOGIN STATUS:", response.status);
      console.log("LOGIN RESPONSE:", data);

      if (!data?.token || !data?.user) {
        throw new Error("Invalid response from server.");
      }

      const fetchedRole = String(
        data.user.role ?? ""
      ).toLowerCase();

      if (fetchedRole !== role) {
        throw new Error(
          `This account is registered as a ${fetchedRole}, not a ${role}.`
        );
      }

      await AsyncStorage.setItem(
        "cb_token",
        String(data.token)
      );

      await AsyncStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      await AsyncStorage.setItem(
        "user_role",
        fetchedRole
      );

      await refreshSession();

      console.log(
        "TOKEN SAVED:",
        await AsyncStorage.getItem("cb_token")
      );

      if (fetchedRole === "student") {
        router.replace("/(student)/Dashboard");
        return;
      }

      if (fetchedRole === "company") {
        router.replace("/company/Dashboard");
        return;
      }

      if (fetchedRole === "admin") {
        router.replace("/admin/Dashboard");
        return;
      }

      throw new Error("Unsupported account role.");
    } catch (err: any) {
      const status = err?.response?.status;

      if (!status || status >= 500) {
        console.error("LOGIN ERROR:", err);
      }

      const message =
        (status === 401
          ? "The email, password, or selected account type is incorrect."
          : err?.response?.data?.message) ||
        err?.response?.data?.error ||
        err?.message ||
        "Something went wrong. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: Role) => {
    setError(null);
    setRole(demoRole);

    setError(
      "Demo access is currently disabled. Please sign in with a real account."
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>CB</Text>
          </View>

          <Text style={styles.logoName}>
            CareerBridge
          </Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>
            Sign in to CareerBridge
          </Text>

          <Text style={styles.subtitle}>
            Select your account type to continue
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          {ROLES.map((item) => {
            const selected = role === item.key;

            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  setRole(item.key);
                  setError(null);
                }}
                style={[
                  styles.roleCard,
                  {
                    borderColor: selected
                      ? item.color
                      : COLORS.border,
                    backgroundColor: selected
                      ? `${item.color}10`
                      : COLORS.surface,
                  },
                ]}
              >
                <View
                  style={[
                    styles.roleIcon,
                    {
                      backgroundColor: selected
                        ? `${item.color}20`
                        : COLORS.divider,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={
                      selected
                        ? item.color
                        : COLORS.textSec
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.roleTitle,
                    {
                      color: selected
                        ? item.color
                        : COLORS.text,
                    },
                  ]}
                >
                  {item.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={COLORS.error}
            />

            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>
            Email Address
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={19}
              color={COLORS.textMuted}
            />

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Password
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={19}
              color={COLORS.textMuted}
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <Pressable
              onPress={() =>
                setShowPassword(!showPassword)
              }
              hitSlop={10}
            >
              <Ionicons
                name={
                  showPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={20}
                color={COLORS.textSec}
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() =>
            router.push(
              "/(auth)/forgot-password"
            )
          }
          style={styles.forgotButton}
        >
          <Text style={styles.forgotText}>
            Forgot password?
          </Text>
        </Pressable>

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={[
            styles.loginButton,
            loading && styles.disabledButton,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>
              Sign in as{" "}
              {
                ROLES.find(
                  (r) => r.key === role
                )?.title
              }
            </Text>
          )}
        </Pressable>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>
            Don&apos;t have an account?
          </Text>

          <Pressable
            onPress={() =>
              router.push(
                "/(auth)/register"
              )
            }
          >
            <Text style={styles.registerLink}>
              Sign up free
            </Text>
          </Pressable>
        </View>

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>
            QUICK DEMO ACCESS
          </Text>

          <View style={styles.demoButtons}>
            {ROLES.map((item) => (
              <Pressable
                key={item.key}
                onPress={() =>
                  handleDemoLogin(item.key)
                }
                style={[
                  styles.demoButton,
                  {
                    backgroundColor: `${item.color}15`,
                    borderColor: `${item.color}30`,
                  },
                ]}
              >
                <Text
                  style={{
                    color: item.color,
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {item.title} →
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 45,
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  logoName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },

  header: {
    marginBottom: 28,
  },

  title: {
    fontSize: 29,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSec,
    lineHeight: 21,
  },

  rolesContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },

  roleCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    gap: 7,
  },

  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  roleTitle: {
    fontSize: 12,
    fontWeight: "700",
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 13,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    marginBottom: 16,
  },

  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: 13,
    fontWeight: "600",
  },

  field: {
    marginBottom: 16,
  },

  label: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },

  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },

  forgotText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "700",
  },

  loginButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginBottom: 25,
  },

  registerText: {
    color: COLORS.textSec,
    fontSize: 13,
  },

  registerLink: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "700",
  },

  demoBox: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.divider,
  },

  demoTitle: {
    color: COLORS.textSec,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 10,
  },

  demoButtons: {
    flexDirection: "row",
    gap: 7,
  },

  demoButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
