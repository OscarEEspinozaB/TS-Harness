// rule: IMPORT kind: violation
// reason: new Function: code that is not visible to the compiler
export function build(body: string): unknown {
  return new Function(body);
}
