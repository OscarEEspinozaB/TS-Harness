// Entry point. Audits a TypeScript project against the harness's rules (docs/DISENO.md §11).
// Usage: node audit.ts [project folder]   (default: the current folder; it must hold harness.json)
// Exit code: 0 no findings, 1 findings, 2 could not audit. An audit that read nothing never
// exits 0. Only main() touches the outside world: it reads harness.json and hands the compiler
// its file system as a capability.

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderAudit } from "./src/audit-report.ts";
import { parseConfig } from "./src/config.ts";
import { auditPrograms, loadPrograms } from "./src/project.ts";

function main(): number {
  const root = resolve(process.argv[2] ?? ".");
  const configPath = join(root, "harness.json");
  if (!existsSync(configPath)) {
    console.error(`no harness.json in ${root}`);
    return 2;
  }
  const config = parseConfig(readFileSync(configPath, "utf8"));
  if (!config.ok) {
    console.error(config.error);
    return 2;
  }
  const programs = loadPrograms(root, config.value, ts.sys);
  if (!programs.ok) {
    console.error(programs.error);
    return 2;
  }
  const audit = auditPrograms(root, config.value, programs.value);
  if (audit.files === 0) {
    console.error("the projects in harness.json hold no source files: an audit that read nothing never passes");
    return 2;
  }
  console.log(renderAudit(audit.standing, audit.allowed, audit.files, { typescript: ts.version, node: process.version }));
  return audit.standing.length === 0 ? 0 : 1;
}

process.exitCode = main();
