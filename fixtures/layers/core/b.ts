// The other half of the cycle: b imports a, which imports b.
import { a } from "./a.ts";

export function b(): number {
  return a === undefined ? 0 : 1;
}
