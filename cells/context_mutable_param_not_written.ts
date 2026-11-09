// rule: CONTEXT kind: violation
// reason: is never written: declare it readonly
export function total(values: number[]): number {
  let sum = 0;
  for (const value of values) {
    sum += value;
  }
  return sum;
}
