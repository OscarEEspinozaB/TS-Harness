// rule: HIDDEN kind: control
// An assertion with a documented exception: the reason keeps the context the assertion hides.
export function size(value: unknown): number {
  // harness-allow HIDDEN: the caller passes only arrays, checked where the value is read
  return (value as readonly unknown[]).length;
}
