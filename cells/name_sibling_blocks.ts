// rule: NAME kind: control
export function pick(flag: boolean): number {
  if (flag) {
    const value = 1;
    return value;
  } else {
    const value = 2;
    return value;
  }
}
