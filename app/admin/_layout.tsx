import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C } from "../../constants/tokens";
import { AppDrawerContent } from "../../components/AppDrawerContent";

type DrawerIconProps = {
  color: string;
  size: number;
};

const screens = [
  ["Dashboard", "Dashboard", "grid-outline"],
  ["Students", "Students", "people-outline"],
  ["Companies", "Companies", "business-outline"],
  ["Jobs", "Jobs", "briefcase-outline"],
  ["Categories", "Categories", "pricetags-outline"],
  ["Skills", "Skills", "sparkles-outline"],
  ["Analytics", "Analytics", "analytics-outline"],
  ["Reports", "Abuse Reports", "warning-outline"],
  ["SystemLogs", "System Logs", "pulse-outline"],
  ["Notifications", "Notifications", "notifications-outline"],
  ["Settings", "Settings", "settings-outline"],
] as const;

export default function AdminLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: C.surface },
        headerTintColor: C.text,
        headerTitleStyle: { fontSize: 17, fontWeight: "700" },
        drawerActiveTintColor: C.text,
        drawerInactiveTintColor: C.textSec,
        drawerActiveBackgroundColor: C.accentLight,
        drawerLabelStyle: { fontSize: 14, fontWeight: "600" },
        drawerStyle: { backgroundColor: C.surface, paddingTop: insets.top },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      {screens.map(([name, title, icon]) => (
        <Drawer.Screen
          key={name}
          name={name}
          options={{
            title,
            drawerIcon: ({ color, size }: DrawerIconProps) => (
              <Ionicons name={icon} color={color} size={size} />
            ),
          }}
        />
      ))}
      <Drawer.Screen
        name="JobDetails"
        options={{ title: "Job Details", headerShown: false, drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="JobApplicants"
        options={{ title: "Job Applicants", headerShown: false, drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="Applications"
        options={{ title: "Applications", drawerItemStyle: { display: "none" } }}
      />
    </Drawer>
  );
}
