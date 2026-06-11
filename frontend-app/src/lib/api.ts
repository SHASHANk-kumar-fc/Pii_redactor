import { API_BASE } from "./config";

export async function fetchWithFallback(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, init);
}

export interface LoginResponse {
  token?: string;
  access_token?: string;
  jwt?: string;
  user?: { email: string; name?: string };
  email?: string;
  detail?: string;
}

export interface SignupResponse {
  message?: string;
  detail?: string;
}

export interface UploadResponse {
  message: string;
  redacted_url: string;
  pii_count?: number;
  total_spans?: number;
}

export async function login(
  email: string,
  password: string,
): Promise<{ ok: true; data: LoginResponse } | { ok: false; data: LoginResponse; status: number }> {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await response.json()) as LoginResponse;
  if (response.ok) return { ok: true, data };
  return { ok: false, data, status: response.status };
}

export async function signup(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: true; data: SignupResponse } | { ok: false; data: SignupResponse }> {
  const response = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = (await response.json()) as SignupResponse;
  if (response.ok) return { ok: true, data };
  return { ok: false, data };
}

export async function fetchDemoDoc(): Promise<{ blob: Blob; name: string }> {
  const response = await fetchWithFallback("/demo-doc");
  if (!response.ok) throw new Error("Failed to fetch demo document");
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const name = match?.[1] ?? "demo.docx";
  return { blob, name };
}

export async function uploadDocument(file: File): Promise<{
  fileUrl: string;
  piiCount: number;
}> {
  const form = new FormData();
  form.append("file", file, file.name);

  const resp = await fetchWithFallback("/upload-doc/", { method: "POST", body: form });
  if (!resp.ok) {
    let msg = "Upload failed";
    try {
      const data = (await resp.json()) as { detail?: string };
      msg = data.detail ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const data = (await resp.json()) as UploadResponse;
  const apiOrigin = (() => {
    try {
      return new URL(resp.url).origin;
    } catch {
      return API_BASE;
    }
  })();

  return {
    fileUrl: `${apiOrigin}${data.redacted_url}`,
    piiCount: data.pii_count ?? 0,
  };
}
