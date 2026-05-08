const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000/api";
const TOKEN_KEY = "oya_token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function apiRequest<T>(
  path: string,
  options: { method?: Method; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const { method = "GET", body } = options;
  const token = options.token ?? tokenStorage.get();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Error de API");
  }
  return payload as T;
}
