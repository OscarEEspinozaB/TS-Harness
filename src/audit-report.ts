// The text an audit prints: findings grouped by rule, then every exception with its reason, then
// a summary line. Pure: no access to the outside world.

import { type Allowed, type Finding, RULES } from "./finding.ts";
import type { Versions } from "./report.ts";

function where(finding: Finding): string {
  return `${finding.file}:${finding.line}`;
}

export function renderAudit(findings: readonly Finding[], allowed: readonly Allowed[], files: number, versions: Versions): string {
  const order = ["TSC", ...RULES];
  const sorted = [...findings].sort((a, b) => order.indexOf(a.rule) - order.indexOf(b.rule) || a.file.localeCompare(b.file) || a.line - b.line);
  const lines: string[] = [];
  let rule = "";
  for (const finding of sorted) {
    if (finding.rule !== rule) {
      rule = finding.rule;
      lines.push("", `${rule}: ${sorted.filter((other) => other.rule === rule).length}`);
    }
    lines.push(`  ${where(finding)}  ${finding.message}`);
  }
  if (allowed.length > 0) {
    lines.push("", `Exceptions (harness-allow): ${allowed.length}`);
    for (const { finding, reason } of [...allowed].sort((a, b) => a.finding.file.localeCompare(b.finding.file) || a.finding.line - b.finding.line)) {
      lines.push(`  ${where(finding)}  ${finding.rule}: ${reason}`);
    }
  }
  const counts = order.map((name) => [name, findings.filter((finding) => finding.rule === name).length] as const).filter(([, count]) => count > 0);
  lines.push(
    "",
    `TypeScript ${versions.typescript}, Node ${versions.node}. Files: ${files}. Findings: ${findings.length}${counts.length > 0 ? ` (${counts.map(([name, count]) => `${name} ${count}`).join(", ")})` : ""}. Exceptions: ${allowed.length}.`,
  );
  return lines.join("\n").trimStart();
}
