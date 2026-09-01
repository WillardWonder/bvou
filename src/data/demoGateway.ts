import {
  DEFAULT_SEASON_ID,
  DEMO_ACCOUNTS,
  TEAM_ID,
  buildWeeklyRecap,
  createDemoSeed,
  type AfterPracticeData,
  type AppDiagnostics,
  type AuthSession,
  type BoardEntry,
  type CompetitionPlan,
  type ConfidenceEvidence,
  type CurriculumLesson,
  type ExampleBucket,
  type Goal,
  type LessonProgress,
  type Membership,
  type PracticeSession,
  type PrivatePracticeCheckin,
  type Role,
  type TeamChallenge,
  type TeamInvite,
  type TeamWin,
  type TechniqueTerm,
  type ToolkitItem,
  type UserProfile,
} from "../domain";
import { env } from "../config/env";
import { dateKey } from "../utils/date";
import { createId } from "../utils/id";
import type {
  AfterPracticeInput,
  AppBundle,
  AppGateway,
  BeforePracticeInput,
  CoachRecognitionInput,
} from "./gateway";

const STORE_KEY = "mgw:demo-store:v1";
const SESSION_KEY = "mgw:demo-session:v1";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function now(): string {
  return new Date().toISOString();
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const seed = createDemoSeed();
      localStorage.setItem(STORE_KEY, JSON.stringify(seed));
      return seed;
    }
    return { ...createDemoSeed(), ...JSON.parse(raw) } as ReturnType<typeof createDemoSeed>;
  } catch {
    return createDemoSeed();
  }
}

function persistStore(store: ReturnType<typeof createDemoSeed>): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function requireRole(session: AuthSession, roles: Role[]): void {
  if (!roles.includes(session.membership.role)) throw new Error("You do not have permission to complete this action.");
}

function findSessionForUid(uid: string): AuthSession | null {
  const store = loadStore();
  const profile = store.users.find((item) => item.uid === uid);
  const membership = store.memberships.find((item) => item.uid === uid && item.active);
  if (!profile || !membership) return null;
  return {
    uid,
    email: profile.email,
    displayName: profile.displayName,
    teamId: TEAM_ID,
    membership: clone(membership),
    profile: clone(profile),
  };
}

export class DemoGateway implements AppGateway {
  readonly mode = "demo" as const;
  private authListeners = new Set<(session: AuthSession | null) => void>();
  private practiceListeners = new Set<(practice?: PracticeSession) => void>();
  private boardListeners = new Map<string, Set<(entries: BoardEntry[]) => void>>();

  diagnostics(): AppDiagnostics {
    return {
      dataMode: "demo",
      releaseChannel: env.releaseChannel,
      buildSha: env.buildSha,
      online: navigator.onLine,
      firebaseProjectId: env.firebase.projectId,
      appCheckConfigured: Boolean(env.appCheckSiteKey),
      emulatorMode: false,
    };
  }

  subscribeAuth(listener: (session: AuthSession | null) => void): () => void {
    this.authListeners.add(listener);
    queueMicrotask(() => {
      const uid = sessionStorage.getItem(SESSION_KEY);
      listener(uid ? findSessionForUid(uid) : null);
    });
    return () => this.authListeners.delete(listener);
  }

  private emitAuth(): void {
    const uid = sessionStorage.getItem(SESSION_KEY);
    const session = uid ? findSessionForUid(uid) : null;
    for (const listener of this.authListeners) listener(session);
  }

