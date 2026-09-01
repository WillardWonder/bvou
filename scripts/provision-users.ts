import fs from "node:fs";
import { DEFAULT_SEASON_ID, TEAM_ID, type Role } from "../src/domain/index.ts";
import { parseArgs, required } from "./lib/args.ts";
import { commitInChunks, inviteId, services } from "./lib/admin.ts";

const args = parseArgs();
const file = required(args, "file");
const { db } = services();
const text = fs.readFileSync(file, "utf8").trim();
const lines = text.split(/\r?\n/).filter(Boolean);
const headers = lines.shift()?.split(",").map((item) => item.trim()) ?? [];
const at = (row: string[], key: string) => row[headers.indexOf(key)]?.trim() ?? "";
const current = new Date().toISOString();
const operations: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];
for (const line of lines) {
  const row = line.split(",").map((item) => item.trim().replace(/^"|"$/g, ""));
  const email = at(row, "email").toLowerCase();
  const displayName = at(row, "displayName");
  const role = (at(row, "role") || "athlete") as Exclude<Role, "board">;
  if (!email || !displayName || !["athlete", "coach", "admin"].includes(role)) throw new Error(`Invalid roster row: ${line}`);
  const boardDisplayName = at(row, "boardDisplayName") || displayName.split(" ")[0] || "Athlete";
  const invite = {
    id: inviteId(email), email, displayName, boardDisplayName, role,
    seasonId: at(row, "seasonId") || DEFAULT_SEASON_ID, active: true,
    createdAt: current, updatedAt: current, createdBy: "provision-users", updatedBy: "provision-users",
  };
  operations.push((batch) => batch.set(db.doc(`teams/${TEAM_ID}/invites/${invite.id}`), invite, { merge: true }));
}
await commitInChunks(operations, db);
console.log(`Created or updated ${operations.length} roster invitations.`);
