// rule: NAME kind: violation
// reason: shadows a binding of an enclosing scope
export function area(size: number): number {
  const scale = 2;
  {
    const scale = 3;
    return size * scale;
  }
}
