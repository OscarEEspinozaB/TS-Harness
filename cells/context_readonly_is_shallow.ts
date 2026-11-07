// rule: CONTEXT kind: gap
export type Ship = { readonly position: { x: number } };

export function nudge(ship: Ship): void {
  ship.position.x += 1;
}