  private emitData(practiceSessionId?: string): void {
    const store = loadStore();
    const practice = store.sessions
      .filter((item) => item.seasonId === store.team.activeSeasonId)
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];
    for (const listener of this.practiceListeners) listener(clone(practice));
    if (practiceSessionId) {
      const entries = clone(store.boardEntries[practiceSessionId] ?? []);
      for (const listener of this.boardListeners.get(practiceSessionId) ?? []) listener(entries);
    }
  }

  async signInEmail(input: { email: string; password: string }): Promise<AuthSession> {
    const account = DEMO_ACCOUNTS.find((item) => item.email.toLowerCase() === input.email.trim().toLowerCase());
    if (!account || account.password !== input.password) throw new Error("That demo email or password is not correct.");
    return this.signInDemo(account.role);
  }

  async signInGoogle(): Promise<AuthSession> {
    return this.signInDemo("athlete");
  }

  async signInDemo(role: Role): Promise<AuthSession> {
    const account = DEMO_ACCOUNTS.find((item) => item.role === role);
    if (!account) throw new Error("That demo role is not available.");
    const store = loadStore();
    const membership = store.memberships.find((item) => item.role === role && item.email === account.email);
    if (!membership) throw new Error("The demo account could not be loaded.");
    sessionStorage.setItem(SESSION_KEY, membership.uid);
    this.emitAuth();
    return findSessionForUid(membership.uid) as AuthSession;
  }

  async signOut(): Promise<void> {
    sessionStorage.removeItem(SESSION_KEY);
    this.emitAuth();
  }

  async completeOnboarding(session: AuthSession): Promise<UserProfile> {
    const store = loadStore();
    const profile = store.users.find((item) => item.uid === session.uid);
    if (!profile) throw new Error("Profile not found.");
    profile.onboardingComplete = true;
    profile.updatedAt = now();
    profile.updatedBy = session.uid;
    persistStore(store);
    this.emitAuth();
    return clone(profile);
  }

  async loadBundle(session: AuthSession): Promise<AppBundle> {
    const store = loadStore();
    const currentSession = store.sessions
      .filter((item) => item.seasonId === store.team.activeSeasonId)
      .sort((a, b) => {
        const todayWeightA = a.dateKey === dateKey() ? 1 : 0;
        const todayWeightB = b.dateKey === dateKey() ? 1 : 0;
        return todayWeightB - todayWeightA || b.dateKey.localeCompare(a.dateKey);
      })[0];
    const isAthlete = session.membership.role === "athlete";
    const athleteUid = isAthlete ? session.uid : undefined;
    return clone({
      team: store.team,
      season: store.season,
      currentSession,
      currentCheckin: currentSession && athleteUid
        ? store.checkins.find((item) => item.sessionId === currentSession.id && item.athleteUid === athleteUid)
        : undefined,
      checkins: isAthlete ? store.checkins.filter((item) => item.athleteUid === session.uid) : [],
      boardEntries: currentSession ? store.boardEntries[currentSession.id] ?? [] : [],
      exampleBuckets: store.exampleBuckets.filter((item) => item.active),
      curriculum: store.curriculum.filter((item) => item.status !== "archived"),
      lessonProgress: isAthlete ? store.lessonProgress.filter((item) => item.athleteUid === session.uid) : store.lessonProgress,
      goals: isAthlete ? store.goals.filter((item) => item.athleteUid === session.uid) : store.goals,
      evidence: isAthlete
        ? store.evidence.filter((item) => item.athleteUid === session.uid)
        : store.evidence.filter((item) => item.visibility === "coach_visible"),
      toolkit: isAthlete ? store.toolkit.filter((item) => item.athleteUid === session.uid) : store.toolkit,
      competitionPlans: isAthlete ? store.competitionPlans.filter((item) => item.athleteUid === session.uid) : store.competitionPlans,
      teamWins: store.teamWins.filter((item) => item.status === "published"),
      challenges: store.challenges.filter((item) => item.status !== "archived"),
      terms: store.terms.filter((item) => item.active),
      memberships: isAthlete ? [session.membership] : store.memberships.filter((item) => item.active),
      invites: session.membership.role === "admin" ? store.invites : [],
    });
  }

  subscribeCurrentPractice(_session: AuthSession, listener: (practice?: PracticeSession) => void): () => void {
    this.practiceListeners.add(listener);
    const store = loadStore();
    const practice = store.sessions.sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];
    queueMicrotask(() => listener(clone(practice)));
    return () => this.practiceListeners.delete(listener);
  }

  subscribeBoardEntries(_teamId: string, practiceSessionId: string, listener: (entries: BoardEntry[]) => void): () => void {
    const listeners = this.boardListeners.get(practiceSessionId) ?? new Set();
    listeners.add(listener);
    this.boardListeners.set(practiceSessionId, listeners);
    queueMicrotask(() => listener(clone(loadStore().boardEntries[practiceSessionId] ?? [])));
    return () => {
      listeners.delete(listener);
      if (!listeners.size) this.boardListeners.delete(practiceSessionId);
    };
  }

  async saveBeforePractice({ session, practiceSession, data }: BeforePracticeInput): Promise<PrivatePracticeCheckin> {
    requireRole(session, ["athlete"]);
    const store = loadStore();
    const id = `${practiceSession.id}-${session.uid}`;
    const stamp = now();
    let checkin = store.checkins.find((item) => item.id === id);
    if (checkin) {
      checkin.before = { ...data, completedAt: data.completedAt ?? stamp };
      checkin.updatedAt = stamp;
      checkin.updatedBy = session.uid;
    } else {
      checkin = {
        id,
        teamId: session.teamId,
        seasonId: practiceSession.seasonId,
        sessionId: practiceSession.id,
        athleteUid: session.uid,
        before: { ...data, completedAt: data.completedAt ?? stamp },
        createdAt: stamp,
        updatedAt: stamp,
        createdBy: session.uid,
        updatedBy: session.uid,
      };
      store.checkins.push(checkin);
    }
    const entries = store.boardEntries[practiceSession.id] ?? [];
    const existing = entries.find((item) => item.athleteUid === session.uid);
    const boardEntry: BoardEntry = {
      athleteUid: session.uid,
      boardDisplayName: session.membership.boardDisplayName,
      focusText: data.focusText,
      ...(data.pillar ? { pillar: data.pillar } : {}),
      state: navigator.onLine ? "ready" : "pending",
      reflectionComplete: false,
      updatedAt: stamp,
    };
    if (existing) Object.assign(existing, boardEntry);
    else entries.push(boardEntry);
    store.boardEntries[practiceSession.id] = entries;
    persistStore(store);
    this.emitData(practiceSession.id);
    return clone(checkin);
  }

  async saveAfterPractice({ session, checkin, data, saveEvidence, evidenceText, evidenceTags }: AfterPracticeInput): Promise<{ checkin: PrivatePracticeCheckin; evidence?: ConfidenceEvidence }> {
    requireRole(session, ["athlete"]);
    const store = loadStore();
    const existing = store.checkins.find((item) => item.id === checkin.id);
    if (!existing) throw new Error("Before-practice focus was not found.");
    const stamp = now();
    existing.after = { ...data, completedAt: data.completedAt ?? stamp };
    existing.updatedAt = stamp;
    existing.updatedBy = session.uid;

    let evidence: ConfidenceEvidence | undefined;
    const usefulText = (evidenceText || data.wentWell || "").trim();
    if (saveEvidence && usefulText) {
      evidence = {
        id: createId("evidence"),
        athleteUid: session.uid,
        text: usefulText,
        source: "practice",
        sourceRef: { kind: "practice", id: checkin.sessionId },
        contextLabel: "Practice",
        occurredAt: stamp,
        tags: [...new Set([...(evidenceTags ?? []), "practice", data.workedOnFocus === "yes" ? "follow-through" : "learning"])],
        pillar: existing.before.pillar,
        visibility: "private",
        pinned: false,
        archived: false,
        createdAt: stamp,
        updatedAt: stamp,
        createdBy: session.uid,
        updatedBy: session.uid,
      };
      store.evidence.unshift(evidence);
      existing.evidenceId = evidence.id;
    }
    const boardEntry = store.boardEntries[checkin.sessionId]?.find((item) => item.athleteUid === session.uid);
    if (boardEntry) {
      boardEntry.reflectionComplete = true;
      boardEntry.updatedAt = stamp;
    }
    persistStore(store);
    this.emitData(checkin.sessionId);
    return clone({ checkin: existing, evidence });
  }

  async saveGoal(session: AuthSession, input: Partial<Goal> & Pick<Goal, "text" | "level">): Promise<Goal> {
    requireRole(session, ["athlete"]);
    const store = loadStore();
    const stamp = now();
    const existing = input.id ? store.goals.find((item) => item.id === input.id && item.athleteUid === session.uid) : undefined;
    const goal: Goal = {
      id: existing?.id ?? createId("goal"),
      athleteUid: session.uid,
      seasonId: input.seasonId ?? DEFAULT_SEASON_ID,
      level: input.level,
      text: input.text.trim(),
      parentGoalId: input.parentGoalId,
      evidenceDefinition: input.evidenceDefinition,
      status: input.status ?? existing?.status ?? "active",
      targetDate: input.targetDate,
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
      createdBy: existing?.createdBy ?? session.uid,
      updatedBy: session.uid,
    };
    if (existing) Object.assign(existing, goal); else store.goals.push(goal);
    persistStore(store);
    return clone(goal);
  }

  async saveEvidence(session: AuthSession, input: Partial<ConfidenceEvidence> & Pick<ConfidenceEvidence, "text">): Promise<ConfidenceEvidence> {
    requireRole(session, ["athlete", "coach", "admin"]);
    const store = loadStore();
    const stamp = now();
    const athleteUid = input.athleteUid ?? session.uid;
    const evidence: ConfidenceEvidence = {
      id: input.id ?? createId("evidence"),
      athleteUid,
      text: input.text.trim(),
      source: input.source ?? (session.membership.role === "athlete" ? "self" : "coach"),
      sourceAuthorUid: input.sourceAuthorUid ?? session.uid,
      sourceAuthorName: input.sourceAuthorName ?? session.displayName,
      sourceRef: input.sourceRef,
      contextLabel: input.contextLabel,
      occurredAt: input.occurredAt ?? stamp,
      tags: input.tags ?? [],
      pillar: input.pillar,
      visibility: input.visibility ?? (session.membership.role === "athlete" ? "private" : "coach_visible"),
      pinned: input.pinned ?? false,
      archived: input.archived ?? false,
      resurfacedAt: input.resurfacedAt,
      resurfacedContexts: input.resurfacedContexts,
      createdAt: input.createdAt ?? stamp,
      updatedAt: stamp,
      createdBy: input.createdBy ?? session.uid,
      updatedBy: session.uid,
    };
    const existing = store.evidence.find((item) => item.id === evidence.id);
    if (existing) Object.assign(existing, evidence); else store.evidence.unshift(evidence);
    persistStore(store);
    return clone(evidence);
  }

  async updateEvidence(session: AuthSession, evidenceId: string, patch: Partial<ConfidenceEvidence>): Promise<ConfidenceEvidence> {
    const store = loadStore();
    const evidence = store.evidence.find((item) => item.id === evidenceId);
    if (!evidence) throw new Error("Evidence was not found.");
    const allowed = evidence.athleteUid === session.uid || ["coach", "admin"].includes(session.membership.role);
    if (!allowed) throw new Error("You do not have permission to change this entry.");
    Object.assign(evidence, patch, { updatedAt: now(), updatedBy: session.uid });
    persistStore(store);
    return clone(evidence);
  }

  async recordEvidenceResurface(session: AuthSession, evidenceIds: string[], context: NonNullable<ConfidenceEvidence["resurfacedContexts"]>[number]): Promise<void> {
    const store = loadStore();
    const stamp = now();
    for (const item of store.evidence.filter((entry) => entry.athleteUid === session.uid && evidenceIds.includes(entry.id))) {
      item.resurfacedAt = stamp;
      item.resurfacedContexts = [...new Set([...(item.resurfacedContexts ?? []), context])];
      item.updatedAt = stamp;
    }
    persistStore(store);
  }

  async saveToolkitItem(session: AuthSession, input: Partial<ToolkitItem> & Pick<ToolkitItem, "kind" | "title" | "text">): Promise<ToolkitItem> {
    requireRole(session, ["athlete"]);
    const store = loadStore();
    const stamp = now();
    const item: ToolkitItem = {
      id: input.id ?? createId("tool"), athleteUid: session.uid, kind: input.kind, title: input.title.trim(), text: input.text.trim(),
      sourceRef: input.sourceRef, tags: input.tags ?? [], active: input.active ?? true,
      createdAt: input.createdAt ?? stamp, updatedAt: stamp, createdBy: input.createdBy ?? session.uid, updatedBy: session.uid,
    };
    const existing = store.toolkit.find((entry) => entry.id === item.id);
    if (existing) Object.assign(existing, item); else store.toolkit.unshift(item);
    persistStore(store);
    return clone(item);
  }

  async saveLessonProgress(session: AuthSession, input: Partial<LessonProgress> & Pick<LessonProgress, "lessonId" | "status">): Promise<LessonProgress> {
    requireRole(session, ["athlete"]);
    const store = loadStore();
    const id = input.id ?? `${session.uid}-${input.lessonId}`;
    const stamp = now();
    const progress: LessonProgress = {
      id, athleteUid: session.uid, lessonId: input.lessonId, status: input.status,
      outputText: input.outputText, outputType: input.outputType, appliedToSessionId: input.appliedToSessionId,
      completedAt: input.status === "completed" ? (input.completedAt ?? stamp) : input.completedAt,
      createdAt: input.createdAt ?? stamp, updatedAt: stamp, createdBy: input.createdBy ?? session.uid, updatedBy: session.uid,
    };
    const existing = store.lessonProgress.find((item) => item.id === id);
    if (existing) Object.assign(existing, progress); else store.lessonProgress.push(progress);
    persistStore(store);
    return clone(progress);
  }

  async saveCompetitionPlan(session: AuthSession, input: Partial<CompetitionPlan> & Pick<CompetitionPlan, "eventName" | "eventDate">): Promise<CompetitionPlan> {
    requireRole(session, ["athlete"]);
    const store = loadStore();
    const stamp = now();
    const plan: CompetitionPlan = {
      id: input.id ?? createId("competition"), athleteUid: session.uid, seasonId: input.seasonId ?? DEFAULT_SEASON_ID,
      eventName: input.eventName.trim(), eventDate: input.eventDate, status: input.status ?? "active",
      outcomeDirection: input.outcomeDirection, processGoals: input.processGoals ?? [], pillar: input.pillar,
      firstJob: input.firstJob ?? "", cue: input.cue ?? "", routineSteps: input.routineSteps ?? [], ifThenPlans: input.ifThenPlans ?? [],
      betweenPeriods: input.betweenPeriods, betweenMatches: input.betweenMatches, reflection: input.reflection,
      createdAt: input.createdAt ?? stamp, updatedAt: stamp, createdBy: input.createdBy ?? session.uid, updatedBy: session.uid,
    };
    const existing = store.competitionPlans.find((item) => item.id === plan.id);
    if (existing) Object.assign(existing, plan); else store.competitionPlans.unshift(plan);
    persistStore(store);
    return clone(plan);
  }

  async createPracticeSession(session: AuthSession, input: Partial<PracticeSession>): Promise<PracticeSession> {
    requireRole(session, ["coach", "admin"]);
    const store = loadStore();
    const stamp = now();
    const practice: PracticeSession = {
      id: input.id ?? createId("practice"), teamId: session.teamId, seasonId: input.seasonId ?? DEFAULT_SEASON_ID,
      dateKey: input.dateKey ?? dateKey(), startsAt: input.startsAt ?? stamp, teamTheme: input.teamTheme,
      curriculumLessonId: input.curriculumLessonId, boardStatus: input.boardStatus ?? "draft", closingPrompt: input.closingPrompt,
      createdAt: stamp, updatedAt: stamp, createdBy: session.uid, updatedBy: session.uid,
    };
    store.sessions.unshift(practice);
    store.boardEntries[practice.id] = store.memberships.filter((item) => item.role === "athlete" && item.active).map((member) => ({
      athleteUid: member.uid, boardDisplayName: member.boardDisplayName, focusText: "Focus not set", state: "pending", updatedAt: stamp,
    }));
    persistStore(store);
    this.emitData(practice.id);
    return clone(practice);
  }

  async updatePracticeSession(session: AuthSession, practiceSessionId: string, patch: Partial<PracticeSession>): Promise<PracticeSession> {
    requireRole(session, ["coach", "admin"]);
    const store = loadStore();
    const practice = store.sessions.find((item) => item.id === practiceSessionId);
    if (!practice) throw new Error("Practice session was not found.");
    Object.assign(practice, patch, { updatedAt: now(), updatedBy: session.uid });
    persistStore(store);
    this.emitData(practiceSessionId);
    return clone(practice);
  }

  async saveCoachRecognition(input: CoachRecognitionInput): Promise<ConfidenceEvidence> {
    requireRole(input.session, ["coach", "admin"]);
    const evidence = await this.saveEvidence(input.session, {
      athleteUid: input.athleteUid,
      text: input.text,
      source: "coach",
      sourceAuthorUid: input.session.uid,
      sourceAuthorName: input.session.displayName,
      sourceRef: { kind: "recognition", id: createId("recognition") },
      contextLabel: "Coach noticed",
      tags: input.tags,
      pillar: input.pillar,
      visibility: "coach_visible",
    });
    const store = loadStore();
    store.teamWins.unshift({
      id: createId("win"), title: "Coach noticed", text: input.text, pillar: input.pillar,
      status: "published", publishedAt: now(), athleteUid: input.athleteUid, athleteDisplayName: input.athleteDisplayName,
      kind: "coach_noticed", createdAt: now(), updatedAt: now(), createdBy: input.session.uid, updatedBy: input.session.uid,
    });
    persistStore(store);
    return evidence;
  }

  async saveTeamWin(session: AuthSession, input: Partial<TeamWin> & Pick<TeamWin, "title" | "text" | "kind">): Promise<TeamWin> {
    requireRole(session, ["coach", "admin"]);
    const store = loadStore();
    const stamp = now();
    const win: TeamWin = {
      id: input.id ?? createId("win"), title: input.title.trim(), text: input.text.trim(), pillar: input.pillar,
      skillTag: input.skillTag, status: input.status ?? "published", publishedAt: input.publishedAt ?? stamp,
      athleteUid: input.athleteUid, athleteDisplayName: input.athleteDisplayName, kind: input.kind,
      createdAt: input.createdAt ?? stamp, updatedAt: stamp, createdBy: input.createdBy ?? session.uid, updatedBy: session.uid,
    };
    const existing = store.teamWins.find((item) => item.id === win.id);
    if (existing) Object.assign(existing, win); else store.teamWins.unshift(win);
    persistStore(store);
    return clone(win);
  }

  async saveTeamChallenge(session: AuthSession, input: Partial<TeamChallenge> & Pick<TeamChallenge, "title" | "description" | "target" | "unit">): Promise<TeamChallenge> {
    requireRole(session, ["coach", "admin"]);
    const store = loadStore();
    const stamp = now();
    const challenge: TeamChallenge = {
      id: input.id ?? createId("challenge"), title: input.title.trim(), description: input.description.trim(), target: input.target,
      current: input.current ?? 0, unit: input.unit, status: input.status ?? "active", endsOn: input.endsOn,
      createdAt: input.createdAt ?? stamp, updatedAt: stamp, createdBy: input.createdBy ?? session.uid, updatedBy: session.uid,
    };
    const existing = store.challenges.find((item) => item.id === challenge.id);
    if (existing) Object.assign(existing, challenge); else store.challenges.unshift(challenge);
    persistStore(store);
    return clone(challenge);
  }

  async saveExampleBucket(session: AuthSession, bucket: ExampleBucket): Promise<ExampleBucket> {
    requireRole(session, ["coach", "admin"]);
    const store = loadStore();
    const value = { ...bucket, updatedAt: now(), updatedBy: session.uid };
    const existing = store.exampleBuckets.find((item) => item.id === bucket.id);
    if (existing) Object.assign(existing, value); else store.exampleBuckets.push(value);
    persistStore(store);
    return clone(value);
  }

  async saveCurriculumLesson(session: AuthSession, lesson: CurriculumLesson): Promise<CurriculumLesson> {
    requireRole(session, ["coach", "admin"]);
    const store = loadStore();
    const value = { ...lesson, updatedAt: now(), updatedBy: session.uid };
    const existing = store.curriculum.find((item) => item.id === lesson.id);
    if (existing) Object.assign(existing, value); else store.curriculum.push(value);
    persistStore(store);
    return clone(value);
  }

  async saveTechniqueTerm(session: AuthSession, term: TechniqueTerm): Promise<TechniqueTerm> {
    requireRole(session, ["coach", "admin"]);
    if (term.status === "rejected") term.active = false;
    const store = loadStore();
    const value = { ...term, updatedAt: now(), updatedBy: session.uid };
    const existing = store.terms.find((item) => item.id === term.id);
    if (existing) Object.assign(existing, value); else store.terms.push(value);
    persistStore(store);
    return clone(value);
  }

  async saveMembership(session: AuthSession, membership: Membership): Promise<Membership> {
    requireRole(session, ["admin"]);
    const store = loadStore();
    const value = { ...membership, updatedAt: now(), updatedBy: session.uid };
    const existing = store.memberships.find((item) => item.uid === membership.uid);
    if (existing) Object.assign(existing, value); else store.memberships.push(value);
    persistStore(store);
    return clone(value);
  }

  async saveInvite(session: AuthSession, input: Omit<TeamInvite, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<TeamInvite> {
    requireRole(session, ["admin"]);
    const store = loadStore();
    const current = now();
    const invite: TeamInvite = {
      ...input,
      id: input.id ?? encodeURIComponent(input.email.trim().toLowerCase()),
      email: input.email.trim().toLowerCase(),
      createdAt: current,
      updatedAt: current,
      createdBy: session.uid,
      updatedBy: session.uid,
    };
    const existing = store.invites.find((item) => item.id === invite.id);
    if (existing) Object.assign(existing, invite); else store.invites.push(invite);
    persistStore(store);
    return clone(invite);
  }

  async exportSeason(session: AuthSession): Promise<Record<string, unknown>> {
    requireRole(session, ["admin"]);
    const store = loadStore();
    return clone({
      exportedAt: now(), team: store.team, season: store.season,
      memberships: store.memberships, sessions: store.sessions, boardEntries: store.boardEntries,
      checkins: store.checkins, goals: store.goals, evidence: store.evidence, toolkit: store.toolkit,
      competitionPlans: store.competitionPlans, lessonProgress: store.lessonProgress,
      teamWins: store.teamWins, challenges: store.challenges, curriculum: store.curriculum,
      exampleBuckets: store.exampleBuckets, techniqueTerms: store.terms,
      weeklyRecap: buildWeeklyRecap(store.checkins.filter((item) => item.athleteUid === session.uid), store.evidence.filter((item) => item.athleteUid === session.uid)),
    });
  }
}
