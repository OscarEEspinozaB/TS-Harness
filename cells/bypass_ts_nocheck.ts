// rule: BYPASS kind: violation
// reason: switches a compiler check off
// @ts-nocheck
export function broken(): number {
  return "text";
}
