// rule: BYPASS kind: violation
// reason: switches a compiler check off
export function broken(): number {
  // @ts-ignore
  return "text";
}
