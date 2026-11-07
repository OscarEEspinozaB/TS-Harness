// rule: WORLD kind: violation
// reason: Cannot find name 'fetch'
export function get(url: string): Promise<unknown> {
  return fetch(url);
}
