import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";

export function adminApp(projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || "merrill-girls-wrestling"): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    return initializeApp({ credential: cert(serviceAccount), projectId });
  }
  return initializeApp({
    projectId,
    ...(process.env.FIRESTORE_EMULATOR_HOST ? {} : { credential: applicationDefault() }),
  });
}

export function services(projectId?: string) {
  const app = adminApp(projectId);
  return { app, auth: getAuth(app), db: getFirestore(app) };
}

export async function commitInChunks(operations: Array<(batch: FirebaseFirestore.WriteBatch) => void>, db: FirebaseFirestore.Firestore): Promise<void> {
  for (let index = 0; index < operations.length; index += 400) {
    const batch = db.batch();
    for (const operation of operations.slice(index, index + 400)) operation(batch);
    await batch.commit();
  }
}

export function inviteId(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (normalized.includes("/")) throw new Error("Email addresses containing '/' are not supported as invitation IDs.");
  return normalized;
}
