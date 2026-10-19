/**
 * `GET /api/admin/settings` — the single settings document. Session-guarded.
 * `PUT` · `PATCH /api/admin/settings` — replace it. Session-guarded, CSRF-protected, audited.
 *
 * `06` §23: "contact info, service areas, SEO defaults". One document, so one route.
 *
 * `GET` returns `settings: null` before the first save. Every contact field is nullable in
 * the model because the public email, phone and state list are `[CLIENT TO CONFIRM]` and
 * `decisions.md` D-012 forbids substituting a plausible value — the portal must therefore
 * be able to represent "not confirmed yet", and this route must be able to report it.
 */

import type { NextRequest } from "next/server";

import { recordAuditEvent } from "@/lib/audit/log";
import { adminApiRoute, jsonOk, validateBody } from "@/lib/admin/api";
import { settingsUpsertSchema } from "@/lib/validation/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  return adminApiRoute(
    request,
    async (api) => {
      const settings = await api.repository.getSettings();
      return jsonOk({ settings, adapter: api.repository.kind });
    },
    { csrf: false, body: false },
  );
}

async function save(request: NextRequest): Promise<Response> {
  return adminApiRoute(request, async (api) => {
    const validated = validateBody(settingsUpsertSchema, api.body);
    if (!validated.ok) return validated.response;

    const settings = await api.repository.upsertSettings({
      contact: validated.data.contact,
      serviceAreas: validated.data.serviceAreas,
      seoDefaults: validated.data.seoDefaults,
    });

    await recordAuditEvent({
      adminId: api.session.adminId,
      actorEmail: api.session.email,
      action: "settings-upsert",
      resourceType: "settings",
      resourceId: settings.id,
      clientAddress: api.clientAddress,
      userAgent: api.userAgent,
      metadata: {
        // Booleans, never the values. A phone number and an email are personal data, and
        // the audit detail payload carries references only (`lib/audit/log.ts`).
        contactAddressSet: settings.contact.address !== null,
        contactEmailSet: settings.contact.email !== null,
        contactPhoneSet: settings.contact.phone !== null,
        serviceStates: settings.serviceAreas.states ? settings.serviceAreas.states.length : null,
        seoTitleTemplateSet: settings.seoDefaults.titleTemplate !== null,
        seoDescriptionSet: settings.seoDefaults.description !== null,
      },
    });

    return jsonOk(settings);
  });
}

export const PUT = save;
export const PATCH = save;

/** A settings document is not deletable: an empty one is expressible, and deleting it would only mean "unset". */
export async function DELETE(request: NextRequest): Promise<Response> {
  return adminApiRoute(
    request,
    () =>
      Response.json(
        { ok: false, error: "forbidden", message: "Settings are not deletable." },
        { status: 405, headers: { allow: "GET, PUT, PATCH", "cache-control": "no-store, private" } },
      ),
    { csrf: false, body: false },
  );
}
