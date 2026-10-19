/**
 * Module resolution hooks for the Phase 06 verification harness.
 *
 * A copy of the Phase 05 loader, for the same reason it exists there: Node 22.18 strips
 * TypeScript types natively, so the application's own modules can be imported and
 * exercised **as written** — no transpile step, no build, no copy of the logic under test.
 * Two gaps have to be closed:
 *
 *   1. `@/*` path aliases (`tsconfig.json` `paths`) — Node knows nothing about them.
 *   2. Extension-less relative imports (`./notify`) — ESM requires a resolvable specifier
 *      and TypeScript's `bundler` resolution omits the extension.
 *
 * Nothing in this file is part of the application. It lives under `tests/` so it can never
 * reach the served tree (`decisions.md` D-011).
 */

import { registerHooks } from "node:module";
import { statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** `web/` — the directory that holds `tsconfig.json`. */
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

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
