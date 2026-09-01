import type { FiveCsRatings, GoalLevel } from "./types";

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

const ACTION_VERBS = [
  "attack", "breathe", "build", "center", "compete", "correct", "create", "drive", "engage", "escape",
  "finish", "focus", "hand-fight", "keep", "listen", "move", "pressure", "reset", "return", "set up",
  "stay", "use", "win", "work",
];

const VAGUE_GOALS = ["be better", "do good", "try hard", "win", "stay positive", "wrestle better"];

export function validateFocus(text: string, maxLength = 80): ValidationResult {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return { valid: false, message: "Choose one clear job for today." };
  if (normalized.length < 3) return { valid: false, message: "Add a little more detail so your focus is useful." };
  if (normalized.length > maxLength) return { valid: false, message: `Keep it short enough for the Practice Board, ${maxLength} characters or fewer.` };
  if (VAGUE_GOALS.includes(normalized.toLowerCase())) {
    return { valid: false, message: "Make it something you can actually do in a rep, not just an outcome." };
  }
  return { valid: true };
}

export function focusHasAction(text: string): boolean {
  const value = text.trim().toLowerCase();
  return ACTION_VERBS.some((verb) => value.includes(verb)) || value.split(/\s+/).length >= 4;
}

export function validateEvidence(text: string): ValidationResult {
  const value = text.trim();
  if (!value) return { valid: false, message: "Write the moment you want to remember." };
  if (value.length < 8) return { valid: false, message: "Add enough detail that future you will know what happened." };
  if (value.length > 320) return { valid: false, message: "Keep the memory focused on one useful moment." };
  return { valid: true };
}

export function validateFiveCs(ratings: FiveCsRatings): ValidationResult {
  const values = Object.values(ratings);
  if (values.some((value) => !Number.isInteger(value) || value < 1 || value > 10)) {
    return { valid: false, message: "Each Five Cs rating must be from 1 to 10." };
  }
  return { valid: true };
}

export function goalPromptForLevel(level: GoalLevel): string {
  switch (level) {
    case "season": return "Where do I want to go?";
    case "performance": return "What performance must improve?";
    case "block": return "What am I building over the next several weeks?";
    case "weekly": return "What is this week about?";
    case "daily": return "What can I execute today?";
  }
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}
