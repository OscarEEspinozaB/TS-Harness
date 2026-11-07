// rule: LAMBDA kind: control
export function scaled(values: readonly number[], factor: number): readonly number[] {
  return values.map((value) => value * factor);
}
