// rule: WORLD kind: control
// An entry point may read the clock, and hands it down as a capability.
type Clock = { readonly now: () => number };

function elapsed(clock: Clock, start: number): number {
  return clock.now() - start;
}

export function main(): number {
  return elapsed({ now: () => Date.now() }, 0);
}
