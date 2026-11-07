// rule: LAMBDA kind: gap
export function doubled(values: readonly number[]): readonly number[] {
  const out: number[] = [];
  values.forEach((value) => {
    out.push(value * 2);
  });
  return out;
}
