// rule: STATE kind: control
let count: number = 0;

export function next(): number {
  count += 1;
  return count;
}
