# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

TS-Harness is a harness for writing TypeScript with limited context. **It exists for the AI, not for the language:** so that a model can write and change correct code in a project of hundreds of thousands of lines that never fits in its context. Understanding a function should only require reading its signature, its body and the signatures it calls. Core property:

> **A function changes only what its signature says it changes, reaches the outside world only through what it receives, and fails only in the ways its return type declares.**

Tie-breaker (decided by the author): between two ways of writing the same thing, require the one that leaves less to read outside the signature and the body. Whether this really helps an AI is an unmeasured hypothesis until `docs/DISENO.md` §9.3 is measured.

It is the third harness after `../C-Harness` and `../Rust-Harness`. Its rules derive from Zymbol's premises (`../zymbol-lang/zymbol-design/PREMISES.md`); when in doubt about what a rule must do, the premises outweigh a proposal from this repository. `../Rust-Harness/docs/REGLAS.md` and `../Rust-Harness/run.sh` are the closest precedent.

## Commands

Requires Node 24+ (runs TypeScript directly, no build). `npm install` installs `typescript` 6.0.3 (pinned; TS 7's API is still `unstable/*`) and `@types/node`.

```sh
node run.ts       # measures every cell in cells/; exit 0 all verdicts right, 1 a wrong verdict, 2 could not measure
npx tsc -p .      # type-checks the harness itself (run.ts, src/) with the root tsconfig.json
```

To record a measurement, save `node run.ts` output to a new dated file in `results/`; past measurements are never rewritten. Today the only stage is tsc with `cells/tsconfig.json`; the runner only measures single-file cells. `tsc` skips `isolatedDeclarations` errors under `noEmit`, so both configs use `emitDeclarationOnly` into `build/` (ignored), and the runner calls `getDeclarationDiagnostics()` explicitly.

**Status:** first measurement done (tsc only, 52 cells, 14 stopped, 0 wrong verdicts; see `docs/DISENO.md` §10). No harness rule exists yet. The design is in [docs/DISENO.md](docs/DISENO.md): purpose (sourced from `zymbol-design/MODEL.md` §2.4), proposed rules, mechanism, decisions taken and measurements. Its first user is a private project; see `CLAUDE.local.md` if present.

Decided design points (DISENO.md §8): no `class` declarations in own code (readonly types plus module functions); no `throw` outside `main`, failures are values in the return type; `using` for every `Disposable`; outside access only in a declared entry point's `main`, which passes typed capabilities (`Clock`, `Random`, `Socket`) down as parameters; one profile, no relaxed mode.

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

## Intended mechanism

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
