// rule: IMPORT kind: control
// A constant computed when the module loads is a table, not an effect: WORLD keeps the outside
// out of it (decided 2026-11-09, docs/DISENO.md §11).
function compute(): number {
  return 42;
}

export const answer: number = compute();
