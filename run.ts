// Entry point. Measures every cell in cells/ and prints a Markdown table.
// Exit code: 0 every verdict is right, 1 some verdict is wrong, 2 could not measure.
// Only main() touches the outside world; it hands a compiler host down as a parameter.
// Today the only stage is tsc with the options in cells/tsconfig.json.

import ts from "typescript";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { judge, parseHeader, type Result } from "./src/cell.ts";
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
  return diagnostics.map((d) => `TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
}

function measure(name: string, source: string, messages: readonly string[]): Row {
  const header = parseHeader(source);
  if (!header.ok) {
    return { name, invalid: header.error };
  }
  const outcome = messages.length === 0 ? "passes" : "stops";
  const verdict = judge(header.value, outcome, messages);
  return { name, header: header.value, outcome, verdict, message: messages[0] ?? "" };
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
    return measure(name.replace(/\.ts$/, ""), readFileSync(path, "utf8"), diagnose(path, options.value, host));
  });
  console.log(renderReport(rows, { typescript: ts.version, node: process.version }));
  return rows.some(isWrong) ? 1 : 0;
}

process.exitCode = main();
