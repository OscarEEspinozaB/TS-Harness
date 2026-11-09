// rule: ERROR kind: control
// An entry point may throw: it is where failures meet the outside world.
export function main(): number {
  if (Number.isNaN(Number("x"))) {
    throw new Error("not a number");
  }
  return 0;
}
