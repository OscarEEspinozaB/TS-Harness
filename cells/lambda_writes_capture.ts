// rule: LAMBDA kind: violation
// reason: which it captured
export function count(values: readonly number[]): number {
  let total = 0;
  values.forEach((value) => {
    total += value;
  });
  return total;
}
