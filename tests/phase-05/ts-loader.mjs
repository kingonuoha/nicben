/**
 * Module resolution hooks for the Phase 05 verification harness.
 *
 * Node 22.18 strips TypeScript types natively (`process.features.typescript === "strip"`),
 * so the application's own modules can be imported and exercised **as written** —
 * no transpile step, no separate build, no copy of the logic under test. Two
 * gaps have to be closed for that to work:
 *
 *   1. `@/*` path aliases (`tsconfig.json` `paths`) — Node knows nothing about them.
 *   2. Extension-less relative imports (`./notify`) — ESM requires a specifier
 *      that resolves, and TypeScript's `bundler` resolution omits the extension.
 *
 * Both are handled by the synchronous `resolve` hook below. Nothing in this file
 * is part of the application; it lives under `tests/` precisely so it can never
 * reach the served tree (`decisions.md` D-011).
 */

import { registerHooks } from "node:module";
import { statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** `web/` — the directory that holds `tsconfig.json`. */
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const SUFFIXES = ["", ".ts", ".tsx", ".mts", ".mjs", ".js", "/index.ts", "/index.tsx"];

function resolveToFile(basePath) {
  for (const suffix of SUFFIXES) {
    const candidate = basePath + suffix;
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // Not this suffix; try the next.
    }
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const resolved = resolveToFile(path.join(PROJECT_ROOT, specifier.slice(2)));
      if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }

    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      const parent = context.parentURL
        ? path.dirname(fileURLToPath(context.parentURL))
        : PROJECT_ROOT;
      const resolved = resolveToFile(path.resolve(parent, specifier));
      if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }

    return nextResolve(specifier, context);
  },
});

export { PROJECT_ROOT };
