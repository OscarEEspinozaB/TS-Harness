// rule: RELEASE kind: gap
function open(): Disposable {
  return { [Symbol.dispose](): void {} };
}

export function work(): number {
  const resource = open();
  void resource;
  return 1;
}
