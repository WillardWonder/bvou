import type {
  ConfidenceEvidence,
  EvidenceContext,
  FiveCsRatings,
  PrivatePracticeCheckin,
  WeeklyRecap,
} from "./types";

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface EvidenceSelectionInput {
  evidence: ConfidenceEvidence[];
  context: EvidenceContext;
  limit?: number;
  currentPillar?: string;
  currentTags?: string[];
  now?: Date;
}

export function selectRelevantEvidence({
  evidence,
  context,
  limit = 3,
  currentPillar,
  currentTags = [],
  now = new Date(),
}: EvidenceSelectionInput): ConfidenceEvidence[] {
  const eligible = evidence.filter((item) => !item.archived);
  const nowTime = now.getTime();
  const score = (item: ConfidenceEvidence): number => {
    let points = item.pinned ? 100 : 0;
    if (context === "competition" && item.source === "competition") points += 28;
    if (context === "adversity" && item.tags.some((tag) => ["reset", "resilient", "response"].includes(tag))) points += 24;
    if (currentPillar && item.pillar === currentPillar) points += 30;
    const overlap = item.tags.filter((tag) => currentTags.includes(tag)).length;
    points += overlap * 14;
    const ageDays = Math.max(0, (nowTime - new Date(item.occurredAt).getTime()) / 86_400_000);
    points += Math.max(0, 24 - ageDays / 7);
    if (item.resurfacedContexts?.includes(context)) points -= 4;
    return points;
  };

  return [...eligible]
    .sort((a, b) => score(b) - score(a) || b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, Math.max(1, limit));
}

function themeForFocus(text: string): string {
  const value = text.toLowerCase();
  if (/stance|feet|move|position|lower/.test(value)) return "Stance and movement";
  if (/reset|calm|breathe|composed|mistake/.test(value)) return "Reset and composure";
  if (/contact|tie|hand-fight|setup|set-up/.test(value)) return "Contact and setups";
  if (/escape|stand-up|bottom/.test(value)) return "Bottom work";
  if (/finish|attack|shot|single|double/.test(value)) return "Attacks and finishes";
  if (/pressure|top|ride/.test(value)) return "Top pressure";
  return "Personal focus";
}

export function buildWeeklyRecap(
  checkins: PrivatePracticeCheckin[],
  evidence: ConfidenceEvidence[],
  now = new Date(),
  lessonTitle?: string,
): WeeklyRecap {
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weeklyCheckins = checkins.filter((item) => {
    const time = new Date(item.createdAt).getTime();
    return time >= weekStart.getTime() && time <= weekEnd.getTime();
  });
  const weeklyEvidence = evidence.filter((item) => {
    const time = new Date(item.occurredAt).getTime();
    return !item.archived && time >= weekStart.getTime() && time <= weekEnd.getTime();
  });
  const counts = new Map<string, number>();
  for (const item of weeklyCheckins) {
    const theme = themeForFocus(item.before.focusText);
    counts.set(theme, (counts.get(theme) ?? 0) + 1);
  }
  const ownCount = weeklyCheckins.filter((item) => item.before.focusSource === "own").length;
  const focusThemes = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const older = selectRelevantEvidence({
    evidence: evidence.filter((item) => new Date(item.occurredAt) < weekStart),
    context: "weekly",
    limit: 1,
    now,
  });
  return {
    weekStart: toDateKey(weekStart),
    weekEnd: toDateKey(weekEnd),
    focusThemes,
    evidence: [...weeklyEvidence.slice(0, 3), ...older].slice(0, 4),
    ...(lessonTitle ? { lessonTitle } : {}),
    ...(focusThemes[0] ? { nextFocusSuggestion: focusThemes[0].label } : {}),
    ...(weeklyCheckins.length ? { ownLanguageRatio: ownCount / weeklyCheckins.length } : {}),
  };
}

export function fiveCsDelta(before?: FiveCsRatings, after?: FiveCsRatings): Partial<FiveCsRatings> {
  if (!before || !after) return {};
  return Object.fromEntries(
    Object.keys(before).map((key) => [key, after[key as keyof FiveCsRatings] - before[key as keyof FiveCsRatings]]),
  ) as Partial<FiveCsRatings>;
}

export function summarizeEvidenceThemes(evidence: ConfidenceEvidence[]): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of evidence.filter((entry) => !entry.archived)) {
    const labels = item.tags.length ? item.tags : [item.source];
    for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8);
}
