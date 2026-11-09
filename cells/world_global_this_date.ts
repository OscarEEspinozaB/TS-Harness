// rule: WORLD kind: violation
// reason: 'globalThis' reaches outside the program
export function stamp(): number {
  return globalThis.Date.now();
}
