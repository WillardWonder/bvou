import { TEAM_ID } from "../src/domain/index.ts";
import { parseArgs } from "./lib/args.ts";
import { services } from "./lib/admin.ts";

const args = parseArgs();
const { auth, db } = services();
let uid = typeof args.uid === "string" ? args.uid : "";
if (!uid && typeof args.email === "string") uid = (await auth.getUserByEmail(args.email.toLowerCase())).uid;
if (!uid) throw new Error("Provide --uid or --email.");
const ref = db.doc(`teams/${TEAM_ID}/members/${uid}`);
const snap = await ref.get();
if (!snap.exists) throw new Error("Membership not found.");
await ref.update({ active: false, updatedAt: new Date().toISOString(), updatedBy: "deactivate-user" });
if (args["disable-auth"]) await auth.updateUser(uid, { disabled: true });
console.log(`Deactivated team membership for ${uid}.${args["disable-auth"] ? " Firebase Authentication was also disabled." : ""}`);
