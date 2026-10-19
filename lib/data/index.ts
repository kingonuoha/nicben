/**
 * Adapter selection — `decisions.md` **D-019**.
 *
 * `MONGODB_URI` present  → MongoDB adapter (`lib/data/adapters/mongo.ts`).
 * `MONGODB_URI` absent   → in-process dev adapter (`lib/data/adapters/dev.ts`),
 *                          with a logged warning.
 *
 * This is the **only** module in the application that decides where data is
 * stored. Nothing else may import `mongodb`, and nothing else may read
 * `MONGODB_URI`. That rule is what makes the credentials-absent build possible
 * (D-019 "Consequence") and it is checked by `docs/tasks/phase-05-backend-and-contact/`
 * verification — `grep -rn "from \"mongodb\"" lib app` must match only this
 * directory's mongo adapter.
 *
 * Selection is async because the MongoDB adapter is loaded with a dynamic
 * `import()`. Keeping the driver off the module graph when it cannot be reached
 * is deliberate: it means a build with no environment variables bundles no
 * database driver at all.
 */

import { logServerEvent } from "../log/server-log";
import { createDevEnquiryRepository } from "./adapters/dev";
import type { EnquiryRepository } from "./repository";

let cachedRepository: EnquiryRepository | null = null;
let selectionLogged = false;

function hasMongoUri(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim());
}

export async function getEnquiryRepository(): Promise<EnquiryRepository> {
  if (cachedRepository) return cachedRepository;

  if (hasMongoUri()) {
    const { createMongoEnquiryRepository } = await import("./adapters/mongo");
    cachedRepository = createMongoEnquiryRepository();
  } else {
    cachedRepository = createDevEnquiryRepository();
    if (!selectionLogged) {
      selectionLogged = true;
      // Loud on purpose. In development this is the expected, documented
      // fallback. In production it means enquiries are held in the memory of a
      // single instance and will not survive a cold start, so it is logged at
      // `error` level: the deployment is functional but not durable until the
      // client provisions Atlas (D-019).
      logServerEvent({
        scope: "data",
        event: "adapter_fallback_dev",
        level: process.env.NODE_ENV === "production" ? "error" : "warn",
        data: {
          reason: "MONGODB_URI is not set",
          adapter: "dev",
          durable: false,
          consequence:
            "enquiries are stored in the memory of this instance only; set MONGODB_URI to persist them",
        },
      });
    }
  }

  return cachedRepository;
}

/** True when a durable store is configured. Safe to expose to diagnostics. */
export function isDurableStoreConfigured(): boolean {
  return hasMongoUri();
}

/**
 * Test/lifecycle helper: forget the selected adapter so a harness can switch
 * environments in one process. Not used by application code.
 */
export function resetEnquiryRepository(): void {
  cachedRepository = null;
  selectionLogged = false;
}

export type { EnquiryRepository } from "./repository";
