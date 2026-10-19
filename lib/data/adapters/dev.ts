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
 * The store hangs off `globalThis` rather than off module scope — see the `DevStore`
 * comment below for why one store per route handler is not one store per process.
 *
 * This adapter is **not** a stub returning canned data: every method performs
 * the real operation against the in-memory collection, so a test that passes
 * here is testing the port's contract rather than a mock of it.
 */

import { randomUUID } from "node:crypto";

import type {
  AdminUser,
  AuditLog,
  Enquiry,
  EnquiryNotification,
  EnquiryStatus,
  PageContent,
  Project,
  Setting,
  Testimonial,
} from "../types";
import { logServerEvent } from "../../log/server-log";
import type {
  AddEnquiryNoteInput,
  AdminListPage,
  AppendAuditLogInput,
  EnquiryPage,
  EnquiryRepository,
  ListAuditLogQuery,
  ListEnquiriesQuery,
  ListProjectsQuery,
  ListTestimonialsQuery,
  UpdateEnquiryStatusInput,
  UpsertPageContentInput,
  UpsertProjectInput,
  UpsertSettingsInput,
  UpsertTestimonialInput,
} from "../repository";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

/**
 * The in-process store.
 *
 * ### Why it lives on `globalThis` rather than in module scope
 *
 * A Next.js server bundles each route entry point separately, so **this module is
 * instantiated once per route handler**. Module-scope `Map`s therefore produced one store
 * per route, which is invisible while a single route uses them — Phase 05's enquiry
 * endpoint — and immediately wrong as soon as two routes have to agree: with Phase 06 the
 * login route seeded an admin whose generated `id` the session route had never seen, so a
 * token issued by one was rejected by the other.
 *
 * Hanging the store off `globalThis` makes it one store per **process**, which is what the
 * port's contract actually promises and what the MongoDB adapter does naturally. The
 * honest limitation is unchanged: it is not shared across instances and it is lost on a
 * cold start, so `lib/data/index.ts` still logs a warning naming this adapter.
 *
 * `settings` is a single row in the MongoDB adapter, so it is a `Map` with at most one
 * entry here rather than a scalar — that keeps the two adapters' behaviour identical,
 * including "nothing saved yet" being `null`.
 */
interface DevStore {
  /** Insertion-ordered, so iteration is oldest-first and the list methods can reverse it. */
  enquiries: Map<string, Enquiry>;
  projects: Map<string, Project>;
  testimonials: Map<string, Testimonial>;
  pageContents: Map<string, PageContent>;
  settings: Map<string, Setting>;
  auditLogs: Map<string, AuditLog>;
  adminsByEmail: Map<string, AdminUser>;
  adminSeedAttempted: boolean;
  adminSeedReason: "seeded" | "not-configured" | "invalid-hash" | null;
}

const DEV_STORE_KEY = "__nicbenDevStoreV1__";

type GlobalWithDevStore = typeof globalThis & { [DEV_STORE_KEY]?: DevStore };

function devStore(): DevStore {
  const globalScope = globalThis as GlobalWithDevStore;
  if (!globalScope[DEV_STORE_KEY]) {
    globalScope[DEV_STORE_KEY] = {
      enquiries: new Map(),
      projects: new Map(),
      testimonials: new Map(),
      pageContents: new Map(),
      settings: new Map(),
      auditLogs: new Map(),
      adminsByEmail: new Map(),
      adminSeedAttempted: false,
      adminSeedReason: null,
    };
  }
  return globalScope[DEV_STORE_KEY];
}

/**
 * The store, resolved once at module evaluation. Every module instance reads the **same
 * `Map` objects** off `globalThis`, so the references below are stable and the method
 * bodies need no changes. The seed flags are read and written through `devStore()` rather
 * than through a captured copy, because a primitive copy would not be shared.
 */
const {
  enquiries,
  projects,
  testimonials,
  pageContents,
  settings,
  auditLogs,
  adminsByEmail,
} = devStore();

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

/**
 * Generic newest-first page for the Phase 06 stores. Insertion order is
 * oldest-first, so the reversed array is newest-first — the same direction the
 * MongoDB adapter sorts `_id` in.
 */
function toAdminPage<T extends { id: string }>(
  records: T[],
  limit: number | undefined,
  cursor: string | null | undefined,
  cloneRecord: (record: T) => T,
): AdminListPage<T> {
  const ordered = [...records].reverse();
  const startIndex = cursor ? ordered.findIndex((record) => record.id === cursor) + 1 : 0;
  const slice = ordered.slice(startIndex, startIndex + clampLimit(limit));
  const endIndex = startIndex + slice.length;
  return {
    items: slice.map(cloneRecord),
    total: ordered.length,
    nextCursor: endIndex < ordered.length && slice.length > 0 ? slice[slice.length - 1].id : null,
  };
}

