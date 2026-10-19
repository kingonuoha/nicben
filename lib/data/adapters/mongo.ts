/**
 * MongoDB adapter — `decisions.md` **D-019** (MongoDB Atlas free tier, official
 * `mongodb` driver, reached only through the port).
 *
 * Three properties matter here:
 *
 * 1. **Lazy connection, reused across invocations.** The driver is imported and
 *    the client is created on first use, not at module evaluation, and the
 *    connection promise is cached in module scope. `decisions.md` D-019 and the
 *    phase brief both require this: a serverless invocation that opens a new
 *    connection per request exhausts an M0 cluster's connection budget. Module
 *    scope survives between invocations of a warm instance, so warm requests
 *    reuse the pool.
 *
 * 2. **Indexes created once.** `createdAt` and `status` are declared indexes
 *    because the admin list is `sort(createdAt: -1)` optionally filtered by
 *    `status` (`decisions.md` D-021 surfaces notification failures in that
 *    list). The Phase 06 collections declare the indexes their portal queries
 *    need: `auditLogs.createdAt`, `projects.published`, `testimonials.published`
 *    and a **unique** `adminUsers.email`. Creation is guarded by a cached promise
 *    per collection so a burst of first requests does not run `createIndex`
 *    repeatedly.
 *
 * 3. **No `_id` leakage.** `_id` is an `ObjectId` and never crosses the port.
 *    Records leave this module with `id: string` and no `_id` key, which keeps
 *    the stored shape identical to the dev adapter's.
 *
 * 4. **Cursor pagination is `_id`-based for the Phase 06 lists.** The admin
 *    collections have no timestamp in the spec's model (`06` §20/§22), and
 *    `_id` is monotonic with insertion, so `_id` descending gives newest-first
 *    ordering with no cursor lookup round trip and no risk of skipping a record
 *    that shares a millisecond with its neighbour. `listEnquiries` keeps its
 *    `createdAt` cursor: `06` §19 does model `createdAt`, and changing it would
 *    be a Phase 05 behaviour change.
 */

import { ObjectId, type Collection, type Db, type MongoClient } from "mongodb";

import { logServerEvent } from "../../log/server-log";
import type {
  AdminUser,
  AuditLog,
  Enquiry,
  EnquiryNotification,
  PageContent,
  Project,
  Setting,
  Testimonial,
} from "../types";
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

export const ENQUIRY_COLLECTION = "enquiries";
export const PROJECT_COLLECTION = "projects";
export const TESTIMONIAL_COLLECTION = "testimonials";
export const PAGE_CONTENT_COLLECTION = "pageContents";
export const SETTINGS_COLLECTION = "settings";
export const AUDIT_LOG_COLLECTION = "auditLogs";
export const ADMIN_USER_COLLECTION = "adminUsers";

const DEFAULT_DB_NAME = "nicben";
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

/** Stored document shape: the domain record plus Mongo's `_id`. */
type EnquiryDocument = Omit<Enquiry, "id"> & { _id: ObjectId };
type ProjectDocument = Omit<Project, "id"> & { _id: ObjectId };
type TestimonialDocument = Omit<Testimonial, "id"> & { _id: ObjectId };
type PageContentDocument = Omit<PageContent, "id"> & { _id: ObjectId };
type SettingDocument = Omit<Setting, "id"> & { _id: ObjectId };
type AuditLogDocument = Omit<AuditLog, "id"> & { _id: ObjectId };
type AdminUserDocument = Omit<AdminUser, "id"> & { _id: ObjectId };

let clientPromise: Promise<MongoClient> | null = null;
const indexPromises = new Map<string, Promise<void>>();

function readConnectionString(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    // Reaching this function with no URI means the adapter was selected
    // incorrectly — `lib/data/index.ts` is the only selector.
    throw new Error("MONGODB_URI is not set");
  }
  return uri;
}

