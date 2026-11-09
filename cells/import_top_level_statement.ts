// rule: IMPORT kind: violation
// reason: top-level statement runs on import
const values: number[] = [];
values.push(1);

export const first: number = values[0] ?? 0;
