// rule: IMPORT kind: violation
// reason: Cannot find name 'require'
export function load(path: string): unknown {
  return require(path);
}
