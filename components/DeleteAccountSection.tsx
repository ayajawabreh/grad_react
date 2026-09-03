import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Trash2, X } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { C, F } from "@/constants/tokens";
import { useAuth } from "@/context/AuthContext";
import { API } from "@/imports/api";

export function DeleteAccountSection({ isAdmin = false }: { isAdmin?: boolean }) {
  const { refreshSession } = useAuth();
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const close = () => {
    if (deleting) return;
    setVisible(false);
    setPassword("");
  };

  const deleteAccount = async () => {
    if (!password.trim()) {
      Alert.alert("Password required", "Please enter your password.");
      return;
    }

    try {
      setDeleting(true);
      const response = await API.delete("/settings/account", {
        data: { password },
      });

      await AsyncStorage.multiRemove([
        "auth_token",
        "cb_token",
        "token",
        "user",
        "user_role",
      ]);
      await refreshSession();
      setVisible(false);

      Alert.alert(
        "Account Deleted",
        response.data?.message ?? "Account deleted successfully.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
      );
    } catch (error: any) {
      const data = error?.response?.data;
      const firstValidationError = data?.errors
        ? Object.values(data.errors).flat()[0]
        : null;

      Alert.alert(
        "Could not delete account",
        String(firstValidationError ?? data?.message ?? "Failed to delete account."),
      );
    } finally {
      setDeleting(false);
      setPassword("");
    }
  };

  return (
    <>
      <View style={styles.section}>
        <View style={styles.titleRow}>
          <Trash2 size={18} color="#DC2626" />
          <Text style={styles.title}>Danger Zone</Text>
        </View>
        <Text style={styles.actionTitle}>Delete Account</Text>
        <Text style={styles.description}>
          Permanently delete your account and all associated data.
        </Text>
        {isAdmin ? (
          <Text style={styles.adminWarning}>
            Deleting this admin account may remove your access to the administration panel.
          </Text>
        ) : null}
        <Pressable style={styles.deleteButton} onPress={() => setVisible(true)}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </Pressable>
      </View>

      <Modal transparent visible={visible} animationType="fade" onRequestClose={close}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modal}>
            <Pressable style={styles.closeButton} onPress={close} disabled={deleting}>
              <X size={20} color={C.textSec} />
            </Pressable>
            <Text style={styles.modalTitle}>Delete Account?</Text>
            <Text style={styles.modalText}>
              This action is permanent and cannot be undone.{"\n"}
              Your profile and associated data will be deleted.
            </Text>
            {isAdmin ? (
              <Text style={styles.adminWarning}>
                Deleting this admin account may remove your access to the administration panel.
              </Text>
            ) : null}
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              editable={!deleting}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Enter your password"
              placeholderTextColor={C.textMuted}
              style={styles.input}
            />
            <View style={styles.actions}>
              <Pressable style={styles.cancelButton} onPress={close} disabled={deleting}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, deleting && styles.disabled]}
                onPress={() => void deleteAccount()}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmText}>Delete Permanently</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24, padding: 16, borderWidth: 1, borderColor: "#FECACA", borderRadius: 14, backgroundColor: "#FEF2F2" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  title: { fontFamily: F, fontSize: 16, fontWeight: "800", color: "#DC2626" },
  actionTitle: { fontFamily: F, fontSize: 14, fontWeight: "700", color: C.text },
  description: { marginTop: 5, fontFamily: F, fontSize: 12, lineHeight: 18, color: C.textSec },
  adminWarning: { marginTop: 9, fontFamily: F, fontSize: 12, lineHeight: 18, fontWeight: "600", color: "#991B1B" },
  deleteButton: { marginTop: 15, backgroundColor: "#DC2626", borderRadius: 12, paddingVertical: 14 },
  deleteButtonText: { color: "#FFFFFF", fontFamily: F, fontWeight: "700", textAlign: "center" },
  overlay: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15,23,42,0.55)" },
  modal: { width: "100%", maxWidth: 440, padding: 20, borderRadius: 18, backgroundColor: "#FFFFFF" },
  closeButton: { position: "absolute", top: 10, right: 10, width: 40, height: 40, alignItems: "center", justifyContent: "center", zIndex: 1 },
  modalTitle: { paddingRight: 40, fontFamily: F, fontSize: 20, fontWeight: "800", color: C.text },
  modalText: { marginTop: 10, fontFamily: F, fontSize: 13, lineHeight: 20, color: C.textSec },
  label: { marginTop: 18, marginBottom: 7, fontFamily: F, fontSize: 12, fontWeight: "700", color: C.text },
  input: { minHeight: 48, paddingHorizontal: 13, borderWidth: 1, borderColor: C.border, borderRadius: 11, fontFamily: F, fontSize: 14, color: C.text },
  actions: { marginTop: 18, flexDirection: "row", gap: 10 },
  cancelButton: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border, borderRadius: 12 },
  cancelText: { fontFamily: F, fontSize: 13, fontWeight: "700", color: C.text },
  confirmButton: { flex: 1.5, minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#DC2626" },
  confirmText: { fontFamily: F, fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  disabled: { opacity: 0.6 },
});
