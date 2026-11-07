// Cell headers and verdicts. Pure: no access to the outside world.

export type Kind = "control" | "violation" | "gap";

export type Header = {
  readonly rule: string;
  readonly kind: Kind;
  readonly reason: string;
};

export type Outcome = "passes" | "stops";

export type Verdict = "ok" | "**REASON**" | "**REVIEW**" | "**FAIL**";

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string };

const HEADER_LINE: RegExp = /^\/\/ rule: (\S+) kind: (\S+)\s*$/;
const REASON_LINE: RegExp = /^\/\/ reason: (.*)$/;

function toKind(text: string): Kind | undefined {
  switch (text) {
    case "control":
      return "control";
    case "violation":
      return "violation";
    case "gap":
      return "gap";
    default:
      return undefined;
  }
}

// Reads "// rule: X kind: Y" from the first line and "// reason: text" from the second.
export function parseHeader(source: string): Result<Header> {
  const lines = source.split("\n");
  const first = HEADER_LINE.exec(lines[0] ?? "");
  const rule = first?.[1];
  const kindText = first?.[2];
  if (rule === undefined || kindText === undefined) {
    return { ok: false, error: "first line is not '// rule: X kind: Y'" };
  }
  const kind = toKind(kindText);
  if (kind === undefined) {
    return { ok: false, error: `unknown kind '${kindText}'` };
  }
  const reason = REASON_LINE.exec(lines[1] ?? "")?.[1]?.trim() ?? "";
  if (kind === "violation" && reason === "") {
    return { ok: false, error: "a violation cell needs '// reason: text' on its second line" };
  }
  return { ok: true, value: { rule, kind, reason } };
}

// A violation only counts when it stops for the expected reason.
export function judge(header: Header, outcome: Outcome, messages: readonly string[]): Verdict {
  switch (header.kind) {
    case "control":
      return outcome === "passes" ? "ok" : "**FAIL**";
    case "gap":
      return outcome === "passes" ? "ok" : "**REVIEW**";
    case "violation":
      if (outcome === "passes") {
        return "**FAIL**";
      }
      return messages.some((message) => message.includes(header.reason)) ? "ok" : "**REASON**";
  }
}
