import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthUser = Record<string, unknown> & {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  role: string | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem("user"),
        AsyncStorage.getItem("cb_token"),
      ]);
      setUser(storedUser ? JSON.parse(storedUser) : null);
      setToken(storedToken);
    } catch {
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([
      "cb_token",
      "token",
      "user",
      "user_role",
    ]);
    setUser(null);
    setToken(null);
    router.replace("/(auth)/login");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ? String(user.role).toLowerCase() : null,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      setUser,
      logout,
      signOut: logout,
      refreshSession,
    }),
    [loading, logout, refreshSession, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return value;
}
