// rule: RELEASE kind: violation
// reason: held without using
function open(): Disposable {
  return { [Symbol.dispose](): void {} };
}

export function work(): number {
  const resource = open();
  void resource;
  return 1;
}
