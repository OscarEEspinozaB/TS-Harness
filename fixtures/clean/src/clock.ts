// Time as a capability: what needs the clock says so in its signature.
export type Clock = { readonly now: () => number };

export function elapsed(clock: Clock, start: number): number {
  return clock.now() - start;
}
