import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from "@react-navigation/drawer";
import { StyleSheet, View } from "react-native";

import { useAuth } from "../context/AuthContext";

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const { logout } = useAuth();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.scrollContent}
    >
      <DrawerItemList {...props} />
      <View style={styles.footer}>
        <DrawerItem
          label="Sign Out"
          labelStyle={styles.label}
          icon={({ size }) => (
            <Ionicons name="log-out-outline" size={size} color="#C0392B" />
          )}
          onPress={() => void logout()}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 24,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#E6E2DA",
    marginTop: 8,
    paddingVertical: 6,
  },
  label: {
    color: "#C0392B",
    fontSize: 14,
    fontWeight: "600",
  },
});
