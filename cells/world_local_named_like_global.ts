// rule: WORLD kind: control
// A local binding that shares a global's name is not the outside world.
export function locate(location: number): number {
  return location + 1;
}
