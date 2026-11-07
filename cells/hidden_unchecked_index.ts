// rule: HIDDEN kind: violation
// reason: Type 'number | undefined' is not assignable to type 'number'
export function first(values: readonly number[]): number {
  return values[0];
}
