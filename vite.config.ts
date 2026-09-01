import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function resolveBasePath(env: Record<string, string>): string {
  if (env.VITE_BASE_PATH) return env.VITE_BASE_PATH;
  if (process.env.GITHUB_ACTIONS === "true") {
    const repository = (process.env.GITHUB_REPOSITORY ?? "").split("/")[1] ?? "";
    return repository.endsWith(".github.io") ? "/" : `/${repository}/`;
  }
  return "/";
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: resolveBasePath(env),
    plugins: [react()],
    define: {
      __BUILD_SHA__: JSON.stringify(env.VITE_BUILD_SHA || process.env.GITHUB_SHA || "local"),
      __RELEASE_CHANNEL__: JSON.stringify(env.VITE_RELEASE_CHANNEL || mode),
    },
    server: { host: "0.0.0.0", port: 5173 },
    preview: { host: "0.0.0.0", port: 4173 },
    build: {
      target: "es2022",
      sourcemap: true,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          },
        },
      },
    },
  };
});
