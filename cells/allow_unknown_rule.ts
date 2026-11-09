// rule: ALLOW kind: violation
// reason: malformed exception
export function size(values: readonly number[]): number {
  // harness-allow SPEED: this rule does not exist in the harness
  return values.length;
}
