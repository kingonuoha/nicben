/**
 * In-process dev adapter — `decisions.md` **D-019**.
 *
 * Selected when `MONGODB_URI` is absent. It implements the **entire** port, so
 * the application builds, type-checks, runs and the enquiry pipeline can be
 * exercised end to end with no credentials and no vendor account. That is the
 * acceptance contract behind D-019/D-020/D-022: the client can provision
 * MongoDB, Resend and Vercel Blob later without a code change.
 *
 * Storage is a `Map` in module scope. In a serverless deployment each instance
 * is isolated and the contents are lost on a cold start, which is why
 * `lib/data/index.ts` logs a warning naming this adapter on every fallback and
 * logs at `error` level when `NODE_ENV === "production"`.
 *
 * This adapter is **not** a stub returning canned data: every method performs
 * the real operation against the in-memory collection, so a test that passes
 * here is testing the port's contract rather than a mock of it.
 */

import { randomUUID } from "node:crypto";

import type { Enquiry, EnquiryNotification, EnquiryStatus } from "../types";
import { logServerEvent } from "../../log/server-log";
import type {
  AddEnquiryNoteInput,
  EnquiryPage,
  EnquiryRepository,
  ListEnquiriesQuery,
  UpdateEnquiryStatusInput,
} from "../repository";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

/**
 * Insertion-ordered store. A `Map` preserves insertion order, and every insert
 * appends, so iteration order is oldest-first — `listEnquiries` reverses it to
 * match the index direction of the MongoDB adapter.
 */
const enquiries = new Map<string, Enquiry>();

function nowIso(): string {
  return new Date().toISOString();
}

function clone(record: Enquiry): Enquiry {
  // Deep enough that a caller mutating the returned object cannot reach into
  // the store — the same isolation a real database round trip provides.
  return {
    ...record,
    attachments: record.attachments.map((attachment) => ({ ...attachment })),
    notes: record.notes.map((note) => ({ ...note })),
    notification: { ...record.notification },
  };
}

function toPage(records: Enquiry[], query: ListEnquiriesQuery | undefined): EnquiryPage {
  const requested = query?.limit ?? DEFAULT_LIMIT;
  const limit = Math.min(Math.max(Math.trunc(requested) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  const filtered = query?.status
    ? records.filter((record) => record.status === query.status)
    : records;
  const ordered = [...filtered].reverse();

  const cursor = query?.cursor ?? null;
  const startIndex = cursor ? ordered.findIndex((record) => record.id === cursor) + 1 : 0;
  const slice = ordered.slice(startIndex, startIndex + limit);
  const endIndex = startIndex + slice.length;

  return {
    items: slice.map(clone),
    total: ordered.length,
    nextCursor: endIndex < ordered.length && slice.length > 0 ? slice[slice.length - 1].id : null,
  };
}

export function createDevEnquiryRepository(): EnquiryRepository {
  return {
    kind: "dev",

    async createEnquiry(input) {
      const timestamp = nowIso();
      const record: Enquiry = {
        id: randomUUID(),
        name: input.name,
        email: input.email,
        phone: input.phone,
        enquiryType: input.enquiryType,
        location: input.location,
        message: input.message,
        attachments: input.attachments.map((attachment) => ({ ...attachment })),
        consentAt: input.consentAt,
        status: "new",
        notes: [],
        ipHash: input.ipHash,
        notification: {
          configured: false,
          attemptedAt: null,
          delivered: false,
          error: null,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      enquiries.set(record.id, record);
      return clone(record);
    },

    async listEnquiries(query) {
      return toPage([...enquiries.values()], query);
    },

    async getEnquiry(id) {
      const record = enquiries.get(id);
      return record ? clone(record) : null;
    },

    async updateEnquiryStatus(id, input: UpdateEnquiryStatusInput) {
      const record = enquiries.get(id);
      if (!record) return null;
      const timestamp = nowIso();
      record.status = input.status;
      record.updatedAt = timestamp;
      if (input.note) {
        record.notes.push({
          id: randomUUID(),
          body: input.note,
          authorId: input.actorId ?? null,
          createdAt: timestamp,
        });
      }
      return clone(record);
    },

    async addEnquiryNote(id, input: AddEnquiryNoteInput) {
      const record = enquiries.get(id);
      if (!record) return null;
      const timestamp = nowIso();
      record.notes.push({
        id: randomUUID(),
        body: input.body,
        authorId: input.authorId,
        createdAt: timestamp,
      });
      record.updatedAt = timestamp;
      return clone(record);
    },

    async setEnquiryNotification(id, notification: EnquiryNotification) {
      const record = enquiries.get(id);
      if (!record) return null;
      record.notification = { ...notification };
      record.updatedAt = nowIso();
      return clone(record);
    },
  };
}

/**
 * Test/lifecycle helper. Clears the in-process store so a harness can start from
 * a known state (the acceptance run in `docs/tasks/phase-05-backend-and-contact/`
 * uses it, and a restart does the same thing naturally). Not part of the port.
 */
export function resetDevEnquiryStore(): void {
  enquiries.clear();
  logServerEvent({
    scope: "data",
    event: "dev_store_reset",
    level: "debug",
    data: { adapter: "dev" },
  });
}

/**
 * Read-only view for diagnostics. Returns counts only — never records — so a log
 * call cannot leak personal data. Not part of the port.
 */
export function devEnquiryStoreSize(): number {
  return enquiries.size;
}

/** Exported for the adapter's own tests: the statuses the port may assign. */
export const DEV_ADAPTER_STATUSES: readonly EnquiryStatus[] = [
  "new",
  "contacted",
  "quoted",
  "closed",
];
