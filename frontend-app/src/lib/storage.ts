export interface SavedCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  email: string;
  name?: string;
  demo?: boolean;
}

export function getSavedCredentials(): SavedCredentials | null {
  try {
    const raw = localStorage.getItem("savedCredentials");
    return raw ? (JSON.parse(raw) as SavedCredentials) : null;
  } catch {
    return null;
  }
}

export function setSavedCredentials(creds: SavedCredentials | null): void {
  try {
    if (!creds) localStorage.removeItem("savedCredentials");
    else localStorage.setItem("savedCredentials", JSON.stringify(creds));
  } catch {
    /* ignore */
  }
}

export function isLoggedIn(): boolean {
  return (
    !!localStorage.getItem("authToken") ||
    localStorage.getItem("isAuthenticated") === "true"
  );
}

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("authUser");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem("authToken");
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("authUser");
  sessionStorage.removeItem("pendingUpload");
  sessionStorage.removeItem("uploadError");
}
