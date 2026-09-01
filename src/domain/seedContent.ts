import { BRAND, DEFAULT_SEASON_ID, TEAM_ID, TEAM_TIMEZONE } from "./constants";
import type {
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
  Season,
  Team,
  TeamChallenge,
  TeamInvite,
  TeamWin,
  TechniqueTerm,
  ToolkitItem,
  UserProfile,
} from "./types";

const iso = (date: Date): string => date.toISOString();
const nowIso = (): string => iso(new Date());
const dateKey = (date = new Date()): string => date.toLocaleDateString("en-CA", { timeZone: TEAM_TIMEZONE });
const daysFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return iso(date);
};
const daysAgo = (days: number): string => daysFromNow(-days);

const audit = (by = "system") => ({
  createdAt: nowIso(),
  updatedAt: nowIso(),
  createdBy: by,
  updatedBy: by,
});

export const seedTeam: Team = {
  id: TEAM_ID,
  name: "Merrill Girls Wrestling",
  shortName: "Merrill Girls",
  timezone: TEAM_TIMEZONE,
  activeSeasonId: DEFAULT_SEASON_ID,
  primaryLogoPath: BRAND.primaryLogo,
  compactLogoPath: BRAND.compactLogo,
  settings: {
    fiveCsRequired: false,
    athleteReflectionsCoachVisible: false,
    coachCanReadFiveCs: false,
    practiceFocusMaxLength: 80,
    defaultResetSeconds: 30,
    allowGoogleSignIn: true,
    allowEmailPasswordSignIn: true,
  },
  ...audit(),
};

export const seedSeason: Season = {
  id: DEFAULT_SEASON_ID,
  teamId: TEAM_ID,
  name: "2026-27 Girls Wrestling",
  startsOn: "2026-08-17",
  endsOn: "2027-03-06",
  status: "active",
  ...audit(),
};

export const seedExampleBuckets: ExampleBucket[] = [
  {
    id: "practice-focus",
    key: "practice_focus",
    prompt: "What's your 1% today?",
    why: "Choose one clear, controllable job you can use during practice.",
    examples: [
      "Single-leg finish",
      "Fast stand-up on bottom",
      "Stay calm after a mistake",
      "Hand-fighting to set up shots",
      "Good stance the whole time",
      "Move my feet on shots",
      "Quicker set-ups",
      "Breathe between goes",
    ],
    active: true,
    sortOrder: 1,
    sourceLabel: "arnie_primary",
    ...audit(),
  },
  {
    id: "show-up",
    key: "show_up",
    prompt: "How will I show up today?",
    why: "Decide how you want to enter the room before practice decides for you.",
    examples: [
      "Calm and confident",
      "Focus on clean technique",
      "Be first to ties",
      "Breathe and reset fast",
      "Coachable",
      "Aggressive but controlled",
      "Compete every rep",
    ],
    active: true,
    sortOrder: 2,
    sourceLabel: "arnie_primary",
    ...audit(),
  },
  {
    id: "went-well",
    key: "went_well",
    prompt: "What went well?",
    why: "Find evidence of progress, effort, response, or learning.",
    examples: [
      "Good stance the whole time",
      "Hit my escape first try",
      "Stayed calm during a tough drill",
      "I listened and corrected it",
      "I kept wrestling after a mistake",
      "I helped a teammate",
    ],
    active: true,
    sortOrder: 3,
    sourceLabel: "arnie_primary",
    ...audit(),
  },
  {
    id: "improve",
    key: "improve",
    prompt: "What's one adjustment?",
    why: "Name the next useful change without turning reflection into self-criticism.",
    examples: [
      "Move my feet on shots",
      "Quicker set-ups",
      "Breathe between goes",
      "Stay lower late",
      "Reset faster",
      "Ask for feedback on one position",
    ],
    active: true,
    sortOrder: 4,
    sourceLabel: "arnie_primary",
    ...audit(),
  },
  {
    id: "gratitude",
    key: "gratitude",
    prompt: "What supported you today?",
    why: "Notice the people, body, and opportunities that help you grow.",
    examples: ["Teammates", "Coach feedback", "Healthy body", "Family support", "The chance to compete", "Someone who pushed me"],
    active: true,
    sortOrder: 5,
    sourceLabel: "arnie_primary",
    ...audit(),
  },
  {
    id: "reset",
    key: "reset",
    prompt: "What's your next cue?",
    why: "Return attention to one useful action.",
    examples: ["Breathe", "Center", "Next exchange", "One job", "Back to my wrestling"],
    active: true,
    sortOrder: 6,
    sourceLabel: "starter",
    ...audit(),
  },
];

