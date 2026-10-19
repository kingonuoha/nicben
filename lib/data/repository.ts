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
 * The write surface is deliberately small — the phase 05 brief fixed it to
 * `createEnquiry`, `listEnquiries`, `getEnquiry`, `updateEnquiryStatus` and
 * `addEnquiryNote`. One method was added on top, `setEnquiryNotification`,
 * because `decisions.md` D-021 requires the notification outcome to be recorded
 * on the stored enquiry after the send attempt, and no other port method can
 * express that without inventing a fake status or a fake note.
 *
 * Phase 06 (the admin portal) extends the same port — never a second one — with
 * exactly the methods `docs/tasks/phase-06-hidden-admin-portal/backend-task.md`
 * names. Nothing beyond that list is added: a method the brief does not ask for
 * would be an unowned surface with no screen to exercise it.
 */

import type {
  AdminUser,
  AuditAction,
  AuditLog,
  AuditResourceType,
  Enquiry,
  EnquiryNotification,
  EnquiryStatus,
  NewEnquiry,
  PageContent,
  PageContentSection,
  Project,
  Setting,
  Testimonial,
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

/* -------------------------------------------------------------------------- */
/* Phase 06 — admin portal collections                                         */
/* -------------------------------------------------------------------------- */

/**
 * Cursor pagination for the three admin lists that are not enquiries.
 *
 * The cursor is the **id of the last record on the previous page** and the order
 * is newest-first in both adapters, so a record inserted between two page
 * requests cannot be returned twice and cannot shift a later record off the
 * page. `total` is the count matching the filter, for the list header.
 */
export interface AdminListPage<T> {
  items: T[];
  total: number;
  /** `null` when the page is the last one. */
  nextCursor: string | null;
}

export interface ListProjectsQuery {
  /** `true` → only published, `false` → only drafts, omitted → both. */
  published?: boolean;
  /** Page size. Adapters clamp this; the default is 25. */
  limit?: number;
  cursor?: string | null;
}

export interface ListTestimonialsQuery {
  published?: boolean;
  limit?: number;
  cursor?: string | null;
}

export interface ListAuditLogQuery {
  action?: AuditAction;
  resourceType?: AuditResourceType;
  limit?: number;
  cursor?: string | null;
}

/**
 * Upsert, not create/update pairs: the admin screens are forms that either save a
 * new record or save an edited one, and two methods would duplicate the
 * validation and the audit entry at every call site. `id: null` means "create".
 */
export interface UpsertProjectInput {
  id: string | null;
  title: string;
  slug: string;
  serviceTag: string;
  location: string;
  images: string[];
  summary: string;
  published: boolean;
}

export interface UpsertTestimonialInput {
  id: string | null;
  name: string;
  quote: string;
  projectRef: string | null;
  published: boolean;
}

export interface UpsertPageContentInput {
  /** Route key, e.g. `"what-we-do"`. Natural key — there is no `id` parameter. */
  pageKey: string;
  sections: PageContentSection[];
}

export interface UpsertSettingsInput {
  contact: Setting["contact"];
  serviceAreas: Setting["serviceAreas"];
  seoDefaults: Setting["seoDefaults"];
}

export interface AppendAuditLogInput {
  /** `AdminUser.id` of the actor, or `null` for a system action. Taken from the session, never from a request body. */
  adminId: string | null;
  actorEmail: string | null;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string | null;
  ipHash: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
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

  /* ---- Phase 06 additions ------------------------------------------------- */

  /** Admin list, newest first. `published` is applied as a filter, never as a default. */
  listProjects(query?: ListProjectsQuery): Promise<AdminListPage<Project>>;

  /** Insert (`id: null`) or replace. Returns the stored record. */
  upsertProject(input: UpsertProjectInput): Promise<Project>;

  /** Admin list, newest first. */
  listTestimonials(query?: ListTestimonialsQuery): Promise<AdminListPage<Testimonial>>;

  /** Insert (`id: null`) or replace. Returns the stored record. */
  upsertTestimonial(input: UpsertTestimonialInput): Promise<Testimonial>;

  /**
   * `null` when that page has no content row yet. Returning `null` rather than a
   * synthesised empty document keeps "not yet entered" distinguishable from
   * "entered and empty", which matters because `decisions.md` D-012 forbids
   * substituting a value for a `[CLIENT TO CONFIRM]` detail.
   */
  getPageContent(pageKey: string): Promise<PageContent | null>;

  /** Insert or replace the whole section list for `pageKey`. Returns the stored record. */
  upsertPageContent(input: UpsertPageContentInput): Promise<PageContent>;

  /** The single settings document, or `null` before it has ever been saved. */
  getSettings(): Promise<Setting | null>;

  /** Insert or replace the single settings document. Returns the stored record. */
  upsertSettings(input: UpsertSettingsInput): Promise<Setting>;

  /** Append one audit entry. Append-only: nothing in the port can modify or delete one. */
  appendAuditLog(input: AppendAuditLogInput): Promise<AuditLog>;

  /** Admin audit view, newest first. */
  listAuditLog(query?: ListAuditLogQuery): Promise<AdminListPage<AuditLog>>;

  /**
   * The credential lookup used by the login pipeline. Returns the stored password
   * hash, so the caller must never log or return the result (`lib/auth/password.ts`
   * consumes it and discards it). `null` when no such account exists — the login
   * pipeline must treat that identically to a wrong password
   * (`lib/auth/login.ts`).
   */
  findAdminByEmail(email: string): Promise<AdminUser | null>;

  /** Human-readable adapter name for logs and health checks. Never survives a response. */
  readonly kind: "dev" | "mongo";
}

