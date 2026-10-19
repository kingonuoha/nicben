/**
 * The **repository port**.
 *
 * `decisions.md` **D-019** makes this file the only way the application touches
 * a database: "Once `MONGODB_URI` is absent the app selects a **dev adapter**
 * implementing the same port … **Nothing in the app may import a database client
 * directly; all access goes through the port.**"
 *
 * So this file contains types and an interface, and no implementation, no
 * driver import and no environment access. `lib/data/index.ts` chooses an
 * adapter; `lib/data/adapters/*` implement it.
 *
 * The write surface is deliberately small — the phase brief fixes it to
 * `createEnquiry`, `listEnquiries`, `getEnquiry`, `updateEnquiryStatus` and
 * `addEnquiryNote`. One method is added on top, `setEnquiryNotification`,
 * because `decisions.md` D-021 requires the notification outcome to be recorded
 * on the stored enquiry after the send attempt, and no other port method can
 * express that without inventing a fake status or a fake note.
 */

import type {
  Enquiry,
  EnquiryNotification,
  EnquiryStatus,
  NewEnquiry,
} from "./types";

export interface ListEnquiriesQuery {
  /** Restrict to one status. Omitted means "every status". */
  status?: EnquiryStatus;
  /** Page size. Adapters clamp this; the default is 25. */
  limit?: number;
  /** Opaque cursor returned by the previous page, or a record id to resume after. */
  cursor?: string | null;
}

export interface EnquiryPage {
  items: Enquiry[];
  /** Total matching records, for the admin list header. */
  total: number;
  /** `null` when the page is the last one. */
  nextCursor: string | null;
}

export interface UpdateEnquiryStatusInput {
  status: EnquiryStatus;
  /**
   * Optional admin note recorded as part of the status change (`06` §60 —
   * status changes are logged with who/what/when).
   */
  note?: string;
  /** `AdminUser.id` of the actor, or `null` for a system change. */
  actorId?: string | null;
}

export interface AddEnquiryNoteInput {
  /** Sanitised note body. */
  body: string;
  /** `AdminUser.id` of the author, or `null` for a system note. */
  authorId: string | null;
}

/**
 * The port. `lib/data/index.ts` returns an implementation of this interface and
 * nothing above the repository layer may depend on which one it is.
 */
export interface EnquiryRepository {
  /** Insert a new enquiry and return the stored record with its generated `id`. */
  createEnquiry(input: NewEnquiry): Promise<Enquiry>;

  /** Admin list, newest first. */
  listEnquiries(query?: ListEnquiriesQuery): Promise<EnquiryPage>;

  /** `null` when no record carries that id. */
  getEnquiry(id: string): Promise<Enquiry | null>;

  /** Returns the updated record, or `null` when the id is unknown. */
  updateEnquiryStatus(id: string, input: UpdateEnquiryStatusInput): Promise<Enquiry | null>;

  /** Returns the updated record, or `null` when the id is unknown. */
  addEnquiryNote(id: string, input: AddEnquiryNoteInput): Promise<Enquiry | null>;

  /**
   * Record the outcome of the notification attempt (`decisions.md` D-021).
   * Returns the updated record, or `null` when the id is unknown.
   */
  setEnquiryNotification(id: string, notification: EnquiryNotification): Promise<Enquiry | null>;

  /** Human-readable adapter name for logs and health checks. Never survives a response. */
  readonly kind: "dev" | "mongo";
}
