// rule: ERROR kind: gap
export function parse(text: string): number {
  const value = Number(text);
  if (Number.isNaN(value)) {
    throw new Error("not a number");
  }
  return value;
}
