// rule: WORLD kind: violation
// reason: Cannot find name 'setTimeout'
export function later(task: () => void): void {
  setTimeout(task, 10);
}
