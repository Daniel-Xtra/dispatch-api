/**
 * Broker payload for a delivery request.
 *
 * Carries identifiers only. Workers hydrate the notification from PostgreSQL so
 * a queued message can never go stale relative to templates or corrected data.
 *
 * See docs/adr/0010-message-ids-only.md
 */
export interface DispatchMessage {
  readonly notificationId: string;
  readonly tenantId: string;
  readonly correlationId: string;
  /** 1-based attempt number this message represents. */
  readonly attempt: number;
}
