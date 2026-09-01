import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  DEFAULT_SEASON_ID,
  TEAM_ID,
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
  type Season,
  type Team,
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
import { getFirebaseServices } from "./firebaseClient";
import type {
  AfterPracticeInput,
  AppBundle,
  AppGateway,
  BeforePracticeInput,
  CoachRecognitionInput,
} from "./gateway";

const stamp = (): string => new Date().toISOString();
const raw = <T>(snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): T => ({
  id: snapshot.id,
  ...snapshot.data(),
}) as T;
const list = <T>(snapshots: QueryDocumentSnapshot<DocumentData>[]): T[] => snapshots.map((item) => raw<T>(item));
const inviteId = (email: string): string => email.trim().toLowerCase();

function requireRole(session: AuthSession, roles: Role[]): void {
  if (!roles.includes(session.membership.role)) throw new Error("You do not have permission to complete this action.");
}

async function claimInvite(user: User): Promise<Membership | null> {
  if (!user.email) return null;
  const { db } = await getFirebaseServices();
  const inviteRef = doc(db, "teams", TEAM_ID, "invites", inviteId(user.email));
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) return null;
  const invite = inviteSnap.data() as { email?: string; role?: Role; displayName?: string; boardDisplayName?: string; active?: boolean; seasonId?: string };
  if (invite.email?.toLowerCase() !== user.email.toLowerCase() || invite.active === false) return null;
  const membership: Membership = {
    uid: user.uid,
    role: invite.role ?? "athlete",
    displayName: invite.displayName || user.displayName || user.email.split("@")[0],
    boardDisplayName: invite.boardDisplayName || (invite.displayName || user.displayName || "Athlete").split(" ")[0],
    active: true,
    seasonId: invite.seasonId ?? DEFAULT_SEASON_ID,
    email: user.email,
    createdAt: stamp(),
    updatedAt: stamp(),
    createdBy: "invite-claim",
    updatedBy: user.uid,
  };
  const batch = writeBatch(db);
  batch.set(doc(db, "teams", TEAM_ID, "members", user.uid), membership);
  batch.update(inviteRef, { active: false, claimedAt: stamp(), claimedBy: user.uid, updatedAt: stamp() });
  await batch.commit();
  return membership;
}

async function resolveSession(user: User): Promise<AuthSession> {
  const { db } = await getFirebaseServices();
  const memberRef = doc(db, "teams", TEAM_ID, "members", user.uid);
  let memberSnap = await getDoc(memberRef);
  let membership = memberSnap.exists() ? raw<Membership>(memberSnap) : await claimInvite(user);
  if (!membership) throw new Error("Your account is not yet on the Merrill Girls Wrestling roster. Ask a program administrator to add your email.");
  if (!membership.active) throw new Error("This team account is inactive.");

  const profileRef = doc(db, "users", user.uid);
  let profileSnap = await getDoc(profileRef);
  if (!profileSnap.exists()) {
    const created: UserProfile = {
      uid: user.uid,
      email: user.email ?? membership.email ?? "",
      displayName: membership.displayName || user.displayName || "Team member",
      photoUrl: user.photoURL ?? undefined,
      defaultTeamId: TEAM_ID,
      onboardingComplete: membership.role !== "athlete",
      createdAt: stamp(),
      updatedAt: stamp(),
      createdBy: user.uid,
      updatedBy: user.uid,
    };
    await setDoc(profileRef, created);
    profileSnap = await getDoc(profileRef);
  }
  membership = { ...membership, id: undefined } as unknown as Membership;
  const profile = raw<UserProfile>(profileSnap);
  return {
    uid: user.uid,
    email: user.email ?? profile.email,
    displayName: profile.displayName,
    teamId: TEAM_ID,
    membership,
    profile,
  };
}

