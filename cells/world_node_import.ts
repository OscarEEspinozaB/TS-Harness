// rule: WORLD kind: violation
// reason: Cannot find name 'node:fs'
import { readFileSync } from "node:fs";

export function load(path: string): string {
  return readFileSync(path, "utf8");
}
