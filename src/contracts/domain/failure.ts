/**
 * Failure taxonomy driving retry policy.
 *
 * Source of truth: docs/failure-modes.md
 */
export enum FailureClass {
  /** 429, 500, 502, 503, connection reset. Retry with backoff. */
  Transient = 'transient',
  /**
   * Timeout or reset after the request was written. The provider may have
   * accepted the message, so this is not a confirmed failure.
   */
  Ambiguous = 'ambiguous',
  /** Invalid recipient, template render failure. Not retryable. */
  PermanentClient = 'permanent_client',
  /** Provider 401/403. Not retryable until configuration is fixed. */
  ConfigAuth = 'config_auth',
  /** Unexpected invariant violation on our side. Must not retry forever. */
  Platform = 'platform',
}

export const ALL_FAILURE_CLASSES: readonly FailureClass[] =
  Object.values(FailureClass);

/**
 * Whether another delivery attempt is permitted for this failure class.
 *
 * `Ambiguous` is retryable but callers must bound attempts and prefer a
 * provider-side idempotency key, since the message may already have been sent.
 */
export const RETRYABLE_FAILURE_CLASSES: readonly FailureClass[] = [
  FailureClass.Transient,
  FailureClass.Ambiguous,
];
