import { PropsWithChildren, useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertButton,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react-native";

import { C, F } from "../constants/tokens";

type AlertKind = "success" | "error" | "warning" | "info";

type AlertState = {
  title: string;
  message?: string;
  buttons: AlertButton[];
  kind: AlertKind;
};

const SUCCESS_WORDS = /success|saved|updated|created|sent|uploaded|completed|done/i;
const ERROR_WORDS = /error|failed|could not|unable|invalid|missing|wrong|denied/i;
const WARNING_WORDS = /warning|delete|remove|reject|suspend|sign out|logout|confirm/i;

function getKind(title: string, message = ""): AlertKind {
  const content = `${title} ${message}`;
  if (SUCCESS_WORDS.test(content)) return "success";
  if (ERROR_WORDS.test(content)) return "error";
  if (WARNING_WORDS.test(content)) return "warning";
  return "info";
}

const palette = {
  success: { color: C.success, background: C.successBg, Icon: CheckCircle2 },
  error: { color: C.error, background: C.errorBg, Icon: AlertCircle },
  warning: { color: "#D97706", background: "#FEF3C7", Icon: AlertTriangle },
  info: { color: C.accent, background: C.accentLight, Icon: Info },
};

export function BeautifulAlertProvider({ children }: PropsWithChildren) {
  const [alert, setAlert] = useState<AlertState | null>(null);
  const originalAlert = useRef(Alert.alert);

  useEffect(() => {
    const showAlert = (
      title: string,
      message?: string,
      buttons?: AlertButton[],
    ) => {
      setAlert({
        title: title || "Notice",
        message,
        buttons: buttons?.length ? buttons : [{ text: "OK" }],
        kind: getKind(title, message),
      });
    };

    (Alert as any).alert = showAlert;

    return () => {
      (Alert as any).alert = originalAlert.current;
    };
  }, []);

  const close = () => setAlert(null);

  const pressButton = (button: AlertButton) => {
    close();
    button.onPress?.();
  };

  const theme = palette[alert?.kind ?? "info"];
  const Icon = theme.Icon;

  return (
    <>
      {children}

      <Modal
        visible={Boolean(alert)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close alert"
              onPress={close}
              style={({ pressed }) => [
                styles.close,
                pressed && styles.pressed,
              ]}
            >
              <X size={18} color={C.textSec} />
            </Pressable>

            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.background },
              ]}
            >
              <Icon size={27} color={theme.color} strokeWidth={2.2} />
            </View>

            <Text style={styles.title}>{alert?.title}</Text>
            {Boolean(alert?.message) && (
              <Text style={styles.message}>{alert?.message}</Text>
            )}

            <View style={styles.actions}>
              {alert?.buttons.map((button, index) => {
                const destructive = button.style === "destructive";
                const cancel = button.style === "cancel";
                const primary = !cancel && index === alert.buttons.length - 1;
                const buttonColor = destructive ? C.error : C.accent;

                return (
                  <Pressable
                    key={`${button.text ?? "button"}-${index}`}
                    onPress={() => pressButton(button)}
                    style={({ pressed }) => [
                      styles.button,
                      (primary || destructive) && {
                        backgroundColor: buttonColor,
                        borderColor: buttonColor,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        (primary || destructive) && styles.primaryButtonText,
                      ]}
                    >
                      {button.text || "OK"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.52)",
  },
  card: {
    width: "100%",
    maxWidth: 390,
    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  close: {
    position: "absolute",
    top: 13,
    right: 13,
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },
  iconContainer: {
    width: 58,
    height: 58,
    marginBottom: 15,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    paddingHorizontal: 28,
    fontFamily: F,
    fontSize: 18,
    fontWeight: "900",
    color: C.text,
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    fontFamily: F,
    fontSize: 12,
    lineHeight: 19,
    color: C.textSec,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    marginTop: 21,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 9,
  },
  button: {
    minWidth: 82,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: F,
    fontSize: 12,
    fontWeight: "800",
    color: C.text,
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.72,
  },
});
