// rule: LAMBDA kind: control
export function sum(values: readonly number[]): number {
  return values.reduce((total, value) => {
    let next = total;
    next += value;
    return next;
  }, 0);
}
