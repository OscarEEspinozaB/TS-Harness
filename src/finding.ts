// What the audit reports: findings by rule, and the rules it knows. Pure: no access to the
// outside world.

export const RULES: readonly string[] = [
  "STATE",
  "WORLD",
  "CONTEXT",
  "ERROR",
  "CLASS",
  "SURFACE",
  "LAYER",
  "NAME",
  "LAMBDA",
  "IMPORT",
  "RELEASE",
  "SIZE",
  "HIDDEN",
  "BYPASS",
  "HEADER",
  "ALLOW",
];

export type Finding = {
  readonly rule: string;
  readonly file: string; // relative to the audited project
  readonly line: number; // 1-based
  readonly message: string;
};

export type Allowed = {
  readonly finding: Finding;
  readonly reason: string;
};
