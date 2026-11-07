// rule: IMPORT kind: gap
export function load(path: string): Promise<unknown> {
  return import(path);
}
