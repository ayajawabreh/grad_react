import { ComponentType, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

import { C, F } from "../constants/tokens";

type BtnProps = Omit<PressableProps, "children" | "style"> & {
  children: ReactNode;
  onClick?: () => void;
  onPress?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline" | "danger";
  v?: "primary" | "secondary" | "outline" | "danger";
  loading?: boolean;
  icon?: ComponentType<{ size?: number; color?: string }>;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Btn({
  children,
  onClick,
  onPress,
  size = "md",
  variant = "primary",
  v,
  loading = false,
  icon: Icon,
  disabled,
  style,
  textStyle,
  ...props
}: BtnProps) {
  const isDisabled = disabled || loading;
  const appearance = v ?? variant;
  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      onPress={onPress ?? onClick}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[appearance],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={appearance === "primary" ? C.surface : C.accentHover}
        />
      ) : typeof children === "string" || typeof children === "number" ? (
        <>
          {Icon && (
            <Icon
              size={16}
              color={appearance === "primary" ? C.surface : appearance === "danger" ? C.error : C.text}
            />
          )}
          <Text
            style={[
              styles.text,
              appearance === "primary" ? styles.primaryText : styles.outlineText,
              appearance === "danger" && styles.dangerText,
              textStyle,
            ]}
          >
            {children}
          </Text>
        </>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 10, alignItems: "center", justifyContent: "center", flexDirection: "row", borderWidth: 1, gap: 7 },
  sm: { minHeight: 34, paddingHorizontal: 11 },
  md: { minHeight: 42, paddingHorizontal: 15 },
  lg: { minHeight: 50, paddingHorizontal: 19 },
  primary: { backgroundColor: C.accent, borderColor: C.accent },
  outline: { backgroundColor: C.surface, borderColor: C.border },
  secondary: { backgroundColor: C.accentLight, borderColor: C.accentLight },
  danger: { backgroundColor: C.errorBg, borderColor: C.error },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.55 },
  text: { fontFamily: F, fontSize: 13, fontWeight: "700" },
  primaryText: { color: C.surface },
  outlineText: { color: C.text },
  dangerText: { color: C.error },
});