async function getDb(): Promise<Db> {
  if (!clientPromise) {
    // Dynamic import keeps the driver out of any module graph that never
    // selects this adapter, which is what lets the credentials-absent build
    // stay green (D-019).
    const { MongoClient: MongoClientCtor } = await import("mongodb");
    const client = new MongoClientCtor(readConnectionString(), {
      // Bounded so a network fault surfaces as a logged failure rather than a
      // request that hangs until the platform timeout.
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    clientPromise = client.connect().catch((error: unknown) => {
      // Reset so the next request can retry instead of being permanently stuck
      // on a rejected promise.
      clientPromise = null;
      throw error;
    });
  }
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB?.trim() || DEFAULT_DB_NAME;
  return client.db(dbName);
}

async function getCollection(): Promise<Collection<EnquiryDocument>> {
  const db = await getDb();
  const collection = db.collection<EnquiryDocument>(ENQUIRY_COLLECTION);
  await ensureIndexes(ENQUIRY_COLLECTION, async () => {
    await collection.createIndex({ createdAt: -1 }, { name: "createdAt_desc" });
    await collection.createIndex({ status: 1, createdAt: -1 }, { name: "status_createdAt" });
    return ["createdAt_desc", "status_createdAt"];
  });
  return collection;
}

/**
 * Runs a collection's index declarations at most once per process.
 *
 * A rejected creation clears its own entry so the next request retries, instead of
 * leaving the collection permanently unusable behind a rejected promise.
 */
async function ensureIndexes(
  collectionName: string,
  create: () => Promise<string[]>,
): Promise<void> {
  let pending = indexPromises.get(collectionName);
  if (!pending) {
    pending = (async () => {
      const names = await create();
      logServerEvent({
        scope: "data",
        event: "mongo_indexes_ready",
        level: "debug",
        data: { collection: collectionName, indexes: names },
      });
    })().catch((error: unknown) => {
      indexPromises.delete(collectionName);
      throw error;
    });
    indexPromises.set(collectionName, pending);
  }
  await pending;
}

async function collectionFor<T extends { _id: ObjectId }>(
  name: string,
  create: () => Promise<string[]>,
): Promise<Collection<T>> {
  const db = await getDb();
  const collection = db.collection<T>(name);
  await ensureIndexes(name, create);
  return collection;
}

async function getProjectsCollection(): Promise<Collection<ProjectDocument>> {
  return collectionFor<ProjectDocument>(PROJECT_COLLECTION, async () => {
    const db = await getDb();
    const collection = db.collection<ProjectDocument>(PROJECT_COLLECTION);
    // `06` §20 `published` is the flag the public frontend filters on, so it is
    // indexed for the read path as well as the admin list.
    await collection.createIndex({ published: 1 }, { name: "published_asc" });
    return ["published_asc"];
  });
}

async function getTestimonialsCollection(): Promise<Collection<TestimonialDocument>> {
  return collectionFor<TestimonialDocument>(TESTIMONIAL_COLLECTION, async () => {
    const db = await getDb();
    const collection = db.collection<TestimonialDocument>(TESTIMONIAL_COLLECTION);
    await collection.createIndex({ published: 1 }, { name: "published_asc" });
    return ["published_asc"];
  });
}

async function getPageContentCollection(): Promise<Collection<PageContentDocument>> {
  return collectionFor<PageContentDocument>(PAGE_CONTENT_COLLECTION, async () => {
    const db = await getDb();
    const collection = db.collection<PageContentDocument>(PAGE_CONTENT_COLLECTION);
    // `pageKey` is the natural key — `getPageContent` looks a page up by it and
    // `upsertPageContent` replaces by it. Unique so a race cannot produce two
    // rows for one page and make the read path arbitrary.
    await collection.createIndex({ pageKey: 1 }, { name: "pageKey_unique", unique: true });
    return ["pageKey_unique"];
  });
}

async function getSettingsCollection(): Promise<Collection<SettingDocument>> {
  return collectionFor<SettingDocument>(SETTINGS_COLLECTION, async () => {
    // A single document by design (`06` §23 is one settings object); no index is
    // needed because the read is `findOne({})` on a collection of size 0 or 1.
    return [];
  });
}

async function getAuditLogCollection(): Promise<Collection<AuditLogDocument>> {
  return collectionFor<AuditLogDocument>(AUDIT_LOG_COLLECTION, async () => {
    const db = await getDb();
    const collection = db.collection<AuditLogDocument>(AUDIT_LOG_COLLECTION);
    await collection.createIndex({ createdAt: -1 }, { name: "createdAt_desc" });
    await collection.createIndex(
      { action: 1, resourceType: 1, _id: -1 },
      { name: "action_resourceType_id" },
    );
    return ["createdAt_desc", "action_resourceType_id"];
  });
}

async function getAdminUserCollection(): Promise<Collection<AdminUserDocument>> {
  return collectionFor<AdminUserDocument>(ADMIN_USER_COLLECTION, async () => {
    const db = await getDb();
    const collection = db.collection<AdminUserDocument>(ADMIN_USER_COLLECTION);
    // Unique: the login pipeline resolves an account by email, so two rows for
    // one address would make "which password is checked" arbitrary.
    await collection.createIndex({ email: 1 }, { name: "email_unique", unique: true });
    return ["email_unique"];
  });
}

function toDomain(document: EnquiryDocument): Enquiry {
  const { _id, ...rest } = document;
  return { id: _id.toHexString(), ...rest };
}

/** Generic `_id` → `id` projection shared by every Phase 06 collection. */
function toDomainRecord<T extends { _id: ObjectId }, R>(document: T): R {
  const { _id, ...rest } = document;
  return { id: _id.toHexString(), ...rest } as unknown as R;
}

/**
 * Cursor filter for the newest-first, `_id`-based Phase 06 lists. Returns `{}` for
 * the first page, and an impossible-but-well-formed filter for a cursor that is
 * not a valid id, so a malformed cursor yields an empty page rather than the
 * first page repeated.
 */
function afterCursorFilter(cursor: string | null | undefined): Record<string, unknown> {
  if (!cursor) return {};
  const objectId = toObjectId(cursor);
  return objectId ? { _id: { $lt: objectId } } : { _id: { $lt: new ObjectId("ffffffffffffffffffffffff") } };
}

function clampLimit(value: number | undefined): number {
  const requested = value ?? DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(requested) || DEFAULT_LIMIT, 1), MAX_LIMIT);
}

