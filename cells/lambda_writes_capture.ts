// rule: LAMBDA kind: gap
export function count(values: readonly number[]): number {
  let total = 0;
  values.forEach((value) => {
    total += value;
  });
  return total;
}
