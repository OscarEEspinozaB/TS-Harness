// Markdown report of a measurement. Pure: no access to the outside world.

import type { Header, Outcome, Verdict } from "./cell.ts";

export type Row =
  | {
      readonly name: string;
      readonly header: Header;
      readonly outcome: Outcome;
      readonly verdict: Verdict;
      readonly message: string;
    }
  | {
      readonly name: string;
      readonly invalid: string;
    };

export type Versions = {
  readonly typescript: string;
  readonly node: string;
};

const MESSAGE_WIDTH: number = 90;

function cellText(text: string): string {
  return text.replaceAll("|", "\\|").slice(0, MESSAGE_WIDTH);
}

function renderRow(row: Row): string {
  if ("invalid" in row) {
    return `| \`${row.name}\` | ? | ? | error | **FAIL** | ${cellText(row.invalid)} |`;
  }
  const { rule, kind } = row.header;
  return `| \`${row.name}\` | ${rule} | ${kind} | ${row.outcome} | ${row.verdict} | ${cellText(row.message)} |`;
}

export function isWrong(row: Row): boolean {
  return "invalid" in row || row.verdict !== "ok";
}

export function renderReport(rows: readonly Row[], versions: Versions): string {
  const stopped = rows.filter((row) => !("invalid" in row) && row.outcome === "stops").length;
  const wrong = rows.filter(isWrong).length;
  return [
    "| Cell | Rule | Kind | Result | Verdict | Message |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows.map(renderRow),
    "",
    `TypeScript ${versions.typescript}, Node ${versions.node}. Cells: ${rows.length}. Stopped: ${stopped}. Wrong verdicts: ${wrong}.`,
  ].join("\n");
}
