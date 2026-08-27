import { Drawer } from "expo-router/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppDrawerContent } from "../../components/AppDrawerContent";

const COLORS = {
  bg: "#F8F8F6",
  surface: "#FFFFFF",
  text: "#181B1F",
  textSec: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  divider: "#F1F2F4",
  accent: "#F5EDD8",
  accentDark: "#C8A46A",
  error: "#EF4444",
};

type DrawerIconProps = {
  color: string;
  size: number;
};

export default function CompanyLayout() {
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

        drawerInactiveTintColor: COLORS.textSec,

        drawerActiveBackgroundColor: COLORS.accent,

        drawerLabelStyle: {
          fontSize: 14,
          fontWeight: "600",
        },

        drawerStyle: {
          backgroundColor: COLORS.surface,
          paddingTop: insets.top,
        },

        sceneStyle: {
          backgroundColor: COLORS.bg,
        },
      }}
    >
      {/* Dashboard */}
      <Drawer.Screen
        name="Dashboard"
        options={{
          title: "Dashboard",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons
              name="grid-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Company Profile */}
      <Drawer.Screen
        name="Profile"
        options={{
          title: "Company Profile",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons
              name="business-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Create Job */}
      <Drawer.Screen
        name="CreateJob"
        options={{
          title: "Create Job",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons
              name="add-circle-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* My Jobs */}
      <Drawer.Screen
        name="ManageJobs"
        options={{
          title: "My Jobs",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons
              name="briefcase-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Applicants */}
      <Drawer.Screen
        name="Applicants"
        options={{
          title: "Applicants",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons
              name="people-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Shortlisted */}
      <Drawer.Screen
        name="Shortlisted"
        options={{
          title: "Shortlisted",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons
              name="bookmark-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Interviews */}
      <Drawer.Screen
        name="Interviews"
        options={{
          title: "Interviews",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons
              name="calendar-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Reports */}
      <Drawer.Screen
        name="Reports"
        options={{
          title: "Reports",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons
              name="bar-chart-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Messages */}
      <Drawer.Screen
        name="Messages"
        options={{
          title: "Messages",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons
              name="chatbubble-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Notifications */}
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

      {/* Settings */}
      <Drawer.Screen
        name="Settings"
        options={{
          title: "Settings",
          drawerIcon: ({ color, size }: DrawerIconProps) => (
            <Ionicons
              name="settings-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Hidden Screens */}

      <Drawer.Screen
        name="RecommendedCandidates"
        options={{
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="CandidateDetails"
        options={{
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="ResumePreview"
        options={{
          headerShown: false,
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="EditJob"
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

      <Drawer.Screen
        name="ScheduleInterviewModal"
        options={{
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      <Drawer.Screen
        name="BulkScheduleModal"
        options={{
          drawerItemStyle: {
            display: "none",
          },
        }}
      />
    </Drawer>
  );
}
