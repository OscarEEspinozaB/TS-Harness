// rule: HIDDEN kind: violation
// reason: type assertion 'as'
export function width(value: unknown): number {
  return value as number;
}
