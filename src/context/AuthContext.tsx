import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Role } from "../types";
import { API } from "../imports/api";
import { SYNC_EVENT_NAME, type SyncEventDetail } from "../sync/syncEvents";

interface Company {
  id: number;
  name: string;
  status?: "approved" | "pending";
  is_verified?: boolean;
}

interface User {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string;
  company?: Company;
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (userData: User, r: Role, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => {
    const savedRole = localStorage.getItem("cb_role");
    return savedRole ? (savedRole as Role) : null;
  });

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("cb_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (userData: User, r: Role, token: string) => {
    localStorage.setItem("cb_role", r);
    localStorage.setItem("cb_token", token);
    localStorage.setItem("cb_user", JSON.stringify(userData));

    setRole(r);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("cb_role");
    localStorage.removeItem("cb_token");
    localStorage.removeItem("cb_user");

    setRole(null);
    setUser(null);
  };

  useEffect(() => {
    const refreshSharedUser = (event: Event) => {
      const detail = (event as CustomEvent<SyncEventDetail>).detail;
      const isProfileUpdate = detail?.events?.some((item) =>
        ["student", "company", "admin"].includes(item.resource?.toLowerCase()) &&
        item.action?.toLowerCase() === "profile_updated"
      );
      if (!isProfileUpdate) return;

      void API.get("/user").then(({ data }) => {
        const freshUser = data?.data ?? data?.user ?? data;
        if (!freshUser?.id && !freshUser?.email) return;
        setUser((current) => {
          const next = { ...current, ...freshUser } as User;
          localStorage.setItem("cb_user", JSON.stringify(next));
          return next;
        });
      }).catch(() => undefined);
    };

    window.addEventListener(SYNC_EVENT_NAME, refreshSharedUser);
    return () => window.removeEventListener(SYNC_EVENT_NAME, refreshSharedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: Boolean(role),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
