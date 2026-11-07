// rule: ERROR kind: gap
export function fail(): Promise<never> {
  return Promise.reject(new Error("failed"));
}