export const seedCurriculum: CurriculumLesson[] = [
  {
    id: "week-00-welcome",
    week: 0,
    title: "Train the mental game",
    skillKey: "welcome",
    whyItMatters: "Mental skills improve through explanation, practice, feedback, and use. This app helps you practice one useful skill at a time, then put the phone away and use it in wrestling.",
    examples: ["Choose one 1% focus", "Use a short cue", "Notice what helped", "Keep evidence that matters"],
    tryItNow: { kind: "planning", title: "Choose your first job", instructions: ["Pick one action you can control today.", "Keep it short enough to remember during a rep."] },
    useItToday: "Set one clear 1% before practice and tell yourself why it matters.",
    reflectPrompt: "Did the focus help you know what to return to during practice?",
    saveTarget: "goal",
    status: "published",
    ...audit(),
  },
  {
    id: "week-01-controllables",
    week: 1,
    title: "Control your job",
    skillKey: "controllables",
    whyItMatters: "Winning matters, but you cannot directly control every result. You can control the next action, your preparation, your response, and the quality of the rep in front of you.",
    examples: ["Good stance through the whole go", "Be first to contact", "Reset after the whistle", "Attack after my setup"],
    tryItNow: { kind: "reflection", title: "Turn an outcome into an action", instructions: ["Think of one result you want.", "Write the behavior that would move you toward it today."] },
    useItToday: "When your mind jumps to winning or losing, return to the job you chose.",
    reflectPrompt: "What controllable action did you return to most often?",
    saveTarget: "goal",
    status: "published",
    ...audit(),
  },
  {
    id: "week-02-pillars",
    week: 2,
    title: "Pillars in action",
    skillKey: "pillars",
    whyItMatters: "Persistent, Consistent, Resilient, and Relentless are not labels you earn once. They are behaviors you can choose and show in a specific moment.",
    examples: ["Persistent: try the correction again", "Consistent: keep your stance late", "Resilient: return after a mistake", "Relentless: keep creating useful action"],
    tryItNow: { kind: "reflection", title: "Choose one Pillar", instructions: ["Pick the Pillar you need today.", "Name the behavior that would prove it."] },
    useItToday: "Show your chosen Pillar through one observable behavior.",
    reflectPrompt: "What did your Pillar look like in practice?",
    saveTarget: "evidence",
    status: "published",
    ...audit(),
  },
  {
    id: "week-03-five-cs",
    week: 3,
    title: "Know your Five Cs",
    skillKey: "five_cs",
    whyItMatters: "The Five Cs help you notice your current state. They are not a grade and they do not define you. The useful question is what changed and what helped.",
    examples: ["Commitment to the work", "Courage to engage", "Concentration on the job", "Control of your response", "Confidence from evidence"],
    tryItNow: { kind: "reflection", title: "Notice, do not judge", instructions: ["Rate each C honestly.", "Pick one C you can support with a behavior today."] },
    useItToday: "Use the rating to choose a helpful action, not to criticize yourself.",
    reflectPrompt: "Which C changed most, and what happened in practice?",
    saveTarget: "none",
    status: "published",
    ...audit(),
  },
  {
    id: "week-04-attention",
    week: 4,
    title: "Put attention on one job",
    skillKey: "attention",
    whyItMatters: "Pressure can pull attention toward the score, the crowd, a mistake, or what might happen. A short cue helps bring attention back to what your body should do next.",
    examples: ["Feet", "First contact", "Good stance", "Breathe", "Next exchange"],
    tryItNow: { kind: "planning", title: "Build a cue", instructions: ["Choose one or two words.", "Make sure the words point to an action you understand.", "Say the cue once, then picture the action."] },
    useItToday: "Use your cue before drilling starts and after every reset in live wrestling.",
    reflectPrompt: "When did your cue help you return to the job?",
    saveTarget: "cue",
    status: "published",
    ...audit(),
  },
  {
    id: "week-05-reset",
    week: 5,
    title: "Reset to the next exchange",
    skillKey: "reset",
    whyItMatters: "A reset does not erase what happened. It stops the last moment from stealing the next one. Your reset can use breath, posture, a cue, and one next action.",
    examples: ["Persistent - Consistent - Resilient - Relentless breathing", "Stand tall, easy exhale, one cue", "Optional Reset Sweep, then next job"],
    tryItNow: { kind: "reset_sweep", title: "Try a brief reset", durationSeconds: 30, instructions: ["Follow the dot with comfortable eyes.", "Breathe easily.", "Stop immediately if it feels uncomfortable.", "Finish with one next job."] },
    useItToday: "Practice the reset after a mistake or coach-created pressure moment, not only when you feel perfect.",
    reflectPrompt: "Which part of your reset helped you return fastest?",
    saveTarget: "cue",
    status: "published",
    ...audit(),
  },
  {
    id: "week-06-self-talk",
    week: 6,
    title: "Talk toward action",
    skillKey: "self_talk",
    whyItMatters: "You do not have to eliminate every unhelpful thought. You need language that directs attention toward a useful response.",
    examples: ["Instead of 'do not mess up,' use 'good stance'", "Instead of 'I cannot,' use 'one job'", "Instead of replaying the score, use 'next exchange'"],
    tryItNow: { kind: "reflection", title: "Rewrite one thought", instructions: ["Write one thought that pulls you away.", "Replace it with a short action cue."] },
    useItToday: "Notice the old story, then use the cue without arguing with yourself.",
    reflectPrompt: "What cue was more useful than the story in your head?",
    saveTarget: "cue",
    status: "published",
    ...audit(),
  },
  {
    id: "week-07-confidence-bank",
    week: 7,
    title: "Build confidence from proof",
    skillKey: "confidence",
    whyItMatters: "Confidence grows from preparation, progress, effective responses, coach feedback, and moments you have already handled. Save the proof so you can use it later.",
    examples: ["I did it in live", "Coach noticed the correction", "I came back after a mistake", "I repeated it under pressure"],
    tryItNow: { kind: "reflection", title: "Find three pieces of proof", instructions: ["Choose a preparation win.", "Choose a response win.", "Choose one skill or pressure win."] },
    useItToday: "After practice, save one moment that future you should remember.",
    reflectPrompt: "What did you prove today that deserves to stay in your bank?",
    saveTarget: "evidence",
    status: "published",
    ...audit(),
  },
  {
    id: "week-08-imagery",
    week: 8,
    title: "Rehearse the real thing",
    skillKey: "imagery",
    whyItMatters: "Useful imagery is specific. Rehearse the position, pace, environment, feeling, cue, and response you actually want to use.",
    examples: ["Feel your stance and first contact", "Hear the whistle", "Picture the correction", "Rehearse the reset after something goes wrong"],
    tryItNow: { kind: "imagery", title: "Thirty-second rehearsal", durationSeconds: 30, instructions: ["Choose one real skill or situation.", "See and feel the action at normal speed.", "Include your cue and the finish.", "End back in a ready position."] },
    useItToday: "Rehearse once before practice, then test the same cue during a real rep.",
    reflectPrompt: "What detail made the rehearsal feel most useful?",
    saveTarget: "imagery",
    status: "published",
    ...audit(),
  },
  {
    id: "week-09-routine",
    week: 9,
    title: "Build your routine",
    skillKey: "routine",
    whyItMatters: "A short routine creates a familiar path into performance. Practice it at ordinary events so it is available when pressure increases.",
    examples: ["Move", "Breathe", "Cue", "Stance", "First job"],
    tryItNow: { kind: "planning", title: "Make a five-step routine", instructions: ["Start with movement.", "Add one breath.", "Use one cue.", "Find your stance.", "Name the first job."] },
    useItToday: "Use the same sequence before a live go or practice match.",
    reflectPrompt: "Which routine step helped you feel most ready?",
    saveTarget: "routine",
    status: "published",
    ...audit(),
  },
  {
    id: "week-10-if-then",
    week: 10,
    title: "Plan for adversity",
    skillKey: "if_then",
    whyItMatters: "Challenges are easier to respond to when the next action is already decided. An if-then plan turns a predictable problem into a practiced response.",
    examples: ["If I give up first points, then I breathe and attack the next exchange", "If I feel rushed, then I slow the exhale and find my stance", "If I miss, then I finish the scramble and reset"],
    tryItNow: { kind: "planning", title: "Write three plans", instructions: ["Choose one match challenge.", "Choose one emotional challenge.", "Choose one between-match challenge.", "Give each a short, controllable response."] },
    useItToday: "Ask your coach to create one of the situations during practice and run the plan.",
    reflectPrompt: "Which if-then plan did you actually need?",
    saveTarget: "if_then",
    status: "published",
    ...audit(),
  },
  {
    id: "week-11-compete",
    week: 11,
    title: "Compete on purpose",
    skillKey: "competition_card",
    whyItMatters: "Competition day should remind you of the plan you already practiced. It should not overload you with new information.",
    examples: ["Pillar", "First job", "Cue", "Routine", "If-then plan", "Between-period reset"],
    tryItNow: { kind: "planning", title: "Build your competition card", instructions: ["Choose the first job.", "Choose the cue.", "Add the routine and one adversity plan.", "Keep the card short."] },
    useItToday: "Use the card before a live go, then make one adjustment instead of rewriting everything.",
    reflectPrompt: "What part of the card did you use when wrestling became difficult?",
    saveTarget: "routine",
    status: "published",
    ...audit(),
  },
  {
    id: "week-12-recovery",
    week: 12,
    title: "Recovery is training",
    skillKey: "recovery",
    whyItMatters: "Sleep, food, hydration, and downshifting help your body learn from training. Recovery is preparation, not a public score and not a reason for shame.",
    examples: ["Protect a consistent bedtime", "Have a simple post-practice food plan", "Bring water", "Use a short downshift routine"],
    tryItNow: { kind: "planning", title: "Choose one recovery behavior", instructions: ["Pick one behavior you can control tonight.", "Make it specific and realistic.", "Decide when and where it will happen."] },
    useItToday: "Complete the behavior after practice without trying to fix everything at once.",
    reflectPrompt: "Did the plan make recovery easier to start?",
    saveTarget: "goal",
    status: "published",
    ...audit(),
  },
  {
    id: "week-13-reflection",
    week: 13,
    title: "Learn without tearing yourself down",
    skillKey: "reflection",
    whyItMatters: "A useful review separates what worked from the next adjustment. It creates information for the next practice instead of turning one result into a judgment about you.",
    examples: ["Went Well", "Improve", "Evidence", "Next 1%"],
    tryItNow: { kind: "reflection", title: "Run a four-part review", instructions: ["Name one thing that worked.", "Name one adjustment.", "Save one piece of proof if it matters.", "Choose the next 1%."] },
    useItToday: "Use the same review after both wins and losses.",
    reflectPrompt: "What did the review teach you that the result alone did not?",
    saveTarget: "evidence",
    status: "published",
    ...audit(),
  },
  {
    id: "week-14-team",
    week: 14,
    title: "Strengthen the room",
    skillKey: "team_culture",
    whyItMatters: "High standards and support can exist together. The room gets better when athletes help teammates learn, compete honestly, and return after difficult moments.",
    examples: ["Help a new wrestler understand the drill", "Recognize a teammate's response", "Bring energy without making it about you", "Respect opponents, officials, coaches, and self"],
    tryItNow: { kind: "reflection", title: "Recognize a behavior", instructions: ["Think of one teammate action that strengthened practice.", "Name the specific behavior, not just 'good job.'"] },
    useItToday: "Tell the teammate what you noticed or share it through the coach-approved team process.",
    reflectPrompt: "How did someone else strengthen your practice today?",
    saveTarget: "none",
    status: "published",
    ...audit(),
  },
  {
    id: "week-15-pressure",
    week: 15,
    title: "Practice the pressure plan",
    skillKey: "pressure",
    whyItMatters: "A routine becomes dependable when it is used while the environment gets harder, not only when everything feels calm.",
    examples: ["Start behind", "Short time", "Crowd noise", "Coach-created consequence", "Unfamiliar partner"],
    tryItNow: { kind: "planning", title: "Choose one pressure test", instructions: ["Select a realistic pressure situation with your coach.", "Use the same routine, cue, and first job.", "Review the response, not just the result."] },
    useItToday: "Execute the routine during one coach-created pressure go.",
    reflectPrompt: "What stayed dependable when the pressure increased?",
    saveTarget: "evidence",
    status: "published",
    ...audit(),
  },
  {
    id: "week-16-manual",
    week: 16,
    title: "Build My Wrestling",
    skillKey: "performance_manual",
    whyItMatters: "The season should leave you with more than results. It should leave you knowing how you prepare, focus, reset, learn, and create confidence.",
    examples: ["Who I am", "What gets me ready", "My best cues", "When things go wrong", "What creates confidence", "What works for me"],
    tryItNow: { kind: "reflection", title: "Write the first version of your manual", instructions: ["Choose two identity words.", "Name the routine and cues that work.", "Name your reset.", "Select proof you want to remember.", "Choose the next-season starting focus."] },
    useItToday: "Review the manual with a coach and keep only what is truly useful.",
    reflectPrompt: "What do you know about yourself now that you did not know at the start?",
    saveTarget: "none",
    status: "published",
    ...audit(),
  },
];

