// LAYER: import cycles between the audited files, and imports that cross the layers a project
// declares (a folder may import only from the folders its layer lists). Type-only imports count:
// they are dependencies of the reader's context even when they vanish at run time. Pure: it works
// on the import graph it is given.

import type { Finding } from "./finding.ts";

export type Import = {
  readonly from: string; // importing file, relative to the project
  readonly to: string; // imported file, relative to the project
  readonly line: number;
};

function folderOf(path: string): string {
  return path.includes("/") ? (path.split("/")[0] ?? "") : ".";
}

export function layerFindings(imports: readonly Import[], layers: ReadonlyMap<string, readonly string[]>): readonly Finding[] {
  const findings: Finding[] = [];
  for (const edge of imports) {
    const from = folderOf(edge.from);
    const to = folderOf(edge.to);
    const allowed = layers.get(from);
    if (allowed !== undefined && from !== to && !allowed.includes(to)) {
      findings.push({ rule: "LAYER", file: edge.from, line: edge.line, message: `'${from}' may not import from '${to}' (layers in harness.json)` });
    }
  }
  const next = new Map<string, Import[]>();
  for (const edge of imports) {
    next.set(edge.from, [...(next.get(edge.from) ?? []), edge]);
  }
  const state = new Map<string, "open" | "done">();
  const reported = new Set<string>();
  function visit(file: string, path: readonly Import[]): void {
    state.set(file, "open");
    for (const edge of next.get(file) ?? []) {
      if (state.get(edge.to) === "open") {
        const start = path.findIndex((step) => step.from === edge.to);
        const cycle = [...path.slice(start === -1 ? path.length : start), edge];
        const key = cycle.map((step) => step.from).sort().join(" ");
        if (!reported.has(key)) {
          reported.add(key);
          findings.push({ rule: "LAYER", file: edge.from, line: edge.line, message: `import cycle: ${cycle.map((step) => step.from).join(" → ")} → ${edge.to}` });
        }
      } else if (state.get(edge.to) === undefined) {
        visit(edge.to, [...path, edge]);
      }
    }
    state.set(file, "done");
  }
  for (const file of [...next.keys()].sort()) {
    if (state.get(file) === undefined) {
      visit(file, []);
    }
  }
  return findings;
}
