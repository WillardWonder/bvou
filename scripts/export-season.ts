import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SEASON_ID, TEAM_ID } from "../src/domain/index.ts";
import { parseArgs } from "./lib/args.ts";
import { services } from "./lib/admin.ts";

const args = parseArgs();
const seasonId = typeof args.season === "string" ? args.season : DEFAULT_SEASON_ID;
const output = typeof args.output === "string" ? args.output : path.resolve(`merrill-girls-wrestling-${seasonId}-export.json`);
const { db } = services();
const getRows = async (collectionPath: string) => (await db.collection(collectionPath).get()).docs.map((doc) => ({ id: doc.id, ...doc.data() }));
const members = await getRows(`teams/${TEAM_ID}/members`);
const athleteData = [];
for (const member of members.filter((item) => item.role === "athlete")) {
  const uid = String(member.uid || member.id);
  athleteData.push({
    member,
    privateCheckins: await getRows(`teams/${TEAM_ID}/athletes/${uid}/privateCheckins`),
    goals: await getRows(`teams/${TEAM_ID}/athletes/${uid}/goals`),
    confidenceEvidence: await getRows(`teams/${TEAM_ID}/athletes/${uid}/confidenceEvidence`),
    toolkit: await getRows(`teams/${TEAM_ID}/athletes/${uid}/toolkit`),
    competitionPlans: await getRows(`teams/${TEAM_ID}/athletes/${uid}/competitionPlans`),
    lessonProgress: await getRows(`teams/${TEAM_ID}/athletes/${uid}/lessonProgress`),
  });
}
const exportData = {
  exportedAt: new Date().toISOString(),
  team: (await db.doc(`teams/${TEAM_ID}`).get()).data(),
  season: (await db.doc(`teams/${TEAM_ID}/seasons/${seasonId}`).get()).data(),
  members,
  practiceSessions: await getRows(`teams/${TEAM_ID}/practiceSessions`),
  curriculum: await getRows(`teams/${TEAM_ID}/curriculum`),
  exampleBuckets: await getRows(`teams/${TEAM_ID}/exampleBuckets`),
  techniqueTerms: await getRows(`teams/${TEAM_ID}/techniqueTerms`),
  teamWins: await getRows(`teams/${TEAM_ID}/teamWins`),
  teamChallenges: await getRows(`teams/${TEAM_ID}/teamChallenges`),
  athletes: athleteData,
};
fs.writeFileSync(output, JSON.stringify(exportData, null, 2));
console.log(`Exported season data to ${output}. Treat this file as sensitive.`);