const technique = (
  id: string,
  term: string,
  category: string,
  status: TechniqueTerm["status"],
  source: string,
  extras: Partial<TechniqueTerm> = {},
): TechniqueTerm => ({
  id,
  term,
  normalizedKey: term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  category,
  status,
  examples: [],
  source,
  aliases: [],
  active: status !== "legacy_verify" && status !== "rejected",
  ...audit(),
  ...extras,
});

export const seedTechniqueTerms: TechniqueTerm[] = [
  technique("persistent", "Persistent", "identity", "verified_arnie_primary", "Coach Arnie packet", { definition: "Keep working after failure, breakdown, or slow progress.", coachCue: "Persistent" }),
  technique("consistent", "Consistent", "identity", "verified_arnie_primary", "Coach Arnie packet", { definition: "Repeat habits, standards, and details reliably.", coachCue: "Consistent" }),
  technique("resilient", "Resilient", "identity", "verified_arnie_primary", "Coach Arnie packet", { definition: "Recover from setbacks and return to useful action.", coachCue: "Resilient" }),
  technique("relentless", "Relentless", "identity", "verified_arnie_primary", "Coach Arnie packet", { definition: "Keep creating useful action and pressure.", coachCue: "Relentless" }),
  technique("respectful", "Respectful", "identity", "verified_coach_merrill", "Merrill later program language", { definition: "Respect people, room, work, competition, and standards." }),
  technique("single-leg-finish", "Single-leg finish", "technical_focus", "verified_arnie_primary", "Coach Arnie example bank"),
  technique("fast-stand-up-bottom", "Fast stand-up on bottom", "technical_focus", "verified_arnie_primary", "Coach Arnie example bank"),
  technique("stay-calm-mistake", "Stay calm after a mistake", "mental_focus", "verified_arnie_primary", "Coach Arnie example bank"),
  technique("hand-fighting-setups", "Hand-fighting to set up shots", "technical_focus", "verified_arnie_primary", "Coach Arnie example bank"),
  technique("far-far", "far far", "unverified", "legacy_verify", "Legacy Merrill reconstruction", { notes: "Meaning must be coach verified before activation." }),
  technique("double-gotchya", "double gotchya", "unverified", "legacy_verify", "Legacy Merrill reconstruction", { notes: "Exact spelling preserved. Meaning must be coach verified." }),
  technique("funky-roll", "funky roll", "unverified", "legacy_verify", "Legacy Merrill reconstruction", { notes: "Meaning must be coach verified." }),
  technique("et-it", "ET / IT", "unverified", "legacy_verify", "Legacy Merrill reconstruction", { notes: "Expansion and meaning must be coach verified." }),
  technique("coffee-grinder", "coffee grinder", "unverified", "legacy_verify", "Legacy Merrill reconstruction", { notes: "Meaning must be coach verified." }),
  technique("pete-bar", "Pete bar", "unverified", "legacy_verify", "Legacy Merrill reconstruction", { notes: "Meaning must be coach verified." }),
  technique("randy-lewis", "Randy Lewis", "unverified", "legacy_verify", "Legacy Merrill reconstruction", { notes: "Specific Merrill use must be coach verified." }),
  technique("talvi", "Talvi", "unverified", "legacy_verify", "Legacy Merrill reconstruction", { notes: "Specific Merrill use must be coach verified." }),
  technique("run-pipe", "run pipe", "rejected", "rejected", "Coach Stutting rejection, 2026-08-25", { notes: "Do not display, seed, teach, or regenerate as Merrill terminology." }),
];

