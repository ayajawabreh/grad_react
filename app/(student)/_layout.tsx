import { Drawer } from "expo-router/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppDrawerContent } from "../../components/AppDrawerContent";

const COLORS = {
  accent: "#F5EDD8",
  surface: "#FFFFFF",
  text: "#181B1F",
};

type DrawerIconProps = {
  color: string;
  size: number;
};

export default function StudentLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: "700",
        },

        drawerActiveTintColor: COLORS.text,
        drawerInactiveTintColor: "#6B7280",
        drawerActiveBackgroundColor: COLORS.accent,

        drawerLabelStyle: {
          fontSize: 14,
          fontWeight: "600",
        },

        drawerStyle: {
          paddingTop: insets.top,
        },

      }}
    >
      <Drawer.Screen
        name="Dashboard"
        options={{
          title: "Dashboard",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="Profile"
        options={{
          title: "Profile",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="MyResume"
        options={{
          title: "Resume Builder",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons
              name="document-text-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="JobDiscovery"
        options={{
          title: "Browse Jobs",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons name="search-outline" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="SavedJobs"
        options={{
          title: "Saved Jobs",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons name="bookmark-outline" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="Recommended"
        options={{
          title: "Suggested Jobs",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons name="sparkles-outline" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="Applications"
        options={{
          title: "Applications",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons name="clipboard-outline" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="Messages"
        options={{
          title: "Messages",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons name="chatbubble-outline" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="AIAssistant"
        options={{
          title: "AI Assistant",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons name="sparkles" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="Notifications"
        options={{
          title: "Notifications",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons
              name="notifications-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="Settings"
        options={{
          title: "Settings",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="EditProfileModal"
        options={{
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="Resume"
        options={{
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="ResumeUpload"
        options={{
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="ResumeView"
        options={{
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="JobDetails"
        options={{
          drawerItemStyle: {
            display: "none",
          },
        }}
      />
    </Drawer>
  );
}
