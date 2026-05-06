import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, tokenStorage } from "./api";

type AuthUser = {
  id: string;
  email: string;
  rol: string;
  status: string;
};

type AuthResponse = {
  user: AuthUser;
  permissions?: string[];
};

type AuthContextValue = {
  user: AuthUser | null;
  permissions: string[];
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  can: (permission: string) => boolean;
  canAny: (required: string[]) => boolean;
  canAll: (required: string[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(tokenStorage.get());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const stored = tokenStorage.get();
      if (!stored) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await apiRequest<AuthResponse>("/auth/me", { token: stored });
        setToken(stored);
        setUser(data.user);
        setPermissions(data.permissions || []);
      } catch {
        tokenStorage.clear();
        setToken(null);
        setUser(null);
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      permissions,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      can: (permission) => permissions.includes(permission),
      canAny: (required) => required.some((permission) => permissions.includes(permission)),
      canAll: (required) => required.every((permission) => permissions.includes(permission)),
      login: async (email, password) => {
        const data = await apiRequest<{ token: string; user: AuthUser; permissions?: string[] }>("/auth/login", {
          method: "POST",
          body: { email, password },
          token: null,
        });
        tokenStorage.set(data.token);
        setToken(data.token);
        setUser(data.user);
        setPermissions(data.permissions || []);
      },
      logout: async () => {
        if (token) {
          await apiRequest("/auth/logout", { method: "POST", token }).catch(() => undefined);
        }
        tokenStorage.clear();
        setToken(null);
        setUser(null);
        setPermissions([]);
      },
    }),
    [isLoading, permissions, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
