import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/context/AuthContext";
import { BeautifulAlertProvider } from "@/components/BeautifulAlertProvider";
import { SyncProvider } from "@/context/SyncContext";
import { SavedJobsProvider } from "@/context/SavedJobsContext";
import { ApplicationsProvider } from "@/context/ApplicationsContext";
import { ProfileSyncBridge } from "@/context/ProfileSyncBridge";

export const unstable_settings = {
  anchor: "(student)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
      <SyncProvider>
      <ProfileSyncBridge />
      <SavedJobsProvider>
      <ApplicationsProvider>
      <BeautifulAlertProvider>
      <ThemeProvider
        value={
          colorScheme === "dark"
            ? DarkTheme
            : DefaultTheme
        }
      >
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />

          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="(student)"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen name="company" options={{ headerShown: false }} />

          <Stack.Screen name="admin" options={{ headerShown: false }} />

          <Stack.Screen
            name="modal"
            options={{
              presentation: "modal",
              title: "Modal",
            }}
          />
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
      </BeautifulAlertProvider>
      </ApplicationsProvider>
      </SavedJobsProvider>
      </SyncProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