function clampLimit(value: number | undefined): number {
  const requested = value ?? DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(requested) || DEFAULT_LIMIT, 1), MAX_LIMIT);
}

function cloneProject(record: Project): Project {
  return { ...record, images: [...record.images] };
}

function clonePageContent(record: PageContent): PageContent {
  return { ...record, sections: record.sections.map((section) => ({ ...section })) };
}

function cloneSettings(record: Setting): Setting {
  return {
    ...record,
    contact: { ...record.contact },
    serviceAreas: {
      states: record.serviceAreas.states ? [...record.serviceAreas.states] : null,
      note: record.serviceAreas.note,
    },
    seoDefaults: { ...record.seoDefaults },
  };
}

function cloneAuditLog(record: AuditLog): AuditLog {
  return { ...record, metadata: record.metadata ? { ...record.metadata } : null };
}

/**
 * `decisions.md` D-030 — the dev adapter seeds an admin from `ADMIN_EMAIL` +
 * `ADMIN_PASSWORD_HASH` **when present**, so the portal can be exercised locally
 * with no database and no committed credential.
 *
 * Seeding is lazy (first credential lookup) rather than at module evaluation:
 * module scope in a serverless runtime is shared across warm invocations, but the
 * environment a harness sets before importing this module must still be the
 * environment the seed sees.
 *
 * When the variables are absent the store stays empty, and `lib/auth/login.ts`
 * combined with D-028 rejects every attempt. That is the credentials-absent path
 * the standing contract requires, and it is deliberately **not** a "dev bypass".
 *
 * The attempt flag and its reason live on the shared store, so the seed happens once per
 * process even though this module is instantiated once per route handler.
 */
function ensureDevAdminSeeded(): void {
  const state = devStore();
  if (state.adminSeedAttempted) return;
  state.adminSeedAttempted = true;

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (!email || !passwordHash) {
    state.adminSeedReason = "not-configured";
    logServerEvent({
      scope: "auth",
      event: "dev_admin_seed_skipped",
      level: process.env.NODE_ENV === "production" ? "error" : "warn",
      data: {
        adapter: "dev",
        reason: "ADMIN_EMAIL and ADMIN_PASSWORD_HASH are not both set",
        consequence:
          "no admin exists, so every login attempt is rejected (decisions.md D-028 fail closed)",
      },
    });
    return;
  }

  if (!looksLikePasswordHash(passwordHash)) {
    // A hash the verifier cannot parse would turn every login into a 500. Refusing
    // the seed keeps the failure where it belongs: in configuration, loudly.
    state.adminSeedReason = "invalid-hash";
    logServerEvent({
      scope: "auth",
      event: "dev_admin_seed_rejected",
      level: "error",
      data: {
        adapter: "dev",
        reason:
          "ADMIN_PASSWORD_HASH is not a recognised argon2id hash (expected a $argon2id$ value; generate one with `node scripts/hash-admin-password.mjs`)",
        consequence: "no admin exists, so every login attempt is rejected",
      },
    });
    return;
  }

  const record: AdminUser = {
    id: randomUUID(),
    email,
    passwordHash,
    createdAt: nowIso(),
  };
  state.adminsByEmail.set(email, record);
  state.adminSeedReason = "seeded";
  logServerEvent({
    scope: "auth",
    event: "dev_admin_seeded",
    level: "warn",
    data: { adapter: "dev", admins: 1, source: "ADMIN_EMAIL + ADMIN_PASSWORD_HASH" },
  });
}

/**
 * A cheap shape check, not a verification: it only rejects a value that cannot
 * possibly be a hash (for example a plaintext password pasted into the wrong
 * variable). The real check is the argon2 verify itself.
 *
 * argon2id only. `decisions.md` D-026 authorises a `bcryptjs` fallback **if the
 * `@node-rs/argon2` install fails**; it installed and loads on this platform, so
 * the fallback was not taken and the hash format is `$argon2id$…`. Accepting a
 * `$2b$` value here would admit a hash nothing can verify. See
 * `lib/auth/password.ts`.
 */
