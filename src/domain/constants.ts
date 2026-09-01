import type { FiveCKey, Pillar } from "./types";

export const APP_NAME = "Merrill Girls Wrestling";
export const TEAM_ID = "merrill-girls-wrestling";
export const DEFAULT_SEASON_ID = "2026-27";
export const TEAM_TIMEZONE = "America/Chicago";

export const PILLARS: Array<{ key: Pillar; label: string; meaning: string; breathPhase: string }> = [
  { key: "persistent", label: "Persistent", meaning: "Keep working when the first attempt does not work.", breathPhase: "Inhale" },
  { key: "consistent", label: "Consistent", meaning: "Repeat useful habits and sound wrestling behaviors.", breathPhase: "Hold" },
  { key: "resilient", label: "Resilient", meaning: "Return to useful action after a mistake or setback.", breathPhase: "Exhale" },
  { key: "relentless", label: "Relentless", meaning: "Keep creating useful action and pressure.", breathPhase: "Hold" },
];

export const FIVE_CS: Array<{ key: FiveCKey; label: string; meaning: string }> = [
  { key: "commitment", label: "Commitment", meaning: "Dedication to the work and the goal." },
  { key: "courage", label: "Courage", meaning: "Willingness to attempt, engage, and face challenge." },
  { key: "concentration", label: "Concentration", meaning: "Ability to keep or return attention to the job." },
  { key: "control", label: "Control", meaning: "Ability to regulate response and stay useful." },
  { key: "confidence", label: "Confidence", meaning: "Belief supported by preparation, mastery, and evidence." },
];

export const DEFAULT_FIVE_CS = {
  commitment: 5,
  courage: 5,
  concentration: 5,
  control: 5,
  confidence: 5,
} as const;

const PUBLIC_BASE = import.meta.env.BASE_URL || "/";
const publicAsset = (path: string): string => `${PUBLIC_BASE}${path.replace(/^\/+/, "")}`;

export const BRAND = {
  blue: "#0866e8",
  blueDeep: "#0646a8",
  navy: "#06111f",
  navySoft: "#0c1a2c",
  red: "#ff2147",
  white: "#f7fbff",
  silver: "#b8c3d4",
  primaryLogo: publicAsset("brand/merrill-girls-wrestling.png"),
  compactLogo: publicAsset("brand/merrill-girls-bluejay.png"),
} as const;

export const ROUTES = {
  signIn: "/sign-in",
  onboarding: "/onboarding",
  today: "/app/today",
  develop: "/app/development",
  compete: "/app/competition",
  team: "/app/team",
  beforePractice: (sessionId: string) => `/app/practice/before/${sessionId}`,
  afterPractice: (sessionId: string) => `/app/practice/after/${sessionId}`,
  resetSweep: "/app/reset-sweep",
  curriculum: "/app/you-university",
  lesson: (lessonId: string) => `/app/you-university/${lessonId}`,
  confidence: "/app/confidence",
  coach: "/coach",
  coachContent: "/coach/content",
  coachAdmin: "/coach/admin",
  board: (teamId: string, sessionId: string) => `/board/${teamId}/${sessionId}`,
} as const;
