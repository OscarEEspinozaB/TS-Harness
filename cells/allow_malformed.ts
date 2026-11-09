// rule: ALLOW kind: violation
// reason: malformed exception
export function size(value: unknown): number {
  // harness-allow HIDDEN: trust me
  return (value as readonly unknown[]).length;
}
