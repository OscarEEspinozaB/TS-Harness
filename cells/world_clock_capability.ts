// rule: WORLD kind: control
export type Clock = { readonly now: () => number };

export function elapsed(clock: Clock, start: number): number {
  return clock.now() - start;
}
