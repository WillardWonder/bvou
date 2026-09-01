import { z } from "zod";

export const roleSchema = z.enum(["athlete", "coach", "admin", "board"]);
export const pillarSchema = z.enum(["persistent", "consistent", "resilient", "relentless"]);
export const identityWordSchema = z.enum(["persistent", "consistent", "resilient", "relentless", "respectful"]);
export const contentStatusSchema = z.enum(["draft", "published", "archived"]);
export const dateStringSchema = z.string().min(10);

export const fiveCsSchema = z.object({
  commitment: z.number().int().min(1).max(10),
  courage: z.number().int().min(1).max(10),
  concentration: z.number().int().min(1).max(10),
  control: z.number().int().min(1).max(10),
  confidence: z.number().int().min(1).max(10),
});

export const membershipSchema = z.object({
  uid: z.string().min(1),
  role: roleSchema,
  displayName: z.string().min(1),
  boardDisplayName: z.string().min(1),
  active: z.boolean(),
  seasonId: z.string().min(1),
  email: z.string().email().optional(),
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

export const teamSettingsSchema = z.object({
  fiveCsRequired: z.boolean(),
  athleteReflectionsCoachVisible: z.boolean(),
  coachCanReadFiveCs: z.boolean(),
  practiceFocusMaxLength: z.number().int().min(40).max(120),
  defaultResetSeconds: z.union([z.literal(20), z.literal(30), z.literal(45)]),
  allowGoogleSignIn: z.boolean(),
  allowEmailPasswordSignIn: z.boolean(),
});

export const teamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  timezone: z.string().min(1),
  activeSeasonId: z.string().min(1),
  primaryLogoPath: z.string().min(1),
  compactLogoPath: z.string().min(1),
  settings: teamSettingsSchema,
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

export const practiceSessionSchema = z.object({
  id: z.string().min(1),
  teamId: z.string().min(1),
  seasonId: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startsAt: dateStringSchema.optional(),
  teamTheme: z.string().max(160).optional(),
  curriculumLessonId: z.string().optional(),
  boardStatus: z.enum(["draft", "open", "closed"]),
  closingPrompt: z.string().max(160).optional(),
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

export const boardEntrySchema = z.object({
  athleteUid: z.string().min(1),
  boardDisplayName: z.string().min(1).max(40),
  focusText: z.string().min(3).max(90),
  pillar: pillarSchema.optional(),
  state: z.enum(["ready", "pending"]),
  reflectionComplete: z.boolean().optional(),
  updatedAt: dateStringSchema,
}).strict();

export const privatePracticeCheckinSchema = z.object({
  id: z.string().min(1),
  teamId: z.string().min(1),
  seasonId: z.string().min(1),
  sessionId: z.string().min(1),
  athleteUid: z.string().min(1),
  before: z.object({
    focusText: z.string().min(3).max(90),
    focusSource: z.enum(["example", "own", "coach_suggested"]),
    pillar: pillarSchema.optional(),
    showUpText: z.string().max(160).optional(),
    fiveCs: fiveCsSchema.optional(),
    resetUsed: z.enum(["breathing", "reset_sweep", "none"]).optional(),
    completedAt: dateStringSchema.optional(),
  }),
  after: z.object({
    workedOnFocus: z.enum(["yes", "partly", "not_yet"]),
    wentWell: z.string().max(320).optional(),
    improve: z.string().max(320).optional(),
    fiveCs: fiveCsSchema.optional(),
    gratitude: z.string().max(320).optional(),
    nextFocusAction: z.enum(["keep", "narrow", "replace"]).optional(),
    nextFocusText: z.string().max(90).optional(),
    completedAt: dateStringSchema.optional(),
  }).optional(),
  evidenceId: z.string().optional(),
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

export const confidenceEvidenceSchema = z.object({
  id: z.string().min(1),
  athleteUid: z.string().min(1),
  text: z.string().min(8).max(320),
  source: z.enum(["self", "coach", "practice", "competition", "lesson"]),
  sourceAuthorUid: z.string().optional(),
  sourceAuthorName: z.string().optional(),
  sourceRef: z.object({ kind: z.enum(["practice", "competition", "lesson", "recognition", "goal"]), id: z.string() }).optional(),
  contextLabel: z.string().max(160).optional(),
  occurredAt: dateStringSchema,
  tags: z.array(z.string().min(1).max(40)).max(12),
  pillar: pillarSchema.optional(),
  visibility: z.enum(["private", "coach_visible"]),
  pinned: z.boolean(),
  archived: z.boolean(),
  resurfacedAt: dateStringSchema.optional(),
  resurfacedContexts: z.array(z.enum(["competition", "weekly", "manual", "adversity", "today"])).optional(),
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});
