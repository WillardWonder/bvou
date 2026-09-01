import { createDemoSeed, TEAM_ID } from "../src/domain/index.ts";
import { parseArgs } from "./lib/args.ts";
import { commitInChunks, services } from "./lib/admin.ts";

const args = parseArgs();
const emulator = Boolean(args.emulator);
if (emulator) {
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
  process.env.GCLOUD_PROJECT ||= "demo-merrill-girls-wrestling";
}
const includeDemoUsers = emulator || Boolean(args["include-demo-users"]);
const { db, auth } = services(emulator ? "demo-merrill-girls-wrestling" : undefined);
const seed = createDemoSeed();
const operations: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];
const set = (path: string, value: unknown) => operations.push((batch) => batch.set(db.doc(path), value, { merge: true }));

set(`teams/${TEAM_ID}`, seed.team);
set(`teams/${TEAM_ID}/seasons/${seed.season.id}`, seed.season);
for (const item of seed.exampleBuckets) set(`teams/${TEAM_ID}/exampleBuckets/${item.id}`, item);
for (const item of seed.curriculum) set(`teams/${TEAM_ID}/curriculum/${item.id}`, item);
for (const item of seed.terms) set(`teams/${TEAM_ID}/techniqueTerms/${item.id}`, item);
for (const item of seed.teamWins) set(`teams/${TEAM_ID}/teamWins/${item.id}`, item);
for (const item of seed.challenges) set(`teams/${TEAM_ID}/teamChallenges/${item.id}`, item);
for (const item of seed.sessions) set(`teams/${TEAM_ID}/practiceSessions/${item.id}`, item);
for (const [sessionId, entries] of Object.entries(seed.boardEntries)) {
  for (const item of entries) set(`teams/${TEAM_ID}/practiceSessions/${sessionId}/boardEntries/${item.athleteUid}`, item);
}

if (includeDemoUsers) {
  for (const profile of seed.users) {
    let user;
    try { user = await auth.getUserByEmail(profile.email); }
    catch { user = await auth.createUser({ uid: profile.uid, email: profile.email, password: "demo1234", displayName: profile.displayName, emailVerified: true }); }
    const membership = seed.memberships.find((item) => item.uid === profile.uid)!;
    set(`users/${user.uid}`, { ...profile, uid: user.uid });
    set(`teams/${TEAM_ID}/members/${user.uid}`, { ...membership, uid: user.uid });
  }
  for (const item of seed.checkins) set(`teams/${TEAM_ID}/athletes/${item.athleteUid}/privateCheckins/${item.id}`, item);
  for (const item of seed.goals) set(`teams/${TEAM_ID}/athletes/${item.athleteUid}/goals/${item.id}`, item);
  for (const item of seed.evidence) set(`teams/${TEAM_ID}/athletes/${item.athleteUid}/confidenceEvidence/${item.id}`, item);
  for (const item of seed.toolkit) set(`teams/${TEAM_ID}/athletes/${item.athleteUid}/toolkit/${item.id}`, item);
  for (const item of seed.competitionPlans) set(`teams/${TEAM_ID}/athletes/${item.athleteUid}/competitionPlans/${item.id}`, item);
  for (const item of seed.lessonProgress) set(`teams/${TEAM_ID}/athletes/${item.athleteUid}/lessonProgress/${item.id}`, item);
}

await commitInChunks(operations, db);
console.log(`Seeded ${operations.length} Firestore documents into ${emulator ? "the emulator" : "the configured project"}.`);
console.log(includeDemoUsers ? "Synthetic demo auth users were included." : "No demo auth users were created.");
