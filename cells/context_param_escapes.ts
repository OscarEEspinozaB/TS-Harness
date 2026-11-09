// rule: CONTEXT kind: control
// A mutable parameter passed on counts as written: what receives it may change it.
function fill(values: number[]): void {
  values.fill(0);
}

export function reset(values: number[]): void {
  fill(values);
}
