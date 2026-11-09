// Auditing a whole project: its TypeScript programs, each file once, the import graph for LAYER,
// tsc's own diagnostics as TSC findings, and the documented exceptions. Pure apart from the
// compiler: reading the disk goes through the ts.System that the entry point passes in.

import ts from "typescript";
import { dirname, join, relative, resolve } from "node:path";
import { applyExceptions } from "./allow.ts";
import type { Result } from "./cell.ts";
import { type Config, matchesAny } from "./config.ts";
import type { Allowed, Finding } from "./finding.ts";
import { type Import, layerFindings } from "./layers.ts";
import { checkFile, type Role } from "./rules.ts";

export type Audit = {
  readonly standing: readonly Finding[];
  readonly allowed: readonly Allowed[];
  readonly files: number;
};

function roleOf(config: Config, path: string): Role {
  if (matchesAny(config.entryPoints, path)) {
    return "entry";
  }
  return matchesAny(config.tests, path) ? "test" : "module";
}

function diagnosticFinding(root: string, diagnostic: Readonly<ts.Diagnostic>): Finding {
  const file = diagnostic.file;
  const line = file === undefined || diagnostic.start === undefined ? 0 : file.getLineAndCharacterOfPosition(diagnostic.start).line + 1;
  return {
    rule: "TSC",
    file: file === undefined ? "(project)" : relative(root, file.fileName),
    line,
    message: `TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
  };
}

// The programs of the projects harness.json lists, read through `system`.
export function loadPrograms(root: string, config: Config, system: ts.System): Result<readonly ts.Program[]> {
  const programs: ts.Program[] = [];
  for (const project of config.projects) {
    const tsconfig = join(root, project);
    const read = ts.readConfigFile(tsconfig, (path) => system.readFile(path));
    if (read.error !== undefined) {
      return { ok: false, error: `cannot read ${project}: ${ts.flattenDiagnosticMessageText(read.error.messageText, " ")}` };
    }
    const parsed = ts.parseJsonConfigFileContent(read.config, system, dirname(tsconfig));
    if (parsed.errors.length > 0) {
      return { ok: false, error: `cannot use ${project}: ${parsed.errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, " ")).join("; ")}` };
    }
    programs.push(ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options }));
  }
  return { ok: true, value: programs };
}

export function auditPrograms(root: string, config: Config, programs: readonly ts.Program[]): Audit {
  const findings: Finding[] = [];
  const files = new Map<string, ts.SourceFile>();
  const imports: Import[] = [];
  for (const program of programs) {
    const checker = program.getTypeChecker();
    const own = program.getSourceFiles().filter((file) => !file.isDeclarationFile && !relative(root, file.fileName).startsWith("..") && !file.fileName.includes("/node_modules/"));
    for (const file of own) {
      const path = relative(root, file.fileName);
      if (files.has(path)) {
        continue; // audited with an earlier project
      }
      files.set(path, file);
      findings.push(...checkFile({ checker, file, path, role: roleOf(config, path) }));
      const diagnostics = [...program.getSyntacticDiagnostics(file), ...program.getSemanticDiagnostics(file), ...program.getDeclarationDiagnostics(file)];
      findings.push(...diagnostics.map((diagnostic) => diagnosticFinding(root, diagnostic)));
      for (const statement of file.statements) {
        if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier !== undefined && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text.startsWith(".")) {
          const target = relative(root, resolve(dirname(file.fileName), statement.moduleSpecifier.text));
          imports.push({ from: path, to: target, line: file.getLineAndCharacterOfPosition(statement.getStart(file)).line + 1 });
        }
      }
    }
  }
  findings.push(...layerFindings(imports, config.layers));
  const { standing, allowed } = applyExceptions(findings, files);
  return { standing, allowed, files: files.size };
}
