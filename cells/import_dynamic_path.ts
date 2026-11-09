// rule: IMPORT kind: violation
// reason: dynamic import with a path that is not a literal
export function load(path: string): Promise<unknown> {
  return import(path);
}
