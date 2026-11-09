// rule: ERROR kind: violation
// reason: Promise.reject outside an entry point
export function fail(): Promise<never> {
  return Promise.reject(new Error("failed"));
}
