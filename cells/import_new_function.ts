// rule: IMPORT kind: gap
export function build(body: string): unknown {
  return new Function(body);
}
