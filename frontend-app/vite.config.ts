import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.VITE_DEV_API ?? "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/upload-doc": apiTarget,
      "/demo-doc": apiTarget,
      "/login": apiTarget,
      "/signup": apiTarget,
      "/verify": apiTarget,
      "/redacted_docs": apiTarget,
    },
  },
});
