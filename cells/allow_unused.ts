// rule: ALLOW kind: violation
// reason: silences nothing
export function size(values: readonly number[]): number {
  // harness-allow HIDDEN: nothing on the next line asserts anything
  return values.length;
}
