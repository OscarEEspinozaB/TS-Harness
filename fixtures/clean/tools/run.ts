// Entry point: the only place that reads the real clock, handed down as a Clock.
import { elapsed } from "../src/clock.ts";

function main(): number {
  return elapsed({ now: () => Date.now() }, 0) >= 0 ? 0 : 1;
}

const code: number = main();
export { code };
