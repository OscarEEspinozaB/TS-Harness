// rule: BYPASS kind: violation
// reason: switches a compiler check off
export function broken(): number {
  // @ts-expect-error
  return "text";
}
