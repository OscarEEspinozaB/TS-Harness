// The harness's rules over one source file (docs/DISENO.md §5 and §11). Pure: it reads only the
// syntax tree and the type checker it is given. Each rule says in its comment what it checks and
// what it does not.

import ts from "typescript";
import type { Finding } from "./finding.ts";

export type Role = "entry" | "test" | "module";

export type FileContext = {
  readonly checker: ts.TypeChecker;
  readonly file: ts.SourceFile;
  readonly path: string; // relative to the audited project
  readonly role: Role;
};

// WORLD: what reaches outside the program. Globals of ECMAScript, the browser and Node, matched
// by name only when the name resolves to an ambient declaration (a library's .d.ts), so a local
// binding of the same name is not flagged. Not checked: what a dependency does inside.
const WORLD_GLOBALS: ReadonlySet<string> = new Set([
  "Date",
  "performance",
  "crypto",
  "process",
  "console",
  "fetch",
  "globalThis",
  "window",
  "self",
  "document",
  "navigator",
  "location",
  "history",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "setTimeout",
  "setInterval",
  "setImmediate",
  "clearTimeout",
  "clearInterval",
  "clearImmediate",
  "queueMicrotask",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "requestIdleCallback",
  "EventSource",
  "WebSocket",
  "XMLHttpRequest",
  "Worker",
  "alert",
  "confirm",
  "prompt",
  "__dirname",
  "__filename",
]);

// Node's built-in modules that compute without touching the outside; every other one is WORLD.
const PURE_NODE_MODULES: ReadonlySet<string> = new Set(["path", "url", "util", "zlib", "buffer", "string_decoder", "querystring"]);
const NODE_BUILTINS: ReadonlySet<string> = new Set([
  "fs",
  "fs/promises",
  "child_process",
  "cluster",
  "crypto",
  "dgram",
  "dns",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "perf_hooks",
  "process",
  "readline",
  "repl",
  "stream",
  "test",
  "timers",
  "tls",
  "tty",
  "v8",
  "vm",
  "worker_threads",
  "assert",
  "events",
]);

// CONTEXT: method calls that do not change their receiver. Any other call on a parameter, or on
// a property of it, counts as a write: the rule only flags parameters plainly left unwritten.
const READING_METHODS: ReadonlySet<string> = new Set([
  "at",
  "clone",
  "concat",
  "distanceTo",
  "distanceToSquared",
  "dot",
  "entries",
  "equals",
  "every",
  "filter",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
  "flat",
  "flatMap",
  "forEach",
  "get",
  "has",
  "includes",
  "indexOf",
  "join",
  "keys",
  "lastIndexOf",
  "length",
  "lengthSq",
  "map",
  "reduce",
  "reduceRight",
  "slice",
  "some",
  "toArray",
  "toFixed",
  "toJSON",
  "toString",
  "values",
]);

function lineOf(file: ts.SourceFile, node: ts.Node): number {
  return file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;
}

