// rule: CLASS kind: gap
export class Counter {
  private count: number = 0;

  increment(): number {
    this.count += 1;
    return this.count;
  }
}
