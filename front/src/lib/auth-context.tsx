import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, tokenStorage } from "./api";

type AuthUser = {
  id: string;
  email: string;
  rol: string;
  status: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
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
        const data = await apiRequest<{ user: AuthUser }>("/auth/me", { token: stored });
        setToken(stored);
        setUser(data.user);
      } catch {
        tokenStorage.clear();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      login: async (email, password) => {
        const data = await apiRequest<{ token: string; user: AuthUser }>("/auth/login", {
          method: "POST",
          body: { email, password },
          token: null,
        });
        tokenStorage.set(data.token);
        setToken(data.token);
        setUser(data.user);
      },
      logout: async () => {
        if (token) {
          await apiRequest("/auth/logout", { method: "POST", token }).catch(() => undefined);
        }
        tokenStorage.clear();
        setToken(null);
        setUser(null);
      },
    }),
    [isLoading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