function isExported(node: ts.Node): boolean {
  return ts.canHaveModifiers(node) && (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

function isAssignment(kind: ts.SyntaxKind): boolean {
  return kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment;
}

function isIncrement(node: ts.Node): node is ts.PrefixUnaryExpression | ts.PostfixUnaryExpression {
  return (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken);
}

// The identifier a write lands on, for `x = …`, `x += …`, `x++`; undefined otherwise.
function writtenIdentifier(node: ts.Node): ts.Identifier | undefined {
  if (ts.isBinaryExpression(node) && isAssignment(node.operatorToken.kind) && ts.isIdentifier(node.left)) {
    return node.left;
  }
  if (isIncrement(node) && ts.isIdentifier(node.operand)) {
    return node.operand;
  }
  return undefined;
}

function insideNode(inner: ts.Node, outer: ts.Node): boolean {
  return inner.pos >= outer.pos && inner.end <= outer.end;
}

function enclosingFunction(node: ts.Node): ts.SignatureDeclaration | undefined {
  for (let current = node.parent; current !== undefined; current = current.parent) {
    if (ts.isFunctionLike(current)) {
      return current;
    }
  }
  return undefined;
}

// Whether a reference is in a type position (`Date` as a type, `typeof window`): not a use.
function inTypePosition(node: ts.Node): boolean {
  for (let current = node.parent; current !== undefined; current = current.parent) {
    if (ts.isTypeNode(current) || ts.isHeritageClause(current)) {
      return true;
    }
    if (ts.isStatement(current) || ts.isExpressionStatement(current) || ts.isBlock(current)) {
      return false;
    }
  }
  return false;
}

// Declared by a library (.d.ts) or built into the compiler (globalThis has no declaration).
function isAmbient(symbol: Readonly<ts.Symbol> | undefined): boolean {
  if (symbol === undefined) {
    return false;
  }
  const declarations = symbol.declarations ?? [];
  return declarations.every((declaration) => declaration.getSourceFile().isDeclarationFile);
}

// The internal readonly flag of a property that a mapped type such as Readonly<T> made readonly:
// TypeScript keeps it in the transient symbol's links (CheckFlags.Readonly, 1 << 3). Not public
// API, so it is read defensively; if a TypeScript version moves it, such properties count as
// mutable, which errs towards asking for readonly.
function syntheticReadonly(symbol: Readonly<ts.Symbol>): boolean {
  const links: unknown = "links" in symbol ? symbol.links : undefined;
  const flags = typeof links === "object" && links !== null && "checkFlags" in links && typeof links.checkFlags === "number" ? links.checkFlags : 0;
  return (flags & 8) !== 0;
}

function propertyIsReadonly(symbol: Readonly<ts.Symbol>): boolean {
  if (syntheticReadonly(symbol)) {
    return true;
  }
  const declarations = symbol.declarations ?? [];
  return declarations.length > 0 && declarations.every((declaration) => (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Readonly) !== 0 || ts.isMethodSignature(declaration) || ts.isMethodDeclaration(declaration) || ts.isGetAccessorDeclaration(declaration));
}

const MUTABLE_CONTAINERS: ReadonlySet<string> = new Set([
  "Array",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "ArrayBuffer",
  "SharedArrayBuffer",
  "DataView",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float32Array",
  "Float64Array",
  "BigInt64Array",
  "BigUint64Array",
]);

function isReference(type: Readonly<ts.Type>): type is ts.TypeReference {
  return (type.flags & ts.TypeFlags.Object) !== 0 && "objectFlags" in type && typeof type.objectFlags === "number" && (type.objectFlags & ts.ObjectFlags.Reference) !== 0;
}

// Whether a value of this type can be changed through it, one level deep: an array or tuple
// that is not readonly, a mutable container (Map, Set, typed arrays), or an object with a
// property or index signature that is not readonly. Declared limit: Readonly<T> is shallow, and
// a class's methods may change it even when its properties are readonly.
export function isMutableType(checker: ts.TypeChecker, type: ts.Type): boolean {
  if (type.isUnion() || type.isIntersection()) {
    return type.types.some((member) => isMutableType(checker, member));
  }
  if ((type.flags & ts.TypeFlags.Object) === 0) {
    return false;
  }
  if (checker.isTupleType(type) && isReference(type)) {
    const target = type.target;
    return !("readonly" in target && target.readonly === true);
  }
  const name = type.getSymbol()?.getName() ?? "";
  if (MUTABLE_CONTAINERS.has(name)) {
    return true;
  }
  if (name === "ReadonlyArray" || name === "ReadonlyMap" || name === "ReadonlySet") {
    return false;
  }
  if (type.getCallSignatures().length > 0 && type.getProperties().length === 0) {
    return false;
  }
  if (checker.getIndexInfosOfType(type).some((info) => !info.isReadonly)) {
    return true;
  }
  return type.getProperties().some((property) => (property.flags & ts.SymbolFlags.Property) !== 0 && !propertyIsReadonly(property));
}

// CONTEXT: does the body write through this parameter? Writes are assignments, increments and
// delete through a property chain rooted at it, calls of methods not in READING_METHODS on it or
// on its properties, and letting it (or a property chain of it) escape: as an argument, a return
// value, an initializer, an assigned value or an element of a literal, since what receives it
// may change it.
function writesThrough(checker: ts.TypeChecker, body: ts.Node, parameter: Readonly<ts.Symbol>): boolean {
  let written = false;
  function visit(node: ts.Node): void {
    if (written) {
      return;
    }
    if (ts.isIdentifier(node) && checker.getSymbolAtLocation(node) === parameter) {
      let top: ts.Expression = node;
      while ((ts.isPropertyAccessExpression(top.parent) || ts.isElementAccessExpression(top.parent)) && top.parent.expression === top) {
        top = top.parent;
      }
      const parent = top.parent;
      const chained = top !== node;
      if (chained && ts.isBinaryExpression(parent) && isAssignment(parent.operatorToken.kind) && parent.left === top) {
        written = true;
      } else if (chained && (isIncrement(parent) || ts.isDeleteExpression(parent))) {
        written = true;
      } else if (chained && ts.isCallExpression(parent) && parent.expression === top) {
        const method = ts.isPropertyAccessExpression(top) ? top.name.text : "";
        written = !READING_METHODS.has(method);
      } else if (
        ((ts.isCallExpression(parent) || ts.isNewExpression(parent)) && parent.expression !== top) ||
        ts.isReturnStatement(parent) ||
        ts.isArrowFunction(parent) ||
        (ts.isVariableDeclaration(parent) && parent.initializer === top) ||
        (ts.isBinaryExpression(parent) && isAssignment(parent.operatorToken.kind) && parent.right === top) ||
        ts.isPropertyAssignment(parent) ||
        ts.isShorthandPropertyAssignment(parent) ||
        ts.isArrayLiteralExpression(parent) ||
        ts.isConditionalExpression(parent) ||
        (ts.isBinaryExpression(parent) && (parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken || parent.operatorToken.kind === ts.SyntaxKind.BarBarToken || parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken))
      ) {
        written = !(top !== node && !isMutableType(checker, checker.getTypeAtLocation(top)));
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(body);
  return written;
}

function hasHeader(file: ts.SourceFile): boolean {
  const text = file.getFullText();
  const ranges = ts.getLeadingCommentRanges(text, 0) ?? [];
  return ranges.some((range) => {
    const comment = text.slice(range.pos, range.end);
    return !/^\/\/\s*(rule:|reason:|harness-allow)/.test(comment) && !comment.startsWith("/// <") && comment.replace(/^\/[/*]+|\*\/$/g, "").trim().length > 0;
  });
}

const TOP_LEVEL_DECLARATIONS: ReadonlySet<ts.SyntaxKind> = new Set([
  ts.SyntaxKind.ImportDeclaration,
  ts.SyntaxKind.ImportEqualsDeclaration,
  ts.SyntaxKind.ExportDeclaration,
  ts.SyntaxKind.ExportAssignment,
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.TypeAliasDeclaration,
  ts.SyntaxKind.InterfaceDeclaration,
  ts.SyntaxKind.VariableStatement,
  ts.SyntaxKind.ClassDeclaration,
  ts.SyntaxKind.EnumDeclaration,
  ts.SyntaxKind.ModuleDeclaration,
  ts.SyntaxKind.EmptyStatement,
]);

// NAME: a binding that hides one of an enclosing scope, and a parameter named like its own
// function. Sibling scopes may reuse a name. Not checked: names from other modules or globals.
function nameFindings(context: FileContext, report: (node: ts.Node, rule: string, message: string) => void): void {
  function declare(name: ts.BindingName, scopes: readonly Set<string>[]): void {
    if (ts.isIdentifier(name)) {
      if (scopes.slice(0, -1).some((scope) => scope.has(name.text))) {
        report(name, "NAME", `'${name.text}' shadows a binding of an enclosing scope`);
      }
      scopes[scopes.length - 1]?.add(name.text);
      return;
    }
    for (const element of name.elements) {
      if (!ts.isOmittedExpression(element)) {
        declare(element.name, scopes);
      }
    }
  }
  function walk(node: ts.Node, scopes: readonly Set<string>[]): void {
    if (ts.isFunctionDeclaration(node) && node.name !== undefined) {
      const name = node.name.text;
      if (node.parameters.some((parameter) => ts.isIdentifier(parameter.name) && parameter.name.text === name)) {
        report(node.name, "NAME", `a parameter is named like its function '${name}'`);
      }
    }
    if (ts.isTypeNode(node) && !ts.isFunctionLike(node)) {
      return; // names inside types are not bindings
    }
    const opens = ts.isBlock(node) || ts.isFunctionLike(node) || ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node) || ts.isCatchClause(node) || ts.isCaseBlock(node);
    const inner = opens ? [...scopes, new Set<string>()] : scopes;
    if (ts.isVariableDeclaration(node) || (ts.isParameter(node) && !ts.isTypeNode(node.parent) && !ts.isIndexSignatureDeclaration(node.parent))) {
      declare(node.name, inner);
    }
    ts.forEachChild(node, (child) => {
      if ((ts.isFunctionDeclaration(child) || ts.isClassDeclaration(child)) && child.name !== undefined) {
        inner[inner.length - 1]?.add(child.name.text);
      }
      walk(child, inner);
    });
  }
  const module = new Set<string>();
  for (const statement of context.file.statements) {
    if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name !== undefined) {
      module.add(statement.name.text);
    }
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (clause?.name !== undefined) {
        module.add(clause.name.text);
      }
      const bindings = clause?.namedBindings;
      if (bindings !== undefined && ts.isNamedImports(bindings)) {
        bindings.elements.forEach((element) => module.add(element.name.text));
      } else if (bindings !== undefined) {
        module.add(bindings.name.text);
      }
    }
  }
  walk(context.file, [module]);
}

export function checkFile(context: FileContext): readonly Finding[] {
  const { checker, file, path, role } = context;
  const findings: Finding[] = [];
  const world = role !== "module";
  function report(node: ts.Node, rule: string, message: string): void {
    findings.push({ rule, file: path, line: lineOf(file, node), message });
  }
  if (!hasHeader(file)) {
    findings.push({ rule: "HEADER", file: path, line: 1, message: "module without a header comment saying what it is for" });
  }
  if (role === "entry" && !file.statements.some((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === "main")) {
    findings.push({ rule: "WORLD", file: path, line: 1, message: "entry point without a function main" });
  }
  for (const match of file.getFullText().matchAll(/@ts-(ignore|expect-error|nocheck)\b/g)) {
    findings.push({ rule: "BYPASS", file: path, line: file.getLineAndCharacterOfPosition(match.index).line + 1, message: `@ts-${match[1] ?? ""} switches a compiler check off` });
  }
  for (const statement of file.statements) {
    if (!world && !TOP_LEVEL_DECLARATIONS.has(statement.kind)) {
      report(statement, "IMPORT", "top-level statement runs on import");
    }
    if (ts.isVariableStatement(statement) && isExported(statement)) {
      const constant = (statement.declarationList.flags & ts.NodeFlags.Const) !== 0;
      for (const declaration of statement.declarationList.declarations) {
        if (!constant) {
          report(declaration, "STATE", "exported mutable binding: export a const");
        } else if (isMutableType(checker, checker.getTypeAtLocation(declaration.name))) {
          report(declaration, "STATE", "exported mutable value: give it a readonly type");
        }
      }
    }
  }
  function visit(node: ts.Node): void {
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      report(node, "CLASS", "class declaration: use readonly types and module functions");
    }
    if (!world && ts.isThrowStatement(node)) {
      report(node, "ERROR", "throw outside an entry point: return the failure as a value");
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.getText(file) === "Promise.reject" && !world) {
      report(node, "ERROR", "Promise.reject outside an entry point: return the failure as a value");
    }
    if (ts.isAsExpression(node) && !ts.isConstTypeReference(node.type)) {
      report(node, "HIDDEN", "type assertion 'as': check the value instead");
    }
    if (ts.isTypeAssertionExpression(node)) {
      report(node, "HIDDEN", "type assertion '<T>': check the value instead");
    }
    if (ts.isNonNullExpression(node)) {
      report(node, "HIDDEN", "non-null assertion '!': check for undefined instead");
    }
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      report(node, "HIDDEN", "explicit any: name the type, or use unknown and check it");
    }
    if (ts.isExportAssignment(node) || (ts.isExportDeclaration(node) && (node.exportClause === undefined || ts.isNamespaceExport(node.exportClause)))) {
      report(node, "SURFACE", ts.isExportAssignment(node) ? "export default: export by name" : "export *: export each name");
    }
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)) {
      report(node, "SURFACE", "export default: export by name");
    }
    if (ts.isFunctionLike(node) && node.parameters.length > 7) {
      report(node, "SIZE", `${node.parameters.length} parameters: more than 7`);
    }
    // IMPORT: what makes importing or running a module unpredictable from its text.
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && !(node.arguments[0] !== undefined && ts.isStringLiteralLike(node.arguments[0]))) {
      report(node, "IMPORT", "dynamic import with a path that is not a literal");
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && isAmbient(checker.getSymbolAtLocation(node.expression))) {
      const name = node.expression.text;
      if (name === "require" || name === "eval" || name === "Function") {
        report(node, "IMPORT", `${name}: code that is not visible to the compiler`);
      }
    }
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Function" && isAmbient(checker.getSymbolAtLocation(node.expression))) {
      report(node, "IMPORT", "new Function: code that is not visible to the compiler");
    }
    // WORLD: outside entry points and tests, nothing from outside the program.
    if (!world && ts.isIdentifier(node) && WORLD_GLOBALS.has(node.text) && !inTypePosition(node)) {
      const parent = node.parent;
      const isName = (ts.isPropertyAccessExpression(parent) && parent.name === node) || (ts.isPropertyAssignment(parent) && parent.name === node) || ts.isPropertySignature(parent) || (ts.canHaveModifiers(parent) && "name" in parent && parent.name === node && !ts.isExpression(parent));
      if (!isName && isAmbient(checker.getSymbolAtLocation(node))) {
        report(node, "WORLD", `'${node.text}' reaches outside the program: receive it from main as a capability`);
      }
    }
    if (!world && ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Math" && node.name.text === "random") {
      report(node, "WORLD", "'Math.random' reaches outside the program: receive a Random from main");
    }
    if (!world && (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined && ts.isStringLiteral(node.moduleSpecifier)) {
      const name = node.moduleSpecifier.text.replace(/^node:/, "");
      if ((node.moduleSpecifier.text.startsWith("node:") || NODE_BUILTINS.has(name)) && !PURE_NODE_MODULES.has(name)) {
        report(node, "WORLD", `'${node.moduleSpecifier.text}' reaches outside the program: only entry points import it`);
      }
    }
    // LAMBDA: an arrow function or function expression writes a variable it captured. Not
    // checked: changes to a captured object through its properties or methods.
    const target = writtenIdentifier(node);
    if (target !== undefined) {
      const lambda = enclosingFunction(node);
      if (lambda !== undefined && (ts.isArrowFunction(lambda) || ts.isFunctionExpression(lambda))) {
        const declaration = checker.getSymbolAtLocation(target)?.declarations?.[0];
        if (declaration !== undefined && !insideNode(declaration, lambda)) {
          report(node, "LAMBDA", `the lambda writes '${target.text}', which it captured: return the value instead`);
        }
      }
    }
    // CONTEXT: a parameter of mutable type that the function never writes.
    if ((ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isMethodDeclaration(node)) && node.body !== undefined) {
      for (const parameter of node.parameters) {
        if (parameter.type === undefined || !ts.isIdentifier(parameter.name)) {
          continue;
        }
        const symbol = checker.getSymbolAtLocation(parameter.name);
        if (symbol !== undefined && isMutableType(checker, checker.getTypeAtLocation(parameter.name)) && !writesThrough(checker, node.body, symbol)) {
          report(parameter, "CONTEXT", `'${parameter.name.text}' has a mutable type but is never written: declare it readonly`);
        }
      }
    }
    // RELEASE: a Disposable held without using.
    // AwaitUsing is Const | Using, so the kind of declaration is read from all the scoping bits.
    const scoping = ts.isVariableDeclaration(node) && ts.isVariableDeclarationList(node.parent) ? node.parent.flags & ts.NodeFlags.BlockScoped : -1;
    if (ts.isVariableDeclaration(node) && scoping !== -1 && scoping !== ts.NodeFlags.Using && scoping !== ts.NodeFlags.AwaitUsing) {
      const disposable = checker
        .getTypeAtLocation(node.name)
        .getProperties()
        .some((property) => /^__@(asyncDispose|dispose)@/.test(String(property.escapedName)));
      if (disposable) {
        report(node, "RELEASE", "a Disposable held without using: declare it with using");
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  nameFindings(context, report);
  return findings;
}
