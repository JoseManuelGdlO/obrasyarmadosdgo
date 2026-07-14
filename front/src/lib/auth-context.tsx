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
  proyectoIds?: string[] | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  permissions: string[];
  /** null = todos los proyectos; array = solo esos IDs */
  proyectoIds: string[] | null;
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
  const [proyectoIds, setProyectoIds] = useState<string[] | null>(null);
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
        setProyectoIds(data.proyectoIds ?? null);
      } catch {
        tokenStorage.clear();
        setToken(null);
        setUser(null);
        setPermissions([]);
        setProyectoIds(null);
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
      proyectoIds,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      can: (permission) => permissions.includes(permission),
      canAny: (required) => required.some((permission) => permissions.includes(permission)),
      canAll: (required) => required.every((permission) => permissions.includes(permission)),
      login: async (email, password) => {
        const data = await apiRequest<{
          token: string;
          user: AuthUser;
          permissions?: string[];
          proyectoIds?: string[] | null;
        }>("/auth/login", {
          method: "POST",
          body: { email, password },
          token: null,
        });
        tokenStorage.set(data.token);
        setToken(data.token);
        setUser(data.user);
        setPermissions(data.permissions || []);
        setProyectoIds(data.proyectoIds ?? null);
      },
      logout: async () => {
        if (token) {
          await apiRequest("/auth/logout", { method: "POST", token }).catch(() => undefined);
        }
        tokenStorage.clear();
        setToken(null);
        setUser(null);
        setPermissions([]);
        setProyectoIds(null);
      },
    }),
    [isLoading, permissions, proyectoIds, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};

/** Filtra una lista de proyectos por el alcance del usuario autenticado. */
export const filterByProyectoScope = <T extends { id: string }>(
  items: T[],
  proyectoIds: string[] | null
): T[] => {
  if (proyectoIds === null) return items;
  const allowed = new Set(proyectoIds);
  return items.filter((item) => allowed.has(item.id));
};

/** Filtra registros que tienen proyectoId (nullable) según el alcance. */
export const filterByLinkedProyectoScope = <T extends { proyectoId?: string | null }>(
  items: T[],
  proyectoIds: string[] | null
): T[] => {
  if (proyectoIds === null) return items;
  const allowed = new Set(proyectoIds);
  return items.filter((item) => item.proyectoId && allowed.has(item.proyectoId));
};