function looksLikePasswordHash(value: string): boolean {
  return value.startsWith("$argon2id$") || value.startsWith("$argon2i$") || value.startsWith("$argon2d$");
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

    /* ---- Phase 06 additions ---------------------------------------------- */

    async listProjects(query?: ListProjectsQuery) {
      const filtered =
        query?.published === undefined
          ? [...projects.values()]
          : [...projects.values()].filter((record) => record.published === query.published);
      return toAdminPage(filtered, query?.limit, query?.cursor, cloneProject);
    },

    async upsertProject(input: UpsertProjectInput) {
      const record: Project = {
        id: input.id ?? randomUUID(),
        title: input.title,
        slug: input.slug,
        serviceTag: input.serviceTag,
        location: input.location,
        images: [...input.images],
        summary: input.summary,
        published: input.published,
      };
      projects.set(record.id, record);
      return cloneProject(record);
    },

    async listTestimonials(query?: ListTestimonialsQuery) {
      const filtered =
        query?.published === undefined
          ? [...testimonials.values()]
          : [...testimonials.values()].filter((record) => record.published === query.published);
      return toAdminPage(filtered, query?.limit, query?.cursor, (record) => ({ ...record }));
    },

    async upsertTestimonial(input: UpsertTestimonialInput) {
      const record: Testimonial = {
        id: input.id ?? randomUUID(),
        name: input.name,
        quote: input.quote,
        projectRef: input.projectRef,
        published: input.published,
      };
      testimonials.set(record.id, record);
      return { ...record };
    },

    async getPageContent(pageKey: string) {
      const record = [...pageContents.values()].find((entry) => entry.pageKey === pageKey);
      return record ? clonePageContent(record) : null;
    },

    async upsertPageContent(input: UpsertPageContentInput) {
      const existing = [...pageContents.values()].find((entry) => entry.pageKey === input.pageKey);
      const record: PageContent = {
        id: existing?.id ?? randomUUID(),
        pageKey: input.pageKey,
        sections: input.sections.map((section) => ({ ...section })),
        updatedAt: nowIso(),
      };
      pageContents.set(record.id, record);
      return clonePageContent(record);
    },

    async getSettings() {
      const [record] = settings.values();
      return record ? cloneSettings(record) : null;
    },

    async upsertSettings(input: UpsertSettingsInput) {
      const [existing] = settings.values();
      const record: Setting = {
        id: existing?.id ?? randomUUID(),
        contact: { ...input.contact },
        serviceAreas: {
          states: input.serviceAreas.states ? [...input.serviceAreas.states] : null,
          note: input.serviceAreas.note,
        },
        seoDefaults: { ...input.seoDefaults },
        updatedAt: nowIso(),
      };
      settings.clear();
      settings.set(record.id, record);
      return cloneSettings(record);
    },

    async appendAuditLog(input: AppendAuditLogInput) {
      const record: AuditLog = {
        id: randomUUID(),
        adminId: input.adminId,
        actorEmail: input.actorEmail,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        ipHash: input.ipHash,
        userAgent: input.userAgent,
        metadata: input.metadata ? { ...input.metadata } : null,
        createdAt: nowIso(),
      };
      auditLogs.set(record.id, record);
      return cloneAuditLog(record);
    },

    async listAuditLog(query?: ListAuditLogQuery) {
      const filtered = [...auditLogs.values()].filter(
        (record) =>
          (query?.action === undefined || record.action === query.action) &&
          (query?.resourceType === undefined || record.resourceType === query.resourceType),
      );
      return toAdminPage(filtered, query?.limit, query?.cursor, cloneAuditLog);
    },

    async findAdminByEmail(email: string) {
      ensureDevAdminSeeded();
      const record = adminsByEmail.get(email.trim().toLowerCase());
      return record ? { ...record } : null;
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
 * Test/lifecycle helper for the Phase 06 stores **and** the seeded admin. The
 * admin seed is part of the reset because a harness that seeds two different
 * admins between cases must not inherit the previous one — that is exactly the
 * condition under which a privilege-separation test would give a false pass.
 *
 * Not part of the port and never called by application code.
 */
export function resetDevAdminStore(): void {
  const state = devStore();
  state.projects.clear();
  state.testimonials.clear();
  state.pageContents.clear();
  state.settings.clear();
  state.auditLogs.clear();
  state.adminsByEmail.clear();
  state.adminSeedAttempted = false;
  state.adminSeedReason = null;
  logServerEvent({
    scope: "data",
    event: "dev_admin_store_reset",
    level: "debug",
    data: { adapter: "dev" },
  });
}

/**
 * Seeds an admin directly, bypassing the environment. Used by the verification
 * harness to create the two accounts a privilege-separation test needs. Not part
 * of the port; not reachable from a request path.
 */
export function seedDevAdmin(input: { email: string; passwordHash: string }): AdminUser {
  const record: AdminUser = {
    id: randomUUID(),
    email: input.email.trim().toLowerCase(),
    passwordHash: input.passwordHash,
    createdAt: nowIso(),
  };
  devStore().adminsByEmail.set(record.email, record);
  return { ...record };
}

/** Why the last seed attempt produced an admin, or did not. Diagnostics only. */
export function devAdminSeedReason(): "seeded" | "not-configured" | "invalid-hash" | "not-attempted" {
  return devStore().adminSeedReason ?? "not-attempted";
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
