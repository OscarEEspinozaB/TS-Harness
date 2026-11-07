// rule: ERROR kind: control
export type Parsed = { readonly ok: true; readonly value: number } | { readonly ok: false; readonly error: string };

export function parse(text: string): Parsed {
  const value = Number(text);
  if (Number.isNaN(value)) {
    return { ok: false, error: "not a number" };
  }
  return { ok: true, value };
}
