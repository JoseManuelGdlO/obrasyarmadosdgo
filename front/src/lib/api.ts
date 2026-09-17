const RAW_API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000/api";

const normalizeApiBaseUrl = (url: string) => {
  const cleanUrl = url.replace(/\/+$/, "");
  return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");
const TOKEN_KEY = "oya_token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const isFormData = (value: unknown): value is FormData =>
  typeof FormData !== "undefined" && value instanceof FormData;

export async function apiRequest<T>(
  path: string,
  options: { method?: Method; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const { method = "GET", body } = options;
  const token = options.token ?? tokenStorage.get();
  const useFormData = isFormData(body);
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (!useFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    ...(body ? { body: useFormData ? body : JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Error de API");
  }
  return payload as T;
}

export async function apiDownload(
  path: string,
  options: { method?: Method; token?: string | null; fallbackFilename?: string } = {}
): Promise<void> {
  const { method = "GET", fallbackFilename = "download.bin" } = options;
  const token = options.token ?? tokenStorage.get();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { method, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || "Error al descargar el archivo");
  }

  const disposition = response.headers.get("Content-Disposition") || "";
  const match = /filename="?([^"]+)"?/i.exec(disposition);
  const filename = match?.[1] || fallbackFilename;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const toAbsoluteAssetUrl = (assetPath: string | null | undefined) => {
  if (!assetPath) return null;
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const normalizedPath = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return `${API_ORIGIN}${normalizedPath}`;
};
