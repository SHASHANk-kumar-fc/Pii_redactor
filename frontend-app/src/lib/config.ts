/** Same-origin when served by FastAPI; override with VITE_API_BASE if needed. */
export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export const DUMMY_LOGIN = {
  email: "demo@hide.ai",
  password: "demo12345",
} as const;

export const CRED_STORAGE_KEY = "savedCredentials";
export const PENDING_DEMO_KEY = "pendingDemoAfterLogin";
