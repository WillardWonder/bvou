export function parseArgs(argv = process.argv.slice(2)): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]!;
    if (!current.startsWith("--")) continue;
    const [rawKey, inline] = current.slice(2).split("=", 2);
    if (inline !== undefined) {
      result[rawKey] = inline;
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      result[rawKey] = next;
      index += 1;
    } else {
      result[rawKey] = true;
    }
  }
  return result;
}

export function required(args: Record<string, string | boolean>, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing required --${key} value.`);
  return value.trim();
}
