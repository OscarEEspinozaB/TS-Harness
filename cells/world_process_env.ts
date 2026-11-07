// rule: WORLD kind: violation
// reason: Cannot find name 'process'
export function home(): string | undefined {
  return process.env["HOME"];
}
