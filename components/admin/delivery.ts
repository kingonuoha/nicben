import type { EnquiryNotification } from "@/lib/data/types";

/**
 * The notification state of a stored enquiry.
 *
 * `decisions.md` **D-021**: "persist first, then send. A send failure sets a
 * notification-error flag on the stored enquiry **and is surfaced in the admin
 * view**, but the user still sees the success card." The last clause is why this
 * exists as a first-class state rather than a log line: the sender was told their
 * enquiry arrived, so the operator has to be the one who notices that the mail did
 * not go out.
 *
 * Four states, all derivable from `EnquiryNotification` — nothing is inferred and
 * nothing is invented:
 *
 * | State            | Condition                          | Meaning                                              |
 * |------------------|------------------------------------|------------------------------------------------------|
 * | `not-configured` | `configured === false`             | no mail credentials at submission time (`06` §37)    |
 * | `not-attempted`  | `attemptedAt === null`             | a send was expected but never ran                    |
 * | `delivered`      | `delivered === true`               | the provider accepted it                             |
 * | `failed`         | otherwise                          | the provider refused or the request faulted          |
 *
 * `error` is a short non-personal reference set by the pipeline (`resend:401`,
 * `timeout`, `not-configured`) and is shown verbatim; the portal never renders a
 * provider response body or a stack trace (`06` §43).
 */

export type DeliveryState = "delivered" | "failed" | "not-attempted" | "not-configured";

export function deliveryState(notification: EnquiryNotification): DeliveryState {
  if (!notification.configured) return "not-configured";
  if (notification.attemptedAt === null) return "not-attempted";
  return notification.delivered ? "delivered" : "failed";
}

export function deliveryLabel(state: DeliveryState): string {
  switch (state) {
    case "delivered":
      return "Delivered";
    case "failed":
      return "Delivery failed";
    case "not-attempted":
      return "Not attempted";
    case "not-configured":
      return "Notifications not configured";
    default:
      return "Unknown";
  }
}

/**
 * The same state, short enough for a table cell.
 *
 * The table has seven columns and the actions column is the one an operator needs
 * without scrolling, so the chip carries the short form and the full sentence is on
 * the element's `title` and in the detail overlay. It is abbreviated, never softened:
 * "Not sent" says exactly what happened.
 */
export function deliveryShortLabel(state: DeliveryState): string {
  switch (state) {
    case "delivered":
      return "Delivered";
    case "failed":
      return "Failed";
    case "not-attempted":
      return "Not sent";
    case "not-configured":
      return "Not sent";
    default:
      return "Unknown";
  }
}

/**
 * True when the state needs the operator's attention: a send that was attempted
 * and failed. `not-configured` is deliberately **not** included — it is a
 * deployment state, reported once on the dashboard, not a per-enquiry incident
 * (otherwise a deployment without mail credentials would raise an alarm on every
 * row, which is how a real alarm gets ignored).
 */
export function deliveryNeedsAttention(state: DeliveryState): boolean {
  return state === "failed";
}