function toObjectId(id: string): ObjectId | null {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

export function createMongoEnquiryRepository(): EnquiryRepository {
  return {
    kind: "mongo",

    async createEnquiry(input) {
      const collection = await getCollection();
      const timestamp = new Date().toISOString();
      const document: Omit<EnquiryDocument, "_id"> = {
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
        notification: { configured: false, attemptedAt: null, delivered: false, error: null },
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const result = await collection.insertOne(document as EnquiryDocument);
      return toDomain({ _id: result.insertedId, ...document });
    },

    async listEnquiries(query?: ListEnquiriesQuery): Promise<EnquiryPage> {
      const collection = await getCollection();
      const limit = clampLimit(query?.limit);
      const filter = query?.status ? { status: query.status } : {};

      const total = await collection.countDocuments(filter);

      // Cursor is the id of the last record on the previous page; skip it so a
      // new record inserted between pages cannot be returned twice.
      let after: Date | null = null;
      if (query?.cursor) {
        const cursorId = toObjectId(query.cursor);
        if (cursorId) {
          const cursorDocument = await collection.findOne(
            { _id: cursorId },
            { projection: { createdAt: 1 } },
          );
          after = cursorDocument ? new Date(cursorDocument.createdAt) : null;
        }
      }

      const pageFilter = after ? { ...filter, createdAt: { $lt: after.toISOString() } } : filter;

      const documents = await collection
        .find(pageFilter)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .toArray();

      const hasMore = documents.length > limit;
      const page = documents.slice(0, limit).map(toDomain);

      return {
        items: page,
        total,
        nextCursor: hasMore && page.length > 0 ? page[page.length - 1].id : null,
      };
    },

    async getEnquiry(id: string) {
      const objectId = toObjectId(id);
      if (!objectId) return null;
      const collection = await getCollection();
      const document = await collection.findOne({ _id: objectId });
      return document ? toDomain(document) : null;
    },

    async updateEnquiryStatus(id: string, input: UpdateEnquiryStatusInput) {
      const objectId = toObjectId(id);
      if (!objectId) return null;
      const collection = await getCollection();
      const timestamp = new Date().toISOString();
      const note = input.note
        ? {
            id: new ObjectId().toHexString(),
            body: input.note,
            authorId: input.actorId ?? null,
            createdAt: timestamp,
          }
        : null;
      const update: Record<string, unknown> = {
        $set: { status: input.status, updatedAt: timestamp },
      };
      if (note) update.$push = { notes: note };
      const result = await collection.findOneAndUpdate({ _id: objectId }, update, {
        returnDocument: "after",
      });
      return result ? toDomain(result) : null;
    },

    async addEnquiryNote(id: string, input: AddEnquiryNoteInput) {
      const objectId = toObjectId(id);
      if (!objectId) return null;
      const collection = await getCollection();
      const timestamp = new Date().toISOString();
      const result = await collection.findOneAndUpdate(
        { _id: objectId },
        {
          $push: {
            notes: {
              id: new ObjectId().toHexString(),
              body: input.body,
              authorId: input.authorId,
              createdAt: timestamp,
            },
          },
          $set: { updatedAt: timestamp },
        },
        { returnDocument: "after" },
      );
      return result ? toDomain(result) : null;
    },

    async setEnquiryNotification(id: string, notification: EnquiryNotification) {
      const objectId = toObjectId(id);
      if (!objectId) return null;
      const collection = await getCollection();
      const result = await collection.findOneAndUpdate(
        { _id: objectId },
        { $set: { notification: { ...notification }, updatedAt: new Date().toISOString() } },
        { returnDocument: "after" },
      );
      return result ? toDomain(result) : null;
    },

    /* ---- Phase 06 additions ---------------------------------------------- */

    async listProjects(query?: ListProjectsQuery): Promise<AdminListPage<Project>> {
      const collection = await getProjectsCollection();
      const limit = clampLimit(query?.limit);
      const filter =
        query?.published === undefined
          ? afterCursorFilter(query?.cursor)
          : { published: query.published, ...afterCursorFilter(query?.cursor) };
      const countFilter = query?.published === undefined ? {} : { published: query.published };

      const total = await collection.countDocuments(countFilter);
      const documents = await collection
        .find(filter)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .toArray();

      const hasMore = documents.length > limit;
      const items = documents
        .slice(0, limit)
        .map((document) => toDomainRecord<ProjectDocument, Project>(document));

      return { items, total, nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null };
    },

    async upsertProject(input: UpsertProjectInput): Promise<Project> {
      const collection = await getProjectsCollection();
      const document: Omit<ProjectDocument, "_id"> = {
        title: input.title,
        slug: input.slug,
        serviceTag: input.serviceTag,
        location: input.location,
        images: [...input.images],
        summary: input.summary,
        published: input.published,
      };

      const existing = input.id ? toObjectId(input.id) : null;
      if (existing) {
        const updated = await collection.findOneAndUpdate(
          { _id: existing },
          { $set: document },
          { returnDocument: "after" },
        );
        if (updated) return toDomainRecord<ProjectDocument, Project>(updated);
      }

      // No id, or an id that matched nothing: insert. A replaced-by-id upsert that
      // silently did nothing would be a lost edit, which the audit entry would
      // then record as a success.
      const result = await collection.insertOne(document as ProjectDocument);
      return toDomainRecord<ProjectDocument, Project>({ _id: result.insertedId, ...document } as ProjectDocument);
    },

    async listTestimonials(query?: ListTestimonialsQuery): Promise<AdminListPage<Testimonial>> {
      const collection = await getTestimonialsCollection();
      const limit = clampLimit(query?.limit);
      const filter =
        query?.published === undefined
          ? afterCursorFilter(query?.cursor)
          : { published: query.published, ...afterCursorFilter(query?.cursor) };
      const countFilter = query?.published === undefined ? {} : { published: query.published };

      const total = await collection.countDocuments(countFilter);
      const documents = await collection
        .find(filter)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .toArray();

      const hasMore = documents.length > limit;
      const items = documents
        .slice(0, limit)
        .map((document) => toDomainRecord<TestimonialDocument, Testimonial>(document));

      return { items, total, nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null };
    },

    async upsertTestimonial(input: UpsertTestimonialInput): Promise<Testimonial> {
      const collection = await getTestimonialsCollection();
      const document: Omit<TestimonialDocument, "_id"> = {
        name: input.name,
        quote: input.quote,
        projectRef: input.projectRef,
        published: input.published,
      };

      const existing = input.id ? toObjectId(input.id) : null;
      if (existing) {
        const updated = await collection.findOneAndUpdate(
          { _id: existing },
          { $set: document },
          { returnDocument: "after" },
        );
        if (updated) return toDomainRecord<TestimonialDocument, Testimonial>(updated);
      }

      const result = await collection.insertOne(document as TestimonialDocument);
      return toDomainRecord<TestimonialDocument, Testimonial>({
        _id: result.insertedId,
        ...document,
      } as TestimonialDocument);
    },

    async getPageContent(pageKey: string) {
      const collection = await getPageContentCollection();
      const document = await collection.findOne({ pageKey });
      return document ? toDomainRecord<PageContentDocument, PageContent>(document) : null;
    },

    async upsertPageContent(input: UpsertPageContentInput): Promise<PageContent> {
      const collection = await getPageContentCollection();
      const sections = input.sections.map((section) => ({ ...section }));
      const update = { $set: { pageKey: input.pageKey, sections, updatedAt: new Date().toISOString() } };
      const document = await collection.findOneAndUpdate({ pageKey: input.pageKey }, update, {
        upsert: true,
        returnDocument: "after",
      });
      // `upsert: true` with `returnDocument: "after"` always yields a document.
      return toDomainRecord<PageContentDocument, PageContent>(document as PageContentDocument);
    },

    async getSettings() {
      const collection = await getSettingsCollection();
      const document = await collection.findOne({});
      return document ? toDomainRecord<SettingDocument, Setting>(document) : null;
    },

    async upsertSettings(input: UpsertSettingsInput): Promise<Setting> {
      const collection = await getSettingsCollection();
      const existing = await collection.findOne({}, { projection: { _id: 1 } });
      const document: Omit<SettingDocument, "_id"> = {
        contact: { ...input.contact },
        serviceAreas: {
          states: input.serviceAreas.states ? [...input.serviceAreas.states] : null,
          note: input.serviceAreas.note,
        },
        seoDefaults: { ...input.seoDefaults },
        updatedAt: new Date().toISOString(),
      };

      if (existing) {
        const updated = await collection.findOneAndUpdate(
          { _id: existing._id },
          { $set: document },
          { returnDocument: "after" },
        );
        if (updated) return toDomainRecord<SettingDocument, Setting>(updated);
      }

      const result = await collection.insertOne(document as SettingDocument);
      return toDomainRecord<SettingDocument, Setting>({
        _id: result.insertedId,
        ...document,
      } as SettingDocument);
    },

    async appendAuditLog(input: AppendAuditLogInput): Promise<AuditLog> {
      const collection = await getAuditLogCollection();
      const document: Omit<AuditLogDocument, "_id"> = {
        adminId: input.adminId,
        actorEmail: input.actorEmail,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        ipHash: input.ipHash,
        userAgent: input.userAgent,
        metadata: input.metadata ? { ...input.metadata } : null,
        createdAt: new Date().toISOString(),
      };
      const result = await collection.insertOne(document as AuditLogDocument);
      return toDomainRecord<AuditLogDocument, AuditLog>({
        _id: result.insertedId,
        ...document,
      } as AuditLogDocument);
    },

    async listAuditLog(query?: ListAuditLogQuery): Promise<AdminListPage<AuditLog>> {
      const collection = await getAuditLogCollection();
      const limit = clampLimit(query?.limit);
      const countFilter: Record<string, unknown> = {};
      if (query?.action !== undefined) countFilter.action = query.action;
      if (query?.resourceType !== undefined) countFilter.resourceType = query.resourceType;

      const total = await collection.countDocuments(countFilter);
      const documents = await collection
        .find({ ...countFilter, ...afterCursorFilter(query?.cursor) })
        .sort({ _id: -1 })
        .limit(limit + 1)
        .toArray();

      const hasMore = documents.length > limit;
      const items = documents
        .slice(0, limit)
        .map((document) => toDomainRecord<AuditLogDocument, AuditLog>(document));

      return { items, total, nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null };
    },

    async findAdminByEmail(email: string) {
      const collection = await getAdminUserCollection();
      const document = await collection.findOne({ email: email.trim().toLowerCase() });
      return document ? toDomainRecord<AdminUserDocument, AdminUser>(document) : null;
    },
  };
}

/** Closes the pooled client. Used by tests and by a graceful shutdown. */
export async function closeMongoConnection(): Promise<void> {
  const pending = clientPromise;
  clientPromise = null;
  indexPromises.clear();
  if (!pending) return;
  try {
    const client = await pending;
    await client.close();
  } catch {
    // A close failure on a connection that already errored is not actionable.
  }
}
