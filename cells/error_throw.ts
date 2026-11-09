// rule: ERROR kind: violation
// reason: throw outside an entry point
export function parse(text: string): number {
  const value = Number(text);
  if (Number.isNaN(value)) {
    throw new Error("not a number");
  }
  return value;
}