async function readCollection<T>(...segments: string[]): Promise<T[]> {
  const { db } = await getFirebaseServices();
  const snapshot = await getDocs(collection(db, ...segments));
  return list<T>(snapshot.docs);
}

export class FirebaseGateway implements AppGateway {
  readonly mode = "firebase" as const;

  diagnostics(): AppDiagnostics {
    return {
      dataMode: "firebase",
      releaseChannel: env.releaseChannel,
      buildSha: env.buildSha,
      online: navigator.onLine,
      firebaseProjectId: env.firebase.projectId,
      appCheckConfigured: Boolean(env.appCheckSiteKey),
      emulatorMode: env.useEmulators,
    };
  }

  subscribeAuth(listener: (session: AuthSession | null) => void): () => void {
    let active = true;
    let unsubscribe = () => undefined;
    void getFirebaseServices().then(({ auth }) => {
      void getRedirectResult(auth).catch(() => undefined);
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!active) return;
        if (!user) return listener(null);
        try {
          listener(await resolveSession(user));
        } catch (error) {
          console.error("Unable to resolve authorized team session", error);
          listener(null);
        }
      });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }

  async signInEmail(input: { email: string; password: string }): Promise<AuthSession> {
    const { auth } = await getFirebaseServices();
    const result = await signInWithEmailAndPassword(auth, input.email.trim(), input.password);
    return resolveSession(result.user);
  }

  async signInGoogle(): Promise<AuthSession> {
    const { auth } = await getFirebaseServices();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const mobile = matchMedia("(max-width: 700px), (pointer: coarse)").matches;
    if (mobile) {
      await signInWithRedirect(auth, provider);
      return new Promise<AuthSession>(() => undefined);
    }
    try {
      const result = await signInWithPopup(auth, provider);
      return resolveSession(result.user);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
      if (["auth/popup-blocked", "auth/cancelled-popup-request", "auth/operation-not-supported-in-this-environment"].includes(code)) {
        await signInWithRedirect(auth, provider);
        return new Promise<AuthSession>(() => undefined);
      }
      throw error;
    }
  }

  async signInDemo(_role: Role): Promise<AuthSession> {
    throw new Error("Demo role switching is unavailable in Firebase mode.");
  }

  async signOut(): Promise<void> {
    const { auth } = await getFirebaseServices();
    await firebaseSignOut(auth);
  }

  async completeOnboarding(session: AuthSession): Promise<UserProfile> {
    const { db } = await getFirebaseServices();
    const ref = doc(db, "users", session.uid);
    await updateDoc(ref, { onboardingComplete: true, updatedAt: stamp(), updatedBy: session.uid });
    return { ...session.profile, onboardingComplete: true, updatedAt: stamp(), updatedBy: session.uid };
  }

  async loadBundle(session: AuthSession): Promise<AppBundle> {
    const { db } = await getFirebaseServices();
    const teamSnap = await getDoc(doc(db, "teams", session.teamId));
    if (!teamSnap.exists()) throw new Error("Team configuration is missing.");
    const team = raw<Team>(teamSnap);
    const seasonId = team.activeSeasonId;
    const seasonSnap = await getDoc(doc(db, "teams", session.teamId, "seasons", seasonId));
    if (!seasonSnap.exists()) throw new Error("Active season configuration is missing.");
    const season = raw<Season>(seasonSnap);
    const practiceQuery = query(
      collection(db, "teams", session.teamId, "practiceSessions"),
      where("seasonId", "==", seasonId),
      orderBy("dateKey", "desc"),
      limit(10),
    );
    const practiceDocs = (await getDocs(practiceQuery)).docs.map((item) => raw<PracticeSession>(item));
    const currentSession = practiceDocs.find((item) => item.dateKey === dateKey()) ?? practiceDocs[0];

    const shared = await Promise.all([
      readCollection<ExampleBucket>("teams", session.teamId, "exampleBuckets"),
      readCollection<CurriculumLesson>("teams", session.teamId, "curriculum"),
      readCollection<TeamWin>("teams", session.teamId, "teamWins"),
      readCollection<TeamChallenge>("teams", session.teamId, "teamChallenges"),
      readCollection<TechniqueTerm>("teams", session.teamId, "techniqueTerms"),
      currentSession ? readCollection<BoardEntry>("teams", session.teamId, "practiceSessions", currentSession.id, "boardEntries") : Promise.resolve([]),
    ]);
    const [exampleBuckets, curriculum, teamWins, challenges, terms, boardEntries] = shared;

    const isAthlete = session.membership.role === "athlete";
    let currentCheckin: PrivatePracticeCheckin | undefined;
    let checkins: PrivatePracticeCheckin[] = [];
    let lessonProgress: LessonProgress[] = [];
    let goals: Goal[] = [];
    let evidence: ConfidenceEvidence[] = [];
    let toolkit: ToolkitItem[] = [];
    let competitionPlans: CompetitionPlan[] = [];
    let memberships: Membership[] = [session.membership];
    let invites: TeamInvite[] = [];

    if (isAthlete) {
      const athleteRoot = ["teams", session.teamId, "athletes", session.uid] as const;
      const own = await Promise.all([
        currentSession ? getDoc(doc(db, ...athleteRoot, "privateCheckins", `${currentSession.id}-${session.uid}`)) : Promise.resolve(undefined),
        readCollection<PrivatePracticeCheckin>(...athleteRoot, "privateCheckins"),
        readCollection<LessonProgress>(...athleteRoot, "lessonProgress"),
        readCollection<Goal>(...athleteRoot, "goals"),
        readCollection<ConfidenceEvidence>(...athleteRoot, "confidenceEvidence"),
        readCollection<ToolkitItem>(...athleteRoot, "toolkit"),
        readCollection<CompetitionPlan>(...athleteRoot, "competitionPlans"),
      ]);
      const [checkinSnap, checkinRows, progressRows, goalRows, evidenceRows, toolkitRows, planRows] = own;
      if (checkinSnap && checkinSnap.exists()) currentCheckin = raw<PrivatePracticeCheckin>(checkinSnap);
      checkins = checkinRows;
      lessonProgress = progressRows;
      goals = goalRows;
      evidence = evidenceRows;
      toolkit = toolkitRows;
      competitionPlans = planRows;
    } else {
      memberships = (await readCollection<Membership>("teams", session.teamId, "members")).filter((item) => item.active);
      if (session.membership.role === "admin") invites = await readCollection<TeamInvite>("teams", session.teamId, "invites");
      if (["coach", "admin"].includes(session.membership.role)) {
        const athleteMembers = memberships.filter((item) => item.role === "athlete");
        const coachEvidence = await Promise.all(athleteMembers.map(async (member) => {
          const rows = await readCollection<ConfidenceEvidence>("teams", session.teamId, "athletes", member.uid, "confidenceEvidence");
          return rows.filter((item) => item.visibility === "coach_visible");
        }));
        evidence = coachEvidence.flat();
      }
    }

    return {
      team,
      season,
      currentSession,
      currentCheckin,
      checkins,
      boardEntries,
      exampleBuckets: exampleBuckets.filter((item) => item.active),
      curriculum: curriculum.filter((item) => item.status !== "archived").sort((a, b) => a.week - b.week),
      lessonProgress,
      goals,
      evidence: evidence.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
      toolkit,
      competitionPlans: competitionPlans.sort((a, b) => a.eventDate.localeCompare(b.eventDate)),
      teamWins: teamWins.filter((item) => item.status === "published").sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")),
      challenges: challenges.filter((item) => item.status !== "archived"),
      terms: terms.filter((item) => item.active),
      memberships,
      invites,
    };
  }

  subscribeCurrentPractice(session: AuthSession, listener: (practice?: PracticeSession) => void): () => void {
    let unsubscribe = () => undefined;
    void getFirebaseServices().then(({ db }) => {
      const q = query(
        collection(db, "teams", session.teamId, "practiceSessions"),
        where("seasonId", "==", session.membership.seasonId),
        orderBy("dateKey", "desc"),
        limit(10),
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        const sessions = snapshot.docs.map((item) => raw<PracticeSession>(item));
        listener(sessions.find((item) => item.dateKey === dateKey()) ?? sessions[0]);
      });
    });
    return () => unsubscribe();
  }

  subscribeBoardEntries(teamId: string, practiceSessionId: string, listener: (entries: BoardEntry[]) => void): () => void {
    let unsubscribe = () => undefined;
    void getFirebaseServices().then(({ db }) => {
      const q = query(collection(db, "teams", teamId, "practiceSessions", practiceSessionId, "boardEntries"), orderBy("boardDisplayName"));
      unsubscribe = onSnapshot(q, (snapshot) => listener(snapshot.docs.map((item) => raw<BoardEntry>(item))));
    });
    return () => unsubscribe();
  }

  async saveBeforePractice({ session, practiceSession, data }: BeforePracticeInput): Promise<PrivatePracticeCheckin> {
    requireRole(session, ["athlete"]);
    const { db } = await getFirebaseServices();
    const current = stamp();
    const id = `${practiceSession.id}-${session.uid}`;
    const privateRef = doc(db, "teams", session.teamId, "athletes", session.uid, "privateCheckins", id);
    const existing = await getDoc(privateRef);
    const checkin: PrivatePracticeCheckin = {
      id,
      teamId: session.teamId,
      seasonId: practiceSession.seasonId,
      sessionId: practiceSession.id,
      athleteUid: session.uid,
      before: { ...data, completedAt: data.completedAt ?? current },
      ...(existing.exists() && existing.data().after ? { after: existing.data().after } : {}),
      createdAt: existing.exists() ? String(existing.data().createdAt) : current,
      updatedAt: current,
      createdBy: existing.exists() ? String(existing.data().createdBy ?? session.uid) : session.uid,
      updatedBy: session.uid,
    };
    const board: BoardEntry = {
      athleteUid: session.uid,
      boardDisplayName: session.membership.boardDisplayName,
      focusText: data.focusText,
      ...(data.pillar ? { pillar: data.pillar } : {}),
      state: "ready",
      reflectionComplete: false,
      updatedAt: current,
    };
    const batch = writeBatch(db);
    batch.set(privateRef, checkin);
    batch.set(doc(db, "teams", session.teamId, "practiceSessions", practiceSession.id, "boardEntries", session.uid), board);
    await batch.commit();
    return checkin;
  }

  async saveAfterPractice({ session, checkin, data, saveEvidence, evidenceText, evidenceTags }: AfterPracticeInput): Promise<{ checkin: PrivatePracticeCheckin; evidence?: ConfidenceEvidence }> {
    requireRole(session, ["athlete"]);
    const { db } = await getFirebaseServices();
    const current = stamp();
    const privateRef = doc(db, "teams", session.teamId, "athletes", session.uid, "privateCheckins", checkin.id);
    const updated: PrivatePracticeCheckin = { ...checkin, after: { ...data, completedAt: data.completedAt ?? current }, updatedAt: current, updatedBy: session.uid };
    const usefulText = (evidenceText || data.wentWell || "").trim();
    let evidence: ConfidenceEvidence | undefined;
    const batch = writeBatch(db);
    if (saveEvidence && usefulText) {
      evidence = {
        id: createId("evidence"), athleteUid: session.uid, text: usefulText, source: "practice",
        sourceRef: { kind: "practice", id: checkin.sessionId }, contextLabel: "Practice", occurredAt: current,
        tags: [...new Set([...(evidenceTags ?? []), "practice", data.workedOnFocus === "yes" ? "follow-through" : "learning"])],
        pillar: checkin.before.pillar, visibility: "private", pinned: false, archived: false,
        createdAt: current, updatedAt: current, createdBy: session.uid, updatedBy: session.uid,
      };
      updated.evidenceId = evidence.id;
      batch.set(doc(db, "teams", session.teamId, "athletes", session.uid, "confidenceEvidence", evidence.id), evidence);
    }
    batch.set(privateRef, updated);
    batch.update(doc(db, "teams", session.teamId, "practiceSessions", checkin.sessionId, "boardEntries", session.uid), { reflectionComplete: true, updatedAt: current });
    await batch.commit();
    return { checkin: updated, evidence };
  }

  async saveGoal(session: AuthSession, input: Partial<Goal> & Pick<Goal, "text" | "level">): Promise<Goal> {
    requireRole(session, ["athlete"]);
    const { db } = await getFirebaseServices();
    const current = stamp();
    const goal: Goal = {
      id: input.id ?? createId("goal"), athleteUid: session.uid, seasonId: input.seasonId ?? DEFAULT_SEASON_ID,
      level: input.level, text: input.text.trim(), parentGoalId: input.parentGoalId, evidenceDefinition: input.evidenceDefinition,
      status: input.status ?? "active", targetDate: input.targetDate, createdAt: input.createdAt ?? current,
      updatedAt: current, createdBy: input.createdBy ?? session.uid, updatedBy: session.uid,
    };
    await setDoc(doc(db, "teams", session.teamId, "athletes", session.uid, "goals", goal.id), goal);
    return goal;
  }

  async saveEvidence(session: AuthSession, input: Partial<ConfidenceEvidence> & Pick<ConfidenceEvidence, "text">): Promise<ConfidenceEvidence> {
    requireRole(session, ["athlete", "coach", "admin"]);
    const { db } = await getFirebaseServices();
    const current = stamp();
    const athleteUid = input.athleteUid ?? session.uid;
    const item: ConfidenceEvidence = {
      id: input.id ?? createId("evidence"), athleteUid, text: input.text.trim(), source: input.source ?? (session.membership.role === "athlete" ? "self" : "coach"),
      sourceAuthorUid: input.sourceAuthorUid ?? session.uid, sourceAuthorName: input.sourceAuthorName ?? session.displayName,
      sourceRef: input.sourceRef, contextLabel: input.contextLabel, occurredAt: input.occurredAt ?? current, tags: input.tags ?? [],
      pillar: input.pillar, visibility: input.visibility ?? (session.membership.role === "athlete" ? "private" : "coach_visible"),
      pinned: input.pinned ?? false, archived: input.archived ?? false, resurfacedAt: input.resurfacedAt,
      resurfacedContexts: input.resurfacedContexts, createdAt: input.createdAt ?? current, updatedAt: current,
      createdBy: input.createdBy ?? session.uid, updatedBy: session.uid,
    };
    await setDoc(doc(db, "teams", session.teamId, "athletes", athleteUid, "confidenceEvidence", item.id), item);
    return item;
  }

  async updateEvidence(session: AuthSession, evidenceId: string, patch: Partial<ConfidenceEvidence>): Promise<ConfidenceEvidence> {
    const { db } = await getFirebaseServices();
    const athleteUid = patch.athleteUid ?? session.uid;
    const ref = doc(db, "teams", session.teamId, "athletes", athleteUid, "confidenceEvidence", evidenceId);
    const existing = await getDoc(ref);
    if (!existing.exists()) throw new Error("Evidence was not found.");
    await updateDoc(ref, { ...patch, updatedAt: stamp(), updatedBy: session.uid });
    return { ...raw<ConfidenceEvidence>(existing), ...patch, updatedAt: stamp(), updatedBy: session.uid };
  }

  async recordEvidenceResurface(session: AuthSession, evidenceIds: string[], context: NonNullable<ConfidenceEvidence["resurfacedContexts"]>[number]): Promise<void> {
    const { db } = await getFirebaseServices();
    const current = stamp();
    const batch = writeBatch(db);
    for (const id of evidenceIds) {
      const ref = doc(db, "teams", session.teamId, "athletes", session.uid, "confidenceEvidence", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) continue;
      const previous = (snap.data().resurfacedContexts ?? []) as string[];
      batch.update(ref, { resurfacedAt: current, resurfacedContexts: [...new Set([...previous, context])], updatedAt: current });
    }
    await batch.commit();
  }

  async saveToolkitItem(session: AuthSession, input: Partial<ToolkitItem> & Pick<ToolkitItem, "kind" | "title" | "text">): Promise<ToolkitItem> {
    requireRole(session, ["athlete"]);
    const { db } = await getFirebaseServices();
    const current = stamp();
    const item: ToolkitItem = {
      id: input.id ?? createId("tool"), athleteUid: session.uid, kind: input.kind, title: input.title.trim(), text: input.text.trim(),
      sourceRef: input.sourceRef, tags: input.tags ?? [], active: input.active ?? true,
      createdAt: input.createdAt ?? current, updatedAt: current, createdBy: input.createdBy ?? session.uid, updatedBy: session.uid,
    };
    await setDoc(doc(db, "teams", session.teamId, "athletes", session.uid, "toolkit", item.id), item);
    return item;
  }

  async saveLessonProgress(session: AuthSession, input: Partial<LessonProgress> & Pick<LessonProgress, "lessonId" | "status">): Promise<LessonProgress> {
    requireRole(session, ["athlete"]);
    const { db } = await getFirebaseServices();
    const current = stamp();
    const item: LessonProgress = {
      id: input.id ?? `${session.uid}-${input.lessonId}`, athleteUid: session.uid, lessonId: input.lessonId, status: input.status,
      outputText: input.outputText, outputType: input.outputType, appliedToSessionId: input.appliedToSessionId,
      completedAt: input.status === "completed" ? (input.completedAt ?? current) : input.completedAt,
      createdAt: input.createdAt ?? current, updatedAt: current, createdBy: input.createdBy ?? session.uid, updatedBy: session.uid,
    };
    await setDoc(doc(db, "teams", session.teamId, "athletes", session.uid, "lessonProgress", item.id), item);
    return item;
  }

  async saveCompetitionPlan(session: AuthSession, input: Partial<CompetitionPlan> & Pick<CompetitionPlan, "eventName" | "eventDate">): Promise<CompetitionPlan> {
    requireRole(session, ["athlete"]);
    const { db } = await getFirebaseServices();
    const current = stamp();
    const item: CompetitionPlan = {
      id: input.id ?? createId("competition"), athleteUid: session.uid, seasonId: input.seasonId ?? DEFAULT_SEASON_ID,
      eventName: input.eventName.trim(), eventDate: input.eventDate, status: input.status ?? "active", outcomeDirection: input.outcomeDirection,
      processGoals: input.processGoals ?? [], pillar: input.pillar, firstJob: input.firstJob ?? "", cue: input.cue ?? "",
      routineSteps: input.routineSteps ?? [], ifThenPlans: input.ifThenPlans ?? [], betweenPeriods: input.betweenPeriods,
      betweenMatches: input.betweenMatches, reflection: input.reflection,
      createdAt: input.createdAt ?? current, updatedAt: current, createdBy: input.createdBy ?? session.uid, updatedBy: session.uid,
    };
    await setDoc(doc(db, "teams", session.teamId, "athletes", session.uid, "competitionPlans", item.id), item);
    return item;
  }

  async createPracticeSession(session: AuthSession, input: Partial<PracticeSession>): Promise<PracticeSession> {
    requireRole(session, ["coach", "admin"]);
    const { db } = await getFirebaseServices();
    const current = stamp();
    const item: PracticeSession = {
      id: input.id ?? createId("practice"), teamId: session.teamId, seasonId: input.seasonId ?? session.membership.seasonId,
      dateKey: input.dateKey ?? dateKey(), startsAt: input.startsAt ?? current, teamTheme: input.teamTheme,
      curriculumLessonId: input.curriculumLessonId, boardStatus: input.boardStatus ?? "draft", closingPrompt: input.closingPrompt,
      createdAt: current, updatedAt: current, createdBy: session.uid, updatedBy: session.uid,
    };
    await setDoc(doc(db, "teams", session.teamId, "practiceSessions", item.id), item);
    return item;
  }

  async updatePracticeSession(session: AuthSession, practiceSessionId: string, patch: Partial<PracticeSession>): Promise<PracticeSession> {
    requireRole(session, ["coach", "admin"]);
    const { db } = await getFirebaseServices();
    const ref = doc(db, "teams", session.teamId, "practiceSessions", practiceSessionId);
    const existing = await getDoc(ref);
    if (!existing.exists()) throw new Error("Practice session was not found.");
    const safePatch: Record<string, unknown> = { ...patch, updatedAt: stamp(), updatedBy: session.uid };
    for (const [key, value] of Object.entries(safePatch)) if (value === undefined) safePatch[key] = deleteField();
    await updateDoc(ref, safePatch);
    return { ...raw<PracticeSession>(existing), ...patch, updatedAt: stamp(), updatedBy: session.uid };
  }

  async saveCoachRecognition(input: CoachRecognitionInput): Promise<ConfidenceEvidence> {
    requireRole(input.session, ["coach", "admin"]);
    const recognitionId = createId("recognition");
    const evidence = await this.saveEvidence(input.session, {
      athleteUid: input.athleteUid, text: input.text, source: "coach", sourceAuthorUid: input.session.uid,
      sourceAuthorName: input.session.displayName, sourceRef: { kind: "recognition", id: recognitionId },
      contextLabel: "Coach noticed", tags: input.tags, pillar: input.pillar, visibility: "coach_visible",
    });
    await this.saveTeamWin(input.session, {
      title: "Coach noticed", text: input.text, kind: "coach_noticed", pillar: input.pillar,
      athleteUid: input.athleteUid, athleteDisplayName: input.athleteDisplayName,
    });
    return evidence;
  }

  async saveTeamWin(session: AuthSession, input: Partial<TeamWin> & Pick<TeamWin, "title" | "text" | "kind">): Promise<TeamWin> {
    requireRole(session, ["coach", "admin"]);
    const { db } = await getFirebaseServices();
    const current = stamp();
    const item: TeamWin = {
      id: input.id ?? createId("win"), title: input.title.trim(), text: input.text.trim(), pillar: input.pillar,
      skillTag: input.skillTag, status: input.status ?? "published", publishedAt: input.publishedAt ?? current,
      athleteUid: input.athleteUid, athleteDisplayName: input.athleteDisplayName, kind: input.kind,
      createdAt: input.createdAt ?? current, updatedAt: current, createdBy: input.createdBy ?? session.uid, updatedBy: session.uid,
    };
    await setDoc(doc(db, "teams", session.teamId, "teamWins", item.id), item);
    return item;
  }

  async saveTeamChallenge(session: AuthSession, input: Partial<TeamChallenge> & Pick<TeamChallenge, "title" | "description" | "target" | "unit">): Promise<TeamChallenge> {
    requireRole(session, ["coach", "admin"]);
    const { db } = await getFirebaseServices();
    const current = stamp();
    const item: TeamChallenge = {
      id: input.id ?? createId("challenge"), title: input.title.trim(), description: input.description.trim(), target: input.target,
      current: input.current ?? 0, unit: input.unit, status: input.status ?? "active", endsOn: input.endsOn,
      createdAt: input.createdAt ?? current, updatedAt: current, createdBy: input.createdBy ?? session.uid, updatedBy: session.uid,
    };
    await setDoc(doc(db, "teams", session.teamId, "teamChallenges", item.id), item);
    return item;
  }

  async saveExampleBucket(session: AuthSession, bucket: ExampleBucket): Promise<ExampleBucket> {
    requireRole(session, ["coach", "admin"]);
    const { db } = await getFirebaseServices();
    const item = { ...bucket, updatedAt: stamp(), updatedBy: session.uid };
    await setDoc(doc(db, "teams", session.teamId, "exampleBuckets", item.id), item);
    return item;
  }

  async saveCurriculumLesson(session: AuthSession, lesson: CurriculumLesson): Promise<CurriculumLesson> {
    requireRole(session, ["coach", "admin"]);
    const { db } = await getFirebaseServices();
    const item = { ...lesson, updatedAt: stamp(), updatedBy: session.uid };
    await setDoc(doc(db, "teams", session.teamId, "curriculum", item.id), item);
    return item;
  }

  async saveTechniqueTerm(session: AuthSession, term: TechniqueTerm): Promise<TechniqueTerm> {
    requireRole(session, ["coach", "admin"]);
    const { db } = await getFirebaseServices();
    const item = { ...term, active: term.status === "rejected" ? false : term.active, updatedAt: stamp(), updatedBy: session.uid };
    await setDoc(doc(db, "teams", session.teamId, "techniqueTerms", item.id), item);
    return item;
  }

  async saveMembership(session: AuthSession, membership: Membership): Promise<Membership> {
    requireRole(session, ["admin"]);
    const { db } = await getFirebaseServices();
    const item = { ...membership, updatedAt: stamp(), updatedBy: session.uid };
    await setDoc(doc(db, "teams", session.teamId, "members", item.uid), item);
    return item;
  }

  async saveInvite(session: AuthSession, input: Omit<TeamInvite, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<TeamInvite> {
    requireRole(session, ["admin"]);
    const { db } = await getFirebaseServices();
    const current = stamp();
    const item: TeamInvite = {
      ...input,
      id: input.id ?? inviteId(input.email),
      email: input.email.trim().toLowerCase(),
      createdAt: current,
      updatedAt: current,
      createdBy: session.uid,
      updatedBy: session.uid,
    };
    await setDoc(doc(db, "teams", session.teamId, "invites", item.id), item);
    return item;
  }

  async exportSeason(session: AuthSession): Promise<Record<string, unknown>> {
    requireRole(session, ["admin"]);
    const bundle = await this.loadBundle(session);
    const { db } = await getFirebaseServices();
    const athleteMembers = bundle.memberships.filter((item) => item.role === "athlete");
    const athletes = await Promise.all(athleteMembers.map(async (member) => ({
      member,
      checkins: await readCollection<PrivatePracticeCheckin>("teams", session.teamId, "athletes", member.uid, "privateCheckins"),
      goals: await readCollection<Goal>("teams", session.teamId, "athletes", member.uid, "goals"),
      evidence: await readCollection<ConfidenceEvidence>("teams", session.teamId, "athletes", member.uid, "confidenceEvidence"),
      toolkit: await readCollection<ToolkitItem>("teams", session.teamId, "athletes", member.uid, "toolkit"),
      plans: await readCollection<CompetitionPlan>("teams", session.teamId, "athletes", member.uid, "competitionPlans"),
      lessons: await readCollection<LessonProgress>("teams", session.teamId, "athletes", member.uid, "lessonProgress"),
    })));
    void db;
    return { exportedAt: stamp(), team: bundle.team, season: bundle.season, sessions: bundle.currentSession ? [bundle.currentSession] : [], athletes, content: { curriculum: bundle.curriculum, examples: bundle.exampleBuckets, terms: bundle.terms, teamWins: bundle.teamWins, challenges: bundle.challenges } };
  }
}
