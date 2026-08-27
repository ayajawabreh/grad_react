import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Role = "student" | "company";

const API_URL = "http://10.0.0.8:8000/api";

const COLORS = {
  bg: "#F8F8F6",
  surface: "#FFFFFF",
  text: "#181B1F",
  textSec: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  divider: "#F1F2F4",
  accent: "#C8A46A",
  success: "#C8A46A",
  error: "#EF4444",
};

export default function Register() {
  const [role, setRole] = useState<Role>("student");

  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleRegister = async () => {
    setNotification(null);

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setNotification({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    if (role === "student" && !university.trim()) {
      setNotification({
        type: "error",
        message: "Please enter your university name.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setNotification({
        type: "error",
        message: "Passwords do not match.",
      });
      return;
    }

    if (password.length < 8) {
      setNotification({
        type: "error",
        message: "Password must be at least 8 characters.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          university:
            role === "student" ? university.trim() : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed. Please try again."
        );
      }

      setNotification({
        type: "success",
        message: "Account created successfully! Redirecting...",
      });

      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 1500);
    } catch (err: any) {
      setNotification({
        type: "error",
        message:
          err?.message || "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={COLORS.textSec}
          />

          <Text style={styles.backText}>Back to home</Text>
        </Pressable>

        <Text style={styles.title}>
          Create your{"\n"}
          <Text style={styles.titleAccent}>free account</Text>
        </Text>

        <Text style={styles.subtitle}>
          Join 50,000+ graduates building their careers on CareerBridge.
        </Text>

        <View style={styles.roles}>
          <Pressable
            onPress={() => {
              setRole("student");
              setNotification(null);
            }}
            style={[
              styles.roleButton,
              role === "student" && styles.studentSelected,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={
                role === "student"
                  ? COLORS.accent
                  : COLORS.textSec
              }
            />

            <Text
              style={[
                styles.roleText,
                role === "student" && styles.studentText,
              ]}
            >
              Student
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setRole("company");
              setNotification(null);
            }}
            style={[
              styles.roleButton,
              role === "company" && styles.companySelected,
            ]}
          >
            <Ionicons
              name="business-outline"
              size={20}
              color={
                role === "company"
                  ? COLORS.accent
                  : COLORS.textSec
              }
            />

            <Text
              style={[
                styles.roleText,
                role === "company" && styles.companyText,
              ]}
            >
              Company
            </Text>
          </Pressable>
        </View>

        <View style={styles.benefits}>
          {(role === "student"
            ? [
                "Job listings",
                "AI matching",
                "Resume builder",
                "Application tracking",
              ]
            : [
                "Post jobs",
                "AI ranking",
                "Hiring pipeline",
                "Interviews",
              ]
          ).map((item) => (
            <View key={item} style={styles.benefit}>
              <Ionicons
                name="checkmark"
                size={16}
                color={COLORS.accent}
              />

              <Text style={styles.benefitText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {role === "student"
              ? "Student Registration"
              : "Company Registration"}
          </Text>

          {notification && (
            <View
              style={[
                styles.notification,
                notification.type === "success"
                  ? styles.successNotification
                  : styles.errorNotification,
              ]}
            >
              <Ionicons
                name={
                  notification.type === "success"
                    ? "checkmark-circle-outline"
                    : "alert-circle-outline"
                }
                size={20}
                color={
                  notification.type === "success"
                    ? COLORS.success
                    : COLORS.error
                }
              />

              <Text
                style={[
                  styles.notificationText,
                  {
                    color:
                      notification.type === "success"
                        ? COLORS.success
                        : COLORS.error,
                  },
                ]}
              >
                {notification.message}
              </Text>
            </View>
          )}

          <Input
            icon="person-outline"
            placeholder={
              role === "student" ? "Full Name" : "Company Name"
            }
            value={name}
            onChangeText={setName}
          />

          {role === "student" && (
            <Input
              icon="school-outline"
              placeholder="University Name"
              value={university}
              onChangeText={setUniversity}
            />
          )}

          <Input
            icon="mail-outline"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightIcon={
              showPassword
                ? "eye-off-outline"
                : "eye-outline"
            }
            onRightPress={() => setShowPassword(!showPassword)}
          />

          <Input
            icon="lock-closed-outline"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            rightIcon={
              showConfirmPassword
                ? "eye-off-outline"
                : "eye-outline"
            }
            onRightPress={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
          />

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            style={[
              styles.submitButton,
              loading && styles.disabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                Create Account
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>
            Already have an account?
          </Text>

          <Pressable
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.loginLink}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Input({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  rightIcon,
  onRightPress,
  keyboardType,
  autoCapitalize,
}: {
  icon: any;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  rightIcon?: any;
  onRightPress?: () => void;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.inputContainer}>
      <Ionicons
        name={icon}
        size={19}
        color={COLORS.textMuted}
      />

      <TextInput
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.input}
      />

      {rightIcon && (
        <Pressable onPress={onRightPress}>
          <Ionicons
            name={rightIcon}
            size={20}
            color={COLORS.textSec}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  content: {
    padding: 24,
    paddingTop: 55,
    paddingBottom: 40,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 35,
  },

  backText: {
    color: COLORS.textSec,
    fontSize: 13,
  },

  title: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.text,
    lineHeight: 42,
  },

  titleAccent: {
    color: COLORS.accent,
  },

  subtitle: {
    color: COLORS.textSec,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },

  roles: {
    flexDirection: "row",
    gap: 10,
    marginTop: 28,
  },

  roleButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  studentSelected: {
    borderColor: COLORS.accent,
    backgroundColor: "#C8A46A10",
  },

  companySelected: {
    borderColor: COLORS.accent,
    backgroundColor: "#C8A46A10",
  },

  roleText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },

  studentText: {
    color: COLORS.accent,
  },

  companyText: {
    color: COLORS.accent,
  },

  benefits: {
    marginTop: 22,
    gap: 9,
    marginBottom: 28,
  },

  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  benefitText: {
    color: COLORS.textSec,
    fontSize: 13,
  },

  card: {
    padding: 22,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 18,
  },

  notification: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },

  successNotification: {
    backgroundColor: "#C8A46A15",
  },

  errorNotification: {
    backgroundColor: "#EF444415",
  },

  notificationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },

  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },

  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },

  submitButton: {
    height: 52,
    borderRadius: 13,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  disabled: {
    opacity: 0.6,
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 25,
  },

  loginText: {
    color: COLORS.textSec,
    fontSize: 13,
  },

  loginLink: {
    color: COLORS.accent,
    fontWeight: "700",
    fontSize: 13,
  },
});