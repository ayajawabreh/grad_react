import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect } from "react";
import { AppState } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { SyncResource, useSyncRefresh } from "@/context/SyncContext";
import { API } from "@/imports/api";

export function ProfileSyncBridge() {
  const { isAuthenticated, role, user, setUser } = useAuth();

  const refreshAccount = useCallback(async () => {
    if (!isAuthenticated || !role) return;
    try {
      const profileEndpoint = role === "student"
        ? "/student/profile"
        : role === "company"
          ? "/company/profile"
          : "/admin/settings";
      const [userResponse, profileResponse] = await Promise.all([
        API.get("/user"),
        API.get(profileEndpoint),
      ]);
      const userPayload = userResponse.data?.data?.user
        ?? userResponse.data?.user
        ?? userResponse.data?.data
        ?? userResponse.data
        ?? {};
      const payload = profileResponse.data?.data ?? profileResponse.data ?? {};
      const profile = payload.account ?? payload.student ?? payload.company ?? payload.profile ?? payload;
      const cachedRoleProfile = (user?.[role] ?? {}) as Record<string, unknown>;
      if (__DEV__ && role === "student") {
        console.log("[Profile Sync] GET /api/student/profile response:", profileResponse.data);
        console.log("[Profile Sync] phone before:", user?.phone ?? cachedRoleProfile.phone);
      }
      const roleProfile = role === "admin" ? { admin: profile } : { [role]: profile };
      const nextUser = {
        ...user,
        ...userPayload,
        ...(profile.user ?? {}),
        ...roleProfile,
        name: userPayload.name ?? profile.name ?? profile.company_name ?? user?.name,
        email: userPayload.email ?? profile.email ?? profile.contact_email ?? profile.user?.email ?? user?.email,
        avatar: userPayload.avatar ?? profile.avatar ?? profile.photo ?? profile.logo ?? user?.avatar,
        phone: profile.phone ?? profile.phone_number ?? userPayload.phone ?? user?.phone,
        location: profile.location ?? userPayload.location ?? user?.location,
        id: userPayload.id ?? user?.id ?? profile.user?.id,
        role: user?.role ?? role,
      };
      setUser(nextUser);
      await AsyncStorage.setItem("user", JSON.stringify(nextUser));
      if (__DEV__ && role === "student") {
        console.log("[Profile Sync] phone after:", nextUser.phone ?? nextUser.student?.phone);
      }
    } catch (error: any) {
      // Network loss is expected during background sync. Keep the current
      // provider state and let the central listener retry after reconnection.
      if (__DEV__ && error?.response?.status && error.response.status !== 401) {
        console.warn("[Profile Sync] refetch failed:", error.message);
      }
    }
  }, [isAuthenticated, role, setUser, user]);

  useSyncRefresh(
    role === "student"
      ? (["student", "resume"] as SyncResource[])
      : ((role ?? "student") as SyncResource),
    refreshAccount,
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && isAuthenticated) void refreshAccount();
    });
    return () => subscription.remove();
  }, [isAuthenticated, refreshAccount]);

  return null;
}
