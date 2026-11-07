// rule: CONTEXT kind: violation
// reason: Property 'push' does not exist on type 'readonly number[]'
export function append(values: readonly number[], value: number): void {
  values.push(value);
}
