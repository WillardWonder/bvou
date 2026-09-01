import type {
  AfterPracticeData,
  AppDiagnostics,
  AuthSession,
  BeforePracticeData,
  BoardEntry,
  CompetitionPlan,
  ConfidenceEvidence,
  CurriculumLesson,
  ExampleBucket,
  Goal,
  LessonProgress,
  Membership,
  PracticeSession,
  PrivatePracticeCheckin,
  Role,
  Season,
  SignInInput,
  Team,
  TeamChallenge,
  TeamInvite,
  TeamWin,
  TechniqueTerm,
  ToolkitItem,
  Unsubscribe,
  UserProfile,
} from "../domain";

export interface AppBundle {
  team: Team;
  season: Season;
  currentSession?: PracticeSession;
  currentCheckin?: PrivatePracticeCheckin;
  checkins: PrivatePracticeCheckin[];
  boardEntries: BoardEntry[];
  exampleBuckets: ExampleBucket[];
  curriculum: CurriculumLesson[];
  lessonProgress: LessonProgress[];
  goals: Goal[];
  evidence: ConfidenceEvidence[];
  toolkit: ToolkitItem[];
  competitionPlans: CompetitionPlan[];
  teamWins: TeamWin[];
  challenges: TeamChallenge[];
  terms: TechniqueTerm[];
  memberships: Membership[];
  invites: TeamInvite[];
}

export interface BeforePracticeInput {
  session: AuthSession;
  practiceSession: PracticeSession;
  data: BeforePracticeData;
}

export interface AfterPracticeInput {
  session: AuthSession;
  checkin: PrivatePracticeCheckin;
  data: AfterPracticeData;
  saveEvidence?: boolean;
  evidenceText?: string;
  evidenceTags?: string[];
}

export interface CoachRecognitionInput {
  session: AuthSession;
  athleteUid: string;
  athleteDisplayName: string;
  text: string;
  pillar?: ConfidenceEvidence["pillar"];
  tags: string[];
}

export interface AppGateway {
  readonly mode: "demo" | "firebase";
  diagnostics(): AppDiagnostics;
  subscribeAuth(listener: (session: AuthSession | null) => void): Unsubscribe;
  signInEmail(input: SignInInput): Promise<AuthSession>;
  signInGoogle(): Promise<AuthSession>;
  signInDemo(role: Role): Promise<AuthSession>;
  signOut(): Promise<void>;
  completeOnboarding(session: AuthSession): Promise<UserProfile>;

  loadBundle(session: AuthSession): Promise<AppBundle>;
  subscribeCurrentPractice(session: AuthSession, listener: (practice?: PracticeSession) => void): Unsubscribe;
  subscribeBoardEntries(teamId: string, practiceSessionId: string, listener: (entries: BoardEntry[]) => void): Unsubscribe;

  saveBeforePractice(input: BeforePracticeInput): Promise<PrivatePracticeCheckin>;
  saveAfterPractice(input: AfterPracticeInput): Promise<{ checkin: PrivatePracticeCheckin; evidence?: ConfidenceEvidence }>;
  saveGoal(session: AuthSession, input: Partial<Goal> & Pick<Goal, "text" | "level">): Promise<Goal>;
  saveEvidence(session: AuthSession, input: Partial<ConfidenceEvidence> & Pick<ConfidenceEvidence, "text">): Promise<ConfidenceEvidence>;
  updateEvidence(session: AuthSession, evidenceId: string, patch: Partial<ConfidenceEvidence>): Promise<ConfidenceEvidence>;
  recordEvidenceResurface(session: AuthSession, evidenceIds: string[], context: NonNullable<ConfidenceEvidence["resurfacedContexts"]>[number]): Promise<void>;
  saveToolkitItem(session: AuthSession, input: Partial<ToolkitItem> & Pick<ToolkitItem, "kind" | "title" | "text">): Promise<ToolkitItem>;
  saveLessonProgress(session: AuthSession, input: Partial<LessonProgress> & Pick<LessonProgress, "lessonId" | "status">): Promise<LessonProgress>;
  saveCompetitionPlan(session: AuthSession, input: Partial<CompetitionPlan> & Pick<CompetitionPlan, "eventName" | "eventDate">): Promise<CompetitionPlan>;

  createPracticeSession(session: AuthSession, input: Partial<PracticeSession>): Promise<PracticeSession>;
  updatePracticeSession(session: AuthSession, practiceSessionId: string, patch: Partial<PracticeSession>): Promise<PracticeSession>;
  saveCoachRecognition(input: CoachRecognitionInput): Promise<ConfidenceEvidence>;
  saveTeamWin(session: AuthSession, input: Partial<TeamWin> & Pick<TeamWin, "title" | "text" | "kind">): Promise<TeamWin>;
  saveTeamChallenge(session: AuthSession, input: Partial<TeamChallenge> & Pick<TeamChallenge, "title" | "description" | "target" | "unit">): Promise<TeamChallenge>;
  saveExampleBucket(session: AuthSession, bucket: ExampleBucket): Promise<ExampleBucket>;
  saveCurriculumLesson(session: AuthSession, lesson: CurriculumLesson): Promise<CurriculumLesson>;
  saveTechniqueTerm(session: AuthSession, term: TechniqueTerm): Promise<TechniqueTerm>;
  saveMembership(session: AuthSession, membership: Membership): Promise<Membership>;
  saveInvite(session: AuthSession, invite: Omit<TeamInvite, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<TeamInvite>;
  exportSeason(session: AuthSession): Promise<Record<string, unknown>>;
}
