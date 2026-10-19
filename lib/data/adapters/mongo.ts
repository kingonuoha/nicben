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
 *    list). Creation is guarded by a cached promise so a burst of first
 *    requests does not run `createIndex` repeatedly.
 *
 * 3. **No `_id` leakage.** `_id` is an `ObjectId` and never crosses the port.
 *    Records leave this module with `id: string` and no `_id` key, which keeps
 *    the stored shape identical to the dev adapter's.
 */

import { ObjectId, type Collection, type Db, type MongoClient } from "mongodb";

import { logServerEvent } from "../../log/server-log";
import type { Enquiry, EnquiryNotification } from "../types";
import type {
  AddEnquiryNoteInput,
  EnquiryPage,
  EnquiryRepository,
  ListEnquiriesQuery,
  UpdateEnquiryStatusInput,
} from "../repository";

export const ENQUIRY_COLLECTION = "enquiries";
const DEFAULT_DB_NAME = "nicben";
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

/** Stored document shape: the domain record plus Mongo's `_id`. */
type EnquiryDocument = Omit<Enquiry, "id"> & { _id: ObjectId };

let clientPromise: Promise<MongoClient> | null = null;
let indexPromise: Promise<void> | null = null;

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
  if (!indexPromise) {
    indexPromise = (async () => {
      await collection.createIndex({ createdAt: -1 }, { name: "createdAt_desc" });
      await collection.createIndex({ status: 1, createdAt: -1 }, { name: "status_createdAt" });
      logServerEvent({
        scope: "data",
        event: "mongo_indexes_ready",
        level: "debug",
        data: { collection: ENQUIRY_COLLECTION, indexes: ["createdAt_desc", "status_createdAt"] },
      });
    })().catch((error: unknown) => {
      indexPromise = null;
      throw error;
    });
  }
  await indexPromise;
  return collection;
}

function toDomain(document: EnquiryDocument): Enquiry {
  const { _id, ...rest } = document;
  return { id: _id.toHexString(), ...rest };
}

function toObjectId(id: string): ObjectId | null {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

function clampLimit(value: number | undefined): number {
  const requested = value ?? DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(requested) || DEFAULT_LIMIT, 1), MAX_LIMIT);
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
  };
}

/** Closes the pooled client. Used by tests and by a graceful shutdown. */
export async function closeMongoConnection(): Promise<void> {
  const pending = clientPromise;
  clientPromise = null;
  indexPromise = null;
  if (!pending) return;
  try {
    const client = await pending;
    await client.close();
  } catch {
    // A close failure on a connection that already errored is not actionable.
  }
}
