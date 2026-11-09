// rule: IMPORT kind: violation
// reason: eval: code that is not visible to the compiler
export function run(code: string): unknown {
  return eval(code);
}
