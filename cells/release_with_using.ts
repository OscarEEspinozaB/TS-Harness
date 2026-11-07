// rule: RELEASE kind: control
function open(): Disposable {
  return { [Symbol.dispose](): void {} };
}

export function work(): number {
  using resource = open();
  void resource;
  return 1;
}
