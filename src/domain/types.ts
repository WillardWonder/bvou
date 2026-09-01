export type Role = "athlete" | "coach" | "admin" | "board";
export type Pillar = "persistent" | "consistent" | "resilient" | "relentless";
export type IdentityWord = Pillar | "respectful";
export type FiveCKey = "commitment" | "courage" | "concentration" | "control" | "confidence";
export type Visibility = "private" | "coach_visible" | "team_visible";
export type SaveState = "idle" | "saving" | "saved" | "pending" | "error";
export type BoardStatus = "draft" | "open" | "closed";
export type ContentStatus = "draft" | "published" | "archived";
export type GoalLevel = "season" | "performance" | "block" | "weekly" | "daily";
export type ToolkitKind = "cue" | "routine" | "imagery" | "reset" | "what_works" | "if_then";
export type EvidenceSource = "self" | "coach" | "practice" | "competition" | "lesson";
export type EvidenceContext = "competition" | "weekly" | "manual" | "adversity" | "today";
export type WorkedOnFocus = "yes" | "partly" | "not_yet";
export type ExampleBucketKey = "practice_focus" | "show_up" | "went_well" | "improve" | "gratitude" | "reset";
export type TermStatus =
  | "verified_arnie_primary"
  | "verified_coach_merrill"
  | "current_project_term"
  | "starter_language"
  | "legacy_verify"
  | "rejected";