export interface DemoSeed {
  users: UserProfile[];
  memberships: Membership[];
  invites: TeamInvite[];
  team: Team;
  season: Season;
  sessions: PracticeSession[];
  boardEntries: Record<string, BoardEntry[]>;
  checkins: PrivatePracticeCheckin[];
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
}

export const DEMO_ACCOUNTS = [
  { role: "athlete" as const, email: "athlete@merrill.demo", password: "demo1234", label: "Athlete demo" },
  { role: "coach" as const, email: "coach@merrill.demo", password: "demo1234", label: "Coach demo" },
  { role: "admin" as const, email: "admin@merrill.demo", password: "demo1234", label: "Admin demo" },
  { role: "board" as const, email: "board@merrill.demo", password: "demo1234", label: "Practice Board demo" },
];

export function createDemoSeed(): DemoSeed {
  const stamp = nowIso();
  const today = dateKey();
  const sessionId = `practice-${today}`;
  const members: Array<{ uid: string; role: Membership["role"]; name: string; board: string; email: string }> = [
    { uid: "athlete-avery", role: "athlete", name: "Avery Demo", board: "Avery", email: "athlete@merrill.demo" },
    { uid: "athlete-maya", role: "athlete", name: "Maya Demo", board: "Maya", email: "maya@merrill.demo" },
    { uid: "athlete-emma", role: "athlete", name: "Emma Demo", board: "Emma", email: "emma@merrill.demo" },
    { uid: "athlete-chloe", role: "athlete", name: "Chloe Demo", board: "Chloe", email: "chloe@merrill.demo" },
    { uid: "athlete-nora", role: "athlete", name: "Nora Demo", board: "Nora", email: "nora@merrill.demo" },
    { uid: "athlete-lily", role: "athlete", name: "Lily Demo", board: "Lily", email: "lily@merrill.demo" },
    { uid: "athlete-zoe", role: "athlete", name: "Zoe Demo", board: "Zoe", email: "zoe@merrill.demo" },
    { uid: "athlete-riley", role: "athlete", name: "Riley Demo", board: "Riley", email: "riley@merrill.demo" },
    { uid: "coach-demo", role: "coach", name: "Coach Demo", board: "Coach", email: "coach@merrill.demo" },
    { uid: "admin-demo", role: "admin", name: "Program Admin", board: "Admin", email: "admin@merrill.demo" },
    { uid: "board-demo", role: "board", name: "Practice Board", board: "Board", email: "board@merrill.demo" },
  ];
  const memberships: Membership[] = members.map((item) => ({
    uid: item.uid,
    role: item.role,
    displayName: item.name,
    boardDisplayName: item.board,
    active: true,
    seasonId: DEFAULT_SEASON_ID,
    email: item.email,
    createdAt: stamp,
    updatedAt: stamp,
  }));
  const users: UserProfile[] = members.map((item) => ({
    uid: item.uid,
    email: item.email,
    displayName: item.name,
    defaultTeamId: TEAM_ID,
    onboardingComplete: item.role !== "athlete" || item.uid !== "athlete-avery",
    createdAt: stamp,
    updatedAt: stamp,
  }));

  const sessions: PracticeSession[] = [
    {
      id: sessionId,
      teamId: TEAM_ID,
      seasonId: DEFAULT_SEASON_ID,
      dateKey: today,
      startsAt: daysFromNow(0),
      teamTheme: "Own the next exchange",
      curriculumLessonId: "week-05-reset",
      boardStatus: "open",
      closingPrompt: "What did you get 1% better at?",
      createdAt: stamp,
      updatedAt: stamp,
      createdBy: "coach-demo",
      updatedBy: "coach-demo",
    },
  ];

  const boardEntries: Record<string, BoardEntry[]> = {
    [sessionId]: [
      { athleteUid: "athlete-maya", boardDisplayName: "Maya", focusText: "Be first to ties", pillar: "relentless", state: "ready", updatedAt: stamp },
      { athleteUid: "athlete-emma", boardDisplayName: "Emma", focusText: "Fast stand-up on bottom", pillar: "consistent", state: "ready", updatedAt: stamp },
      { athleteUid: "athlete-chloe", boardDisplayName: "Chloe", focusText: "Reset after every whistle", pillar: "resilient", state: "ready", updatedAt: stamp },
      { athleteUid: "athlete-nora", boardDisplayName: "Nora", focusText: "Good stance the whole live go", pillar: "consistent", state: "ready", updatedAt: stamp },
      { athleteUid: "athlete-lily", boardDisplayName: "Lily", focusText: "Focus not set", state: "pending", updatedAt: stamp },
      { athleteUid: "athlete-zoe", boardDisplayName: "Zoe", focusText: "Move my feet on shots", pillar: "persistent", state: "ready", updatedAt: stamp },
      { athleteUid: "athlete-riley", boardDisplayName: "Riley", focusText: "Breathe between goes", pillar: "resilient", state: "ready", updatedAt: stamp },
    ],
  };

  const checkins: PrivatePracticeCheckin[] = [
    {
      id: `${sessionId}-athlete-maya`, teamId: TEAM_ID, seasonId: DEFAULT_SEASON_ID, sessionId, athleteUid: "athlete-maya",
      before: { focusText: "Be first to ties", focusSource: "example", pillar: "relentless", showUpText: "Aggressive but controlled", completedAt: stamp },
      createdAt: stamp, updatedAt: stamp,
    },
    {
      id: "practice-demo-1-athlete-avery", teamId: TEAM_ID, seasonId: DEFAULT_SEASON_ID, sessionId: "practice-demo-1", athleteUid: "athlete-avery",
      before: { focusText: "Stay calm after a mistake", focusSource: "example", pillar: "resilient", showUpText: "Breathe and reset fast", completedAt: daysAgo(8), fiveCs: { commitment: 7, courage: 6, concentration: 5, control: 5, confidence: 5 } },
      after: { workedOnFocus: "yes", wentWell: "I gave up the first score, reset, and attacked the next exchange.", improve: "Get to my setup sooner.", completedAt: daysAgo(8), fiveCs: { commitment: 8, courage: 8, concentration: 7, control: 8, confidence: 7 }, nextFocusAction: "keep" },
      evidenceId: "evidence-reset-response", createdAt: daysAgo(8), updatedAt: daysAgo(8),
    },
    {
      id: "practice-demo-2-athlete-avery", teamId: TEAM_ID, seasonId: DEFAULT_SEASON_ID, sessionId: "practice-demo-2", athleteUid: "athlete-avery",
      before: { focusText: "Good stance the whole time", focusSource: "example", pillar: "consistent", showUpText: "Focused on clean technique", completedAt: daysAgo(5), fiveCs: { commitment: 7, courage: 7, concentration: 6, control: 6, confidence: 6 } },
      after: { workedOnFocus: "partly", wentWell: "I corrected my stance after coach reminded me and kept it late in the go.", improve: "Move my feet before reaching.", completedAt: daysAgo(5), fiveCs: { commitment: 8, courage: 7, concentration: 7, control: 7, confidence: 7 }, nextFocusAction: "narrow" },
      evidenceId: "evidence-correction", createdAt: daysAgo(5), updatedAt: daysAgo(5),
    },
    {
      id: "practice-demo-3-athlete-avery", teamId: TEAM_ID, seasonId: DEFAULT_SEASON_ID, sessionId: "practice-demo-3", athleteUid: "athlete-avery",
      before: { focusText: "Hand-fighting to set up shots", focusSource: "example", pillar: "persistent", showUpText: "Compete every rep", completedAt: daysAgo(2), fiveCs: { commitment: 8, courage: 7, concentration: 7, control: 7, confidence: 6 } },
      after: { workedOnFocus: "yes", wentWell: "I used my setup in live and finished the rep the right way.", improve: "Quicker set-ups.", completedAt: daysAgo(2), fiveCs: { commitment: 8, courage: 8, concentration: 8, control: 7, confidence: 8 }, nextFocusAction: "keep" },
      evidenceId: "evidence-live-setup", createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
  ];

  const evidence: ConfidenceEvidence[] = [
    {
      id: "evidence-reset-response", athleteUid: "athlete-avery", text: "I gave up the first score, reset, and attacked the next exchange.", source: "practice", sourceRef: { kind: "practice", id: "practice-demo-1" }, contextLabel: "Live wrestling", occurredAt: daysAgo(8), tags: ["reset", "response", "pressure"], pillar: "resilient", visibility: "private", pinned: true, archived: false, createdAt: daysAgo(8), updatedAt: daysAgo(8),
    },
    {
      id: "evidence-correction", athleteUid: "athlete-avery", text: "Coach reminded me about my stance. I corrected it and held the correction late in the go.", source: "coach", sourceAuthorUid: "coach-demo", sourceAuthorName: "Coach Demo", sourceRef: { kind: "recognition", id: "recognition-correction" }, contextLabel: "Practice", occurredAt: daysAgo(5), tags: ["coachable", "stance", "correction"], pillar: "consistent", visibility: "coach_visible", pinned: false, archived: false, createdAt: daysAgo(5), updatedAt: daysAgo(5),
    },
    {
      id: "evidence-live-setup", athleteUid: "athlete-avery", text: "I used my setup in live and finished the rep the right way.", source: "practice", sourceRef: { kind: "practice", id: "practice-demo-3" }, contextLabel: "Live wrestling", occurredAt: daysAgo(2), tags: ["setup", "finish", "live"], pillar: "persistent", visibility: "private", pinned: false, archived: false, createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
    {
      id: "evidence-tournament", athleteUid: "athlete-avery", text: "I stayed composed in a close match and used my first job after every restart.", source: "competition", sourceRef: { kind: "competition", id: "competition-demo" }, contextLabel: "Early-season invitational", occurredAt: daysAgo(14), tags: ["competition", "control", "first job"], pillar: "resilient", visibility: "private", pinned: true, archived: false, createdAt: daysAgo(14), updatedAt: daysAgo(14),
    },
  ];

  const goals: Goal[] = [
    { id: "goal-season", athleteUid: "athlete-avery", seasonId: DEFAULT_SEASON_ID, level: "season", text: "Become a confident varsity contributor", evidenceDefinition: "Consistent practice habits, a competition routine, and stronger match execution", status: "active", targetDate: "2027-02-28", ...audit("athlete-avery") },
    { id: "goal-block", athleteUid: "athlete-avery", seasonId: DEFAULT_SEASON_ID, level: "block", text: "Build first contact and setup habits", parentGoalId: "goal-season", evidenceDefinition: "Use intentional hand-fighting and setups in live wrestling", status: "active", targetDate: daysFromNow(28).slice(0, 10), ...audit("athlete-avery") },
    { id: "goal-week", athleteUid: "athlete-avery", seasonId: DEFAULT_SEASON_ID, level: "weekly", text: "Use my setup before every attack", parentGoalId: "goal-block", evidenceDefinition: "I can name and show the setup during live wrestling", status: "active", targetDate: daysFromNow(7).slice(0, 10), ...audit("athlete-avery") },
  ];

  const toolkit: ToolkitItem[] = [
    { id: "tool-cue-next", athleteUid: "athlete-avery", kind: "cue", title: "Reset cue", text: "Next exchange", tags: ["reset", "competition"], active: true, ...audit("athlete-avery") },
    { id: "tool-routine", athleteUid: "athlete-avery", kind: "routine", title: "My pre-match routine", text: "Move, breathe, cue, stance, first job", tags: ["competition", "routine"], active: true, ...audit("athlete-avery") },
    { id: "tool-what-works", athleteUid: "athlete-avery", kind: "what_works", title: "What works for me", text: "One slow exhale and one job before I step on the mat", tags: ["preparation", "control"], active: true, ...audit("athlete-avery") },
  ];

  const competitionPlans: CompetitionPlan[] = [
    {
      id: "competition-demo", athleteUid: "athlete-avery", seasonId: DEFAULT_SEASON_ID, eventName: "Saturday Invitational", eventDate: daysFromNow(4).slice(0, 10), status: "active", outcomeDirection: "Compete with confidence and learn from every match", processGoals: ["Use my setup before attacking", "Reset after every whistle"], pillar: "resilient", firstJob: "Be first to contact", cue: "Next exchange", routineSteps: ["Move", "Easy breath", "Say my cue", "Find my stance", "Do my first job"], ifThenPlans: [{ if: "I give up first points", then: "Breathe, center, attack the next exchange" }, { if: "I feel rushed", then: "Slow the exhale and find my stance" }], betweenPeriods: "Listen to one coach instruction, repeat one cue, get to the next start", betweenMatches: "Hydrate, recover, keep one lesson, reset for the next plan", createdAt: daysAgo(2), updatedAt: daysAgo(1), createdBy: "athlete-avery", updatedBy: "athlete-avery",
    },
  ];

  const lessonProgress: LessonProgress[] = [
    { id: "athlete-avery-week-00", athleteUid: "athlete-avery", lessonId: "week-00-welcome", status: "completed", outputText: "Use one clear job", outputType: "goal", completedAt: daysAgo(18), ...audit("athlete-avery") },
    { id: "athlete-avery-week-01", athleteUid: "athlete-avery", lessonId: "week-01-controllables", status: "completed", outputText: "Good stance through the whole go", outputType: "goal", completedAt: daysAgo(15), ...audit("athlete-avery") },
    { id: "athlete-avery-week-02", athleteUid: "athlete-avery", lessonId: "week-02-pillars", status: "completed", outputText: "Resilient means return to useful action", outputType: "evidence", completedAt: daysAgo(10), ...audit("athlete-avery") },
    { id: "athlete-avery-week-03", athleteUid: "athlete-avery", lessonId: "week-03-five-cs", status: "completed", outputType: "none", completedAt: daysAgo(7), ...audit("athlete-avery") },
    { id: "athlete-avery-week-04", athleteUid: "athlete-avery", lessonId: "week-04-attention", status: "completed", outputText: "Next exchange", outputType: "cue", completedAt: daysAgo(3), ...audit("athlete-avery") },
  ];

  const teamWins: TeamWin[] = [
    { id: "win-focus", title: "Team Win", text: "Every wrestler entered Friday practice with one clear 1% focus.", pillar: "consistent", status: "published", publishedAt: daysAgo(2), kind: "team_win", ...audit("coach-demo") },
    { id: "win-resilient", title: "Coach noticed", text: "The room kept wrestling through hard positions and returned after mistakes.", pillar: "resilient", status: "published", publishedAt: daysAgo(5), kind: "coach_noticed", ...audit("coach-demo") },
    { id: "win-respectful", title: "Room standard", text: "Experienced wrestlers helped new teammates understand the drill without slowing down the room.", pillar: "respectful", status: "published", publishedAt: daysAgo(8), kind: "milestone", ...audit("coach-demo") },
  ];

  const challenges: TeamChallenge[] = [
    { id: "challenge-reset", title: "Reset Week", description: "Practice one useful reset during a real pressure moment.", target: 8, current: 5, unit: "wrestlers", status: "active", endsOn: daysFromNow(5).slice(0, 10), ...audit("coach-demo") },
  ];

  return {
    users,
    memberships,
    invites: [],
    team: seedTeam,
    season: seedSeason,
    sessions,
    boardEntries,
    checkins,
    exampleBuckets: seedExampleBuckets,
    curriculum: seedCurriculum,
    lessonProgress,
    goals,
    evidence,
    toolkit,
    competitionPlans,
    teamWins,
    challenges,
    terms: seedTechniqueTerms,
  };
}
