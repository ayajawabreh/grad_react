import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Role } from "../types";

interface Company {
  id: number;
  name: string;
  status?: "approved" | "pending";
  is_verified?: boolean;
}

interface User {
  name: string;
  email: string;
  phone?: string;
  location?: string;
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