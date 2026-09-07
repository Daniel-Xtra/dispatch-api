import { NotificationChannel } from './notification-channel';
import { NotificationStatus } from './notification-status';

/**
 * Core notification shape shared by the API, workers, and persistence.
 *
 * Phase 3 maps this onto a TypeORM entity; it is declared here first so domain
 * logic never depends on the persistence layer.
 */
export interface Notification {
  readonly id: string;
  readonly tenantId: string;
  readonly channel: NotificationChannel;
  readonly recipient: string;
  readonly status: NotificationStatus;

  /** Template key resolved at accept time, plus the version pinned to it. */
  readonly templateKey: string | null;
  readonly templateVersionId: string | null;
  readonly variables: Readonly<Record<string, unknown>>;

  /** Client-supplied idempotency key, scoped per tenant. */
  readonly idempotencyKey: string | null;
  /** Traces the notification from API request through to provider response. */
  readonly correlationId: string;

  /** Provider adapter used by the most recent attempt, if any. */
  readonly providerUsed: string | null;
  readonly attemptCount: number;
  readonly nextAttemptAt: Date | null;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}
