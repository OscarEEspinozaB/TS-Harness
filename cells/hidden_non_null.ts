// rule: HIDDEN kind: violation
// reason: non-null assertion
export function first(values: readonly number[]): number {
  return values[0]!;
}
