import { DEFAULT_SEASON_ID, TEAM_ID, createDemoSeed } from "../src/domain/index.ts";
import { parseArgs, required } from "./lib/args.ts";
import { services } from "./lib/admin.ts";

const args = parseArgs();
const email = required(args, "email").toLowerCase();
const name = typeof args.name === "string" ? args.name.trim() : "Program Administrator";
const boardName = typeof args["board-name"] === "string" ? args["board-name"].trim() : name.split(" ")[0] || "Admin";
const { auth, db } = services();
let user;
try {
  user = await auth.getUserByEmail(email);
} catch {
  const temporaryPassword = typeof args["temporary-password"] === "string" ? args["temporary-password"] : undefined;
  if (!temporaryPassword) {
    throw new Error("No Firebase Authentication account exists for that email. Sign in once with Google first, or rerun with --temporary-password from your own terminal.");
  }
  user = await auth.createUser({ email, password: temporaryPassword, displayName: name, emailVerified: false });
}
const seed = createDemoSeed();
const current = new Date().toISOString();
const batch = db.batch();
batch.set(db.doc(`teams/${TEAM_ID}`), seed.team, { merge: true });
batch.set(db.doc(`teams/${TEAM_ID}/seasons/${DEFAULT_SEASON_ID}`), seed.season, { merge: true });
batch.set(db.doc(`users/${user.uid}`), {
  uid: user.uid, email, displayName: name, defaultTeamId: TEAM_ID, onboardingComplete: true,
  createdAt: current, updatedAt: current, createdBy: "bootstrap-admin", updatedBy: user.uid,
}, { merge: true });
batch.set(db.doc(`teams/${TEAM_ID}/members/${user.uid}`), {
  uid: user.uid, email, role: "admin", displayName: name, boardDisplayName: boardName,
  active: true, seasonId: DEFAULT_SEASON_ID, createdAt: current, updatedAt: current,
  createdBy: "bootstrap-admin", updatedBy: user.uid,
}, { merge: true });
await batch.commit();
console.log(`Bootstrapped admin membership for ${email} (${user.uid}).`);
console.log("Reload the app and sign in with the same account.");
