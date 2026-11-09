# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

TS-Harness is a harness for writing TypeScript with limited context. **It exists for the AI, not for the language:** so that a model can write and change correct code in a project of hundreds of thousands of lines that never fits in its context. Understanding a function should only require reading its signature, its body and the signatures it calls. Core property:

> **A function changes only what its signature says it changes, reaches the outside world only through what it receives, and fails only in the ways its return type declares.**

Tie-breaker (decided by the author): between two ways of writing the same thing, require the one that leaves less to read outside the signature and the body. Whether this really helps an AI is an unmeasured hypothesis until `docs/DISENO.md` §9.3 is measured.

It is the third harness after `../C-Harness` and `../Rust-Harness`. Its rules derive from Zymbol's premises (`../zymbol-lang/zymbol-design/PREMISES.md`); when in doubt about what a rule must do, the premises outweigh a proposal from this repository. `../Rust-Harness/docs/REGLAS.md` and `../Rust-Harness/run.sh` are the closest precedent.

## Commands

Requires Node 24+ (runs TypeScript directly, no build). `npm install` installs `typescript` 6.0.3 (pinned; TS 7's API is still `unstable/*`) and `@types/node`, and points git at `.githooks/` (pre-commit runs `npm run check`).

```sh
npm run check            # tsc on the harness, every cell and fixture, then the self-audit; the pre-commit hook
node run.ts              # measures cells/ and fixtures/; exit 0 all verdicts right, 1 a wrong verdict, 2 could not measure
node audit.ts <project>  # audits a project with a harness.json; exit 0 no findings, 1 findings, 2 could not audit
npx tsc -p .             # type-checks the harness itself (run.ts, audit.ts, src/)
```

To record a measurement, save `node run.ts` output to a new dated file in `results/`; past measurements are never rewritten.

**Status:** 16 rules implemented on the compiler API (`src/rules.ts`, `src/layers.ts`, `src/allow.ts`), measured on 69 single-file cells and 3 multi-file fixtures with 0 wrong verdicts; the harness audits itself (`harness.json`) with 0 findings. What each rule checks, what it does not, and the decisions taken while implementing them (2026-11-09, delegated by the author with the criterion "rules that help building"): `docs/DISENO.md` §11. Its first user is a private project; see `CLAUDE.local.md` if present.

Layout: `audit.ts` and `run.ts` are the entry points; `src/project.ts` audits a set of programs (pure, the entry passes `ts.sys`); `src/rules.ts` holds the per-file rules; `src/layers.ts` LAYER; `src/allow.ts` the documented exceptions (`// harness-allow RULE: reason`, real comments only, unused ones are findings); `src/config.ts` reads `harness.json` (projects, entryPoints, tests, layers). A cell is judged by tsc plus its own rule's findings; a cell named `*_entry.ts` is an entry point. `fixtures/*/` are small projects with an `expected.json` of findings per rule.

Decided design points (DISENO.md §8, §11): no `class` declarations in own code (readonly types plus module functions); no `throw` outside entry points and tests, failures are values in the return type; `using` for every `Disposable`; outside access only in declared entry points (whole files, each with a `main`) and tests; constants computed at load are allowed, loose top-level statements are not; one profile, no relaxed mode, only line-level exceptions with a reason.

## Faithful to TypeScript (decided by the author)

Each premise supplies a purpose; the rule enforces it with TypeScript's own mechanisms (types, `readonly`, the module system, the compiler API). Never port a form designed for Zymbol or another language: when TypeScript has no faithful way to hold a premise, record it as a declared limit. Do not add a rule for what TypeScript already guarantees.

## Working rules

- **A rule is a program.** It exists once the tool rejects code that breaks it; before that it is at most a `gap` cell. Never describe a proposed rule as if it held.
- **State what each rule checks and what it does not.** Do not claim more than was measured.
- **It passes itself first.** All harness code satisfies its own rules; the self-audit is one more verdict.
- **Every defect is fixed together with a cell that watches it.**
- **A rejection only counts if it is for the expected reason.**
- **Cell results are regression tests, not a detection rate.** Do not present them as one.
- Domain rules for a specific project (for example, non-deterministic trig functions in a simulator) do not belong here.
- The author decides what becomes a rule. A decision is changed deliberately and on its own, never as a side effect of implementing something.

## Mechanism

- Verifier on the TypeScript compiler API (`typescript` package), its only dependency, so rules can use type information.
- First stage: `tsc` in strict mode plus the extra flags listed in `docs/DISENO.md` §4, including `erasableSyntaxOnly`, `verbatimModuleSyntax` and `isolatedDeclarations`.
- Surface map (proposed): an index of every module's `.d.ts`, so a model loads signatures instead of code.
- Runs on Node 24 without a build step (native type stripping). Measured 2026-11-07: Node v24.16.0.
- Exit codes: 0 no findings, 1 findings, 2 could not audit. An audit that read nothing never exits 0.
- The cell runner is TypeScript, under the same rules. Cell format: [cells/README.md](cells/README.md).

## Languages

- **Code in English:** identifiers, comments, messages, generated tables, code file names.
- **Documentation in Spanish:** README and `docs/`. Code names are quoted as written.
- **Internal documents in English:** this file.

## Repository

- **License:** undecided, so there is no `LICENSE` file. A granted license cannot be withdrawn: do not add one until the author chooses.
- **Identity:** the sibling repos commit as `219075297+OscarEEspinozaB@users.noreply.github.com` under the GitHub account `OscarEEspinozaB`. Set `user.email` before the first commit and check `gh auth status`, since there is more than one account.
- **Not published:** check `.gitignore` and `CLAUDE.local.md` before adding files; look for local paths and private data.
