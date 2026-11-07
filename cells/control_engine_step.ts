// rule: TSC kind: control
export type Body = { readonly mass: number; readonly x: number; readonly v: number };
export type Stepped = { readonly ok: true; readonly bodies: readonly Body[] } | { readonly ok: false; readonly error: string };

export function step(bodies: readonly Body[], dt: number): Stepped {
  if (!(dt > 0)) {
    return { ok: false, error: "dt must be positive" };
  }
  return { ok: true, bodies: bodies.map((body) => ({ ...body, x: body.x + body.v * dt })) };
}
