// rule: BYPASS kind: gap
export function broken(): number {
  // @ts-expect-error
  return "text";
}
