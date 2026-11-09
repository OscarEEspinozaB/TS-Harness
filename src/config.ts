// The audited project's harness.json: which TypeScript projects make it up, which files are
// entry points or tests, and which folders may import which. Pure: no access to the outside world.
//
//   {
//     "projects": ["tsconfig.json", "tools/tsconfig.json"],
//     "entryPoints": ["tools/*.ts"],
//     "tests": ["tests/**/*.ts"],
//     "layers": { "engine": ["engine"], "app": ["engine", "app"] }
//   }
//
// Entry points and tests are where the outside world may be reached (WORLD), where throw is
// allowed (ERROR) and where top-level statements run (IMPORT). An entry point also declares a
// function main. A layer names a folder and the folders its files may import from; folders not
// named are not constrained.

import type { Result } from "./cell.ts";

export type Config = {
  readonly projects: readonly string[];
  readonly entryPoints: readonly string[];
  readonly tests: readonly string[];
  readonly layers: ReadonlyMap<string, readonly string[]>;
};

function strings(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items: readonly unknown[] = value;
  return items.every((item) => typeof item === "string") ? items.filter((item) => typeof item === "string") : undefined;
}

export function parseConfig(text: string): Result<Config> {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, error: "harness.json is not JSON" };
  }
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "harness.json is not an object" };
  }
  const projects = strings("projects" in value ? value.projects : undefined);
  const entryPoints = strings("entryPoints" in value ? value.entryPoints : []);
  const tests = strings("tests" in value ? value.tests : []);
  if (projects === undefined || projects.length === 0 || entryPoints === undefined || tests === undefined) {
    return { ok: false, error: "harness.json needs 'projects' (a non-empty list of tsconfig files), and 'entryPoints' and 'tests' as lists" };
  }
  const layers = new Map<string, readonly string[]>();
  const rawLayers: unknown = "layers" in value ? value.layers : {};
  if (typeof rawLayers !== "object" || rawLayers === null) {
    return { ok: false, error: "'layers' must map a folder to the folders it may import" };
  }
  for (const [folder, allowed] of Object.entries(rawLayers)) {
    const list = strings(allowed);
    if (list === undefined) {
      return { ok: false, error: `layer '${folder}' must list folders` };
    }
    layers.set(folder, list);
  }
  return { ok: true, value: { projects, entryPoints, tests, layers } };
}

// A path pattern: "*" matches within one folder, "**/" any number of folders.
export function matches(pattern: string, path: string): boolean {
  const source = pattern
    .split("**/")
    .map((part) => part.split("*").map((piece) => piece.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*"))
    .join("(?:.*/)?");
  return new RegExp(`^${source}$`).test(path);
}

export function matchesAny(patterns: readonly string[], path: string): boolean {
  return patterns.some((pattern) => matches(pattern, path));
}
