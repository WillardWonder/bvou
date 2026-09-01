export type DataMode = "demo" | "firebase";

const value = (key: string): string => String(import.meta.env[key] ?? "").trim();
const flag = (key: string, fallback = false): boolean => {
  const raw = value(key).toLowerCase();
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw);
};

export const env = {
  dataMode: (value("VITE_DATA_MODE") || "demo") as DataMode,
  firebase: {
    apiKey: value("VITE_FIREBASE_API_KEY"),
    authDomain: value("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: value("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: value("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: value("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: value("VITE_FIREBASE_APP_ID"),
  },
  appCheckSiteKey: value("VITE_FIREBASE_APP_CHECK_SITE_KEY"),
  useEmulators: flag("VITE_FIREBASE_USE_EMULATORS") || flag("VITE_FIREBASE_USE_EMULATORS"),
  releaseChannel: typeof __RELEASE_CHANNEL__ === "string" ? __RELEASE_CHANNEL__ : "local",
  buildSha: typeof __BUILD_SHA__ === "string" ? __BUILD_SHA__ : "local",
} as const;

export function assertFirebaseConfig(): void {
  const missing = Object.entries(env.firebase).filter(([, current]) => !current).map(([key]) => key);
  if (missing.length) throw new Error(`Missing Firebase configuration: ${missing.join(", ")}`);
}
