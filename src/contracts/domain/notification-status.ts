/**
 * Notification lifecycle statuses.
 *
 * Source of truth: docs/notification-lifecycle.md
 */
export enum NotificationStatus {
  /** Persisted in the accept transaction; not yet confirmed in RabbitMQ. */
  Accepted = 'accepted',
  /** Outbox relay published to the broker (publisher confirm succeeded). */
  Queued = 'queued',
  /** A worker claimed the notification row. */
  Processing = 'processing',
  /** Provider call in flight for the current attempt. */
  Sending = 'sending',
  /** Provider accepted the message. Terminal success. */
  Sent = 'sent',
  /** Last attempt failed; may retry if policy allows. */
  Failed = 'failed',
  /** Permanent failure or max attempts exhausted. Terminal failure. */
  DeadLettered = 'dead_lettered',
}

/**
 * The only transitions the domain permits. Anything else is a bug and must throw.
 *
 * There is deliberately no `retrying` status: a retry re-enters `Processing`
 * from `Failed`, with `nextAttemptAt` carrying the scheduling intent.
 */
export const ALLOWED_TRANSITIONS: Readonly<
  Record<NotificationStatus, readonly NotificationStatus[]>
> = {
  [NotificationStatus.Accepted]: [NotificationStatus.Queued],
  [NotificationStatus.Queued]: [NotificationStatus.Processing],
  [NotificationStatus.Processing]: [NotificationStatus.Sending],
  [NotificationStatus.Sending]: [
    NotificationStatus.Sent,
    NotificationStatus.Failed,
  ],
  [NotificationStatus.Failed]: [
    NotificationStatus.Processing,
    NotificationStatus.DeadLettered,
  ],
  [NotificationStatus.Sent]: [],
  [NotificationStatus.DeadLettered]: [],
};

export const TERMINAL_STATUSES: readonly NotificationStatus[] = [
  NotificationStatus.Sent,
  NotificationStatus.DeadLettered,
];

export const ALL_NOTIFICATION_STATUSES: readonly NotificationStatus[] =
  Object.values(NotificationStatus);