export interface AuditFields {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface UserProfile extends AuditFields {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  defaultTeamId: string;
  onboardingComplete: boolean;
  trustedDeviceOfflineEnabled?: boolean;
}

export interface Membership extends AuditFields {
  uid: string;
  role: Role;
  displayName: string;
  boardDisplayName: string;
  active: boolean;
  seasonId: string;
  email?: string;
}


export interface TeamInvite extends AuditFields {
  id: string;
  email: string;
  role: Exclude<Role, "board">;
  displayName: string;
  boardDisplayName: string;
  seasonId: string;
  active: boolean;
  claimedAt?: string;
  claimedBy?: string;
}

export interface Team extends AuditFields {
  id: string;
  name: string;
  shortName: string;
  timezone: string;
  activeSeasonId: string;
  primaryLogoPath: string;
  compactLogoPath: string;
  settings: TeamSettings;
}

export interface TeamSettings {
  fiveCsRequired: boolean;
  athleteReflectionsCoachVisible: boolean;
  coachCanReadFiveCs: boolean;
  practiceFocusMaxLength: number;
  defaultResetSeconds: 20 | 30 | 45;
  allowGoogleSignIn: boolean;
  allowEmailPasswordSignIn: boolean;
}

export interface Season extends AuditFields {
  id: string;
  teamId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  status: "planned" | "active" | "archived";
}

export interface PracticeSession extends AuditFields {
  id: string;
  teamId: string;
  seasonId: string;
  dateKey: string;
  startsAt?: string;
  teamTheme?: string;
  curriculumLessonId?: string;
  boardStatus: BoardStatus;
  closingPrompt?: string;
}

export interface BoardEntry {
  athleteUid: string;
  boardDisplayName: string;
  focusText: string;
  pillar?: Pillar;
  state: "ready" | "pending";
  reflectionComplete?: boolean;
  updatedAt: string;
}

export type FiveCsRatings = Record<FiveCKey, number>;

export interface BeforePracticeData {
  focusText: string;
  focusSource: "example" | "own" | "coach_suggested";
  pillar?: Pillar;
  showUpText?: string;
  fiveCs?: FiveCsRatings;
  resetUsed?: "breathing" | "reset_sweep" | "none";
  completedAt?: string;
}

export interface AfterPracticeData {
  workedOnFocus: WorkedOnFocus;
  wentWell?: string;
  improve?: string;
  fiveCs?: FiveCsRatings;
  gratitude?: string;
  nextFocusAction?: "keep" | "narrow" | "replace";
  nextFocusText?: string;
  completedAt?: string;
}

export interface PrivatePracticeCheckin extends AuditFields {
  id: string;
  teamId: string;
  seasonId: string;
  sessionId: string;
  athleteUid: string;
  before: BeforePracticeData;
  after?: AfterPracticeData;
  evidenceId?: string;
}

export interface ExampleBucket extends AuditFields {
  id: string;
  key: ExampleBucketKey;
  prompt: string;
  why: string;
  examples: string[];
  active: boolean;
  sortOrder: number;
  sourceLabel: "arnie_primary" | "coach_merrill" | "starter" | "project";
}

export interface TryItActivity {
  kind: "breathing" | "imagery" | "reflection" | "reset_sweep" | "planning" | "none";
  title: string;
  instructions: string[];
  durationSeconds?: number;
}

export interface CurriculumLesson extends AuditFields {
  id: string;
  week: number;
  title: string;
  skillKey: string;
  whyItMatters: string;
  examples: string[];
  tryItNow: TryItActivity;
  useItToday: string;
  reflectPrompt: string;
  saveTarget?: "cue" | "routine" | "evidence" | "goal" | "if_then" | "none";
  status: ContentStatus;
}

export interface LessonProgress extends AuditFields {
  id: string;
  athleteUid: string;
  lessonId: string;
  status: "started" | "applied" | "completed";
  outputText?: string;
  outputType?: "cue" | "routine" | "evidence" | "goal" | "if_then" | "none";
  appliedToSessionId?: string;
  completedAt?: string;
}

export interface Goal extends AuditFields {
  id: string;
  athleteUid: string;
  seasonId: string;
  level: GoalLevel;
  text: string;
  parentGoalId?: string;
  evidenceDefinition?: string;
  status: "active" | "completed" | "archived";
  targetDate?: string;
}

export interface ConfidenceEvidence extends AuditFields {
  id: string;
  athleteUid: string;
  text: string;
  source: EvidenceSource;
  sourceAuthorUid?: string;
  sourceAuthorName?: string;
  sourceRef?: { kind: "practice" | "competition" | "lesson" | "recognition" | "goal"; id: string };
  contextLabel?: string;
  occurredAt: string;
  tags: string[];
  pillar?: Pillar;
  visibility: "private" | "coach_visible";
  pinned: boolean;
  archived: boolean;
  resurfacedAt?: string;
  resurfacedContexts?: EvidenceContext[];
}

export interface ToolkitItem extends AuditFields {
  id: string;
  athleteUid: string;
  kind: ToolkitKind;
  title: string;
  text: string;
  sourceRef?: { kind: "lesson" | "practice" | "competition" | "manual"; id: string };
  tags: string[];
  active: boolean;
}

export interface CompetitionPlan extends AuditFields {
  id: string;
  athleteUid: string;
  seasonId: string;
  eventName: string;
  eventDate: string;
  status: "draft" | "active" | "completed" | "archived";
  outcomeDirection?: string;
  processGoals: string[];
  pillar?: Pillar;
  firstJob: string;
  cue: string;
  routineSteps: string[];
  ifThenPlans: Array<{ if: string; then: string }>;
  betweenPeriods?: string;
  betweenMatches?: string;
  reflection?: {
    planUsed?: string;
    wentWell?: string;
    adjustment?: string;
    nextFocus?: string;
    evidenceId?: string;
    completedAt?: string;
  };
}

export interface TeamWin extends AuditFields {
  id: string;
  title: string;
  text: string;
  pillar?: IdentityWord;
  skillTag?: string;
  status: ContentStatus;
  publishedAt?: string;
  athleteUid?: string;
  athleteDisplayName?: string;
  kind: "team_win" | "coach_noticed" | "teammate_recognition" | "milestone";
}

export interface TeamChallenge extends AuditFields {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  status: "active" | "completed" | "archived";
  endsOn?: string;
}

export interface TechniqueTerm extends AuditFields {
  id: string;
  term: string;
  normalizedKey: string;
  category: string;
  status: TermStatus;
  definition?: string;
  athleteExplanation?: string;
  coachCue?: string;
  examples: string[];
  source: string;
  verifiedBy?: string;
  verifiedAt?: string;
  aliases: string[];
  academyLink?: string;
  notes?: string;
  active: boolean;
}

export interface EngagementEvent {
  id: string;
  athleteUid?: string;
  teamId: string;
  seasonId?: string;
  event:
    | "practice_focus_saved"
    | "practice_reflection_completed"
    | "confidence_evidence_saved"
    | "confidence_evidence_resurfaced"
    | "lesson_applied"
    | "board_opened";
  occurredAt: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface WeeklyRecap {
  weekStart: string;
  weekEnd: string;
  focusThemes: Array<{ label: string; count: number }>;
  evidence: ConfidenceEvidence[];
  lessonTitle?: string;
  nextFocusSuggestion?: string;
  ownLanguageRatio?: number;
}

export interface AthleteDevelopmentSummary {
  athleteUid: string;
  activeGoals: Goal[];
  recentCheckins: PrivatePracticeCheckin[];
  evidence: ConfidenceEvidence[];
  toolkit: ToolkitItem[];
  competitionPlans: CompetitionPlan[];
  lessonProgress: LessonProgress[];
  whatWorks: ToolkitItem[];
  weeklyRecap: WeeklyRecap;
}

export interface CoachRosterItem {
  member: Membership;
  boardEntry?: BoardEntry;
  currentCheckin?: PrivatePracticeCheckin;
  recentEvidence?: ConfidenceEvidence[];
}

export interface AuthSession {
  uid: string;
  email: string;
  displayName: string;
  teamId: string;
  membership: Membership;
  profile: UserProfile;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface DataSnapshot<T> {
  data: T;
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export interface Unsubscribe {
  (): void;
}

export interface AppDiagnostics {
  dataMode: "demo" | "firebase";
  releaseChannel: string;
  buildSha: string;
  online: boolean;
  firebaseProjectId: string;
  appCheckConfigured: boolean;
  emulatorMode: boolean;
}
