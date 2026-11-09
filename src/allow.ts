// Documented exceptions (rule ALLOW). A comment `// harness-allow RULE: reason`, or several
// rules separated by commas, silences those rules' findings on the next line of code, or on its
// own line when it follows code. The reason is required: it keeps the context an exception
// would otherwise hide (why an optimization needs a captured variable, why a value is known to
// have a type). An exception with an unknown rule or a reason under 12 characters, and one that
// silences nothing, are findings themselves, so exceptions cannot pile up unread. ALLOW and TSC
// cannot be silenced. Only real comments count, found through the syntax tree, so the words
// inside a string or in the middle of another comment are not exceptions. Pure: no access to the
// outside world.

import ts from "typescript";
import { type Allowed, type Finding, RULES } from "./finding.ts";

type Exception = {
  readonly line: number; // the line it covers
  readonly at: number; // the line it is written on
  readonly rules: readonly string[];
  readonly reason: string;
};

const MARK: RegExp = /^\/\/\s*harness-allow\b(.*)$/;
const MIN_REASON: number = 12;

// Every single-line comment of a file, with its line and whether code precedes it on that line.
function commentsOf(file: ts.SourceFile): readonly { readonly line: number; readonly text: string; readonly alone: boolean }[] {
  const text = file.getFullText();
  const seen = new Set<number>();
  const found: { readonly line: number; readonly text: string; readonly alone: boolean }[] = [];
  function collect(ranges: readonly ts.CommentRange[] | undefined): void {
    for (const range of ranges ?? []) {
      if (range.kind === ts.SyntaxKind.SingleLineCommentTrivia && !seen.has(range.pos)) {
        seen.add(range.pos);
        const position = file.getLineAndCharacterOfPosition(range.pos);
        const before = text.slice(range.pos - position.character, range.pos);
        found.push({ line: position.line + 1, text: text.slice(range.pos, range.end), alone: before.trim() === "" });
      }
    }
  }
  function visit(node: ts.Node): void {
    collect(ts.getLeadingCommentRanges(text, node.pos));
    collect(ts.getTrailingCommentRanges(text, node.end));
    ts.forEachChild(node, visit);
  }
  visit(file);
  collect(ts.getLeadingCommentRanges(text, file.endOfFileToken.pos));
  return found;
}

function exceptionsOf(path: string, file: ts.SourceFile): { readonly exceptions: readonly Exception[]; readonly malformed: readonly Finding[] } {
  const lines = file.getFullText().split("\n");
  const exceptions: Exception[] = [];
  const malformed: Finding[] = [];
  for (const comment of commentsOf(file)) {
    const found = MARK.exec(comment.text);
    if (found === null) {
      continue;
    }
    const body = /^\s+([A-Z, ]+?)\s*:\s*(.*)$/.exec(found[1] ?? "");
    const rules = (body?.[1] ?? "").split(",").map((rule) => rule.trim()).filter((rule) => rule !== "");
    const reason = (body?.[2] ?? "").trim();
    if (body === null || rules.length === 0 || rules.some((rule) => !RULES.includes(rule) || rule === "ALLOW") || reason.length < MIN_REASON) {
      malformed.push({ rule: "ALLOW", file: path, line: comment.line, message: `malformed exception: write '// harness-allow RULE: reason', with a known rule and a reason of at least ${MIN_REASON} characters` });
      continue;
    }
    let covered = comment.line;
    if (comment.alone) {
      covered += 1;
      while (covered <= lines.length && /^\s*(\/\/.*)?$/.test(lines[covered - 1] ?? "")) {
        covered += 1;
      }
    }
    exceptions.push({ line: covered, at: comment.line, rules, reason });
  }
  return { exceptions, malformed };
}

// Splits findings into those that stand and those an exception allows, and adds the ALLOW
// findings for malformed and unused exceptions. `files` maps each audited path to its syntax tree.
export function applyExceptions(findings: readonly Finding[], files: ReadonlyMap<string, ts.SourceFile>): { readonly standing: readonly Finding[]; readonly allowed: readonly Allowed[] } {
  const standing: Finding[] = [];
  const allowed: Allowed[] = [];
  const parsed = new Map([...files].map(([path, file]) => [path, exceptionsOf(path, file)]));
  const used = new Set<string>();
  for (const finding of findings) {
    const exception = parsed.get(finding.file)?.exceptions.find((candidate) => candidate.line === finding.line && candidate.rules.includes(finding.rule));
    if (exception === undefined || finding.rule === "TSC" || finding.rule === "ALLOW") {
      standing.push(finding);
    } else {
      allowed.push({ finding, reason: exception.reason });
      used.add(`${finding.file}:${exception.at}:${finding.rule}`);
    }
  }
  for (const [path, { exceptions, malformed }] of parsed) {
    standing.push(...malformed);
    for (const exception of exceptions) {
      for (const rule of exception.rules) {
        if (!used.has(`${path}:${exception.at}:${rule}`)) {
          standing.push({ rule: "ALLOW", file: path, line: exception.at, message: `exception for ${rule} silences nothing: remove it` });
        }
      }
    }
  }
  return { standing, allowed };
}
