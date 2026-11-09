// Entry point. Measures every cell in cells/ and prints a Markdown table.
// Exit code: 0 every verdict is right, 1 some verdict is wrong, 2 could not measure.
// Only main() touches the outside world; it hands a compiler host down as a parameter.
// Two stages: tsc with the options in cells/tsconfig.json, then the harness's rules
// (src/rules.ts) with the documented exceptions applied (src/allow.ts). A cell is judged by
// tsc and by its own rule's findings; a TSC cell by every rule but HEADER, since a cell's header
// lines are directives. A cell whose name ends in "_entry" is an entry point.
// Rules that need several files (LAYER, export *) are measured on the projects in fixtures/:
// each holds a harness.json and an expected.json with the number of findings per rule, and any
// rule it does not name must find nothing.

import ts from "typescript";
import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyExceptions } from "./src/allow.ts";
import { type Header, judge, parseHeader, type Result } from "./src/cell.ts";
import { parseConfig } from "./src/config.ts";
import { auditPrograms, loadPrograms } from "./src/project.ts";
import { checkFile } from "./src/rules.ts";
import { isWrong, renderReport, type Row } from "./src/report.ts";

function loadOptions(configPath: string, system: Readonly<ts.System>): Result<ts.CompilerOptions> {
  const read = ts.readConfigFile(configPath, (path) => system.readFile(path));
  if (read.error !== undefined) {
    return { ok: false, error: ts.flattenDiagnosticMessageText(read.error.messageText, " ") };
  }
  const parsed = ts.parseJsonConfigFileContent(read.config, system, dirname(configPath));
  const first = parsed.errors[0];
  if (first !== undefined) {
    return { ok: false, error: ts.flattenDiagnosticMessageText(first.messageText, " ") };
  }
  return { ok: true, value: parsed.options };
}

// Declaration diagnostics are requested explicitly: with noEmit, tsc skips them.
function diagnose(
  path: string,
  header: Header,
  options: Readonly<ts.CompilerOptions>,
  host: Readonly<ts.CompilerHost>,
): readonly string[] {
  const program = ts.createProgram({ rootNames: [path], options, host });
  const diagnostics = [
    ...program.getOptionsDiagnostics(),
    ...program.getGlobalDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
    ...program.getDeclarationDiagnostics(),
  ];
  const messages = diagnostics.map((d) => `TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
  const file = program.getSourceFile(path);
  if (file === undefined) {
    return messages;
  }
  const name = basename(path, ".ts");
  const findings = checkFile({ checker: program.getTypeChecker(), file, path: name, role: name.endsWith("_entry") ? "entry" : "module" });
  const { standing } = applyExceptions(findings, new Map([[name, file]]));
  const own = standing.filter((finding) => (header.rule === "TSC" ? finding.rule !== "HEADER" : finding.rule === header.rule));
  return [...messages, ...own.map((finding) => `${finding.rule}: ${finding.message}`)];
}

function measure(name: string, source: string, messages: (header: Header) => readonly string[]): Row {
  const header = parseHeader(source);
  if (!header.ok) {
    return { name, invalid: header.error };
  }
  const found = messages(header.value);
  const outcome = found.length === 0 ? "passes" : "stops";
  const verdict = judge(header.value, outcome, found);
  return { name, header: header.value, outcome, verdict, message: found[0] ?? "" };
}

type FixtureRow = { readonly name: string; readonly expected: string; readonly found: string; readonly ok: boolean };

function counts(rules: readonly string[]): string {
  const tally = new Map<string, number>();
  for (const rule of rules) {
    tally.set(rule, (tally.get(rule) ?? 0) + 1);
  }
  return [...tally].sort(([a], [b]) => a.localeCompare(b)).map(([rule, count]) => `${rule} ${count}`).join(", ") || "none";
}

function measureFixtures(dir: string): readonly FixtureRow[] {
  return readdirSync(dir).sort().map((name) => {
    const root = join(dir, name);
    const config = parseConfig(readFileSync(join(root, "harness.json"), "utf8"));
    const expectedValue: unknown = JSON.parse(readFileSync(join(root, "expected.json"), "utf8"));
    const expected = typeof expectedValue === "object" && expectedValue !== null ? Object.entries(expectedValue).flatMap(([rule, count]) => (typeof count === "number" ? Array.from({ length: count }, () => rule) : [])) : [];
    const programs = config.ok ? loadPrograms(root, config.value, ts.sys) : config;
    if (!config.ok || !programs.ok) {
      return { name, expected: counts(expected), found: programs.ok ? "" : programs.error, ok: false };
    }
    const audit = auditPrograms(root, config.value, programs.value);
    const found = counts(audit.standing.map((finding) => finding.rule));
    return { name, expected: counts(expected), found, ok: audit.files > 0 && found === counts(expected) };
  });
}

function main(): number {
  const root = dirname(fileURLToPath(import.meta.url));
  const cellsDir = join(root, "cells");
  const options = loadOptions(join(cellsDir, "tsconfig.json"), ts.sys);
  if (!options.ok) {
    console.error(`cannot read cells/tsconfig.json: ${options.error}`);
    return 2;
  }
  const host = ts.createCompilerHost(options.value);
  const names = readdirSync(cellsDir).filter((name) => name.endsWith(".ts")).sort();
  if (names.length === 0) {
    console.error("no cells found: a measurement that read nothing never passes");
    return 2;
  }
  const rows = names.map((name) => {
    const path = join(cellsDir, name);
    return measure(name.replace(/\.ts$/, ""), readFileSync(path, "utf8"), (header) => diagnose(path, header, options.value, host));
  });
  console.log(renderReport(rows, { typescript: ts.version, node: process.version }));
  const fixtures = measureFixtures(join(root, "fixtures"));
  console.log(["", "| Fixture | Expected | Found | Verdict |", "| --- | --- | --- | --- |", ...fixtures.map((row) => `| \`${row.name}\` | ${row.expected} | ${row.found} | ${row.ok ? "ok" : "**FAIL**"} |`)].join("\n"));
  return rows.some(isWrong) || fixtures.some((row) => !row.ok) ? 1 : 0;
}

process.exitCode = main();
