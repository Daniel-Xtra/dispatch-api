import { NotificationStatus } from '../../contracts/domain/notification-status';

/**
 * Base class for violations of domain rules.
 *
 * Deliberately framework-free: workers raise these outside any HTTP context.
 * Mapping to the public error envelope happens at the API boundary.
 */
export abstract class DomainError extends Error {
  /** Stable machine-readable code surfaced in the API error envelope. */
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }
}

/**
 * Raised when code attempts a status change the lifecycle forbids.
 *
 * This signals a bug rather than an expected runtime condition, so it is never
 * swallowed as a normal delivery failure.
 */
export class InvalidStateTransitionError extends DomainError {
  readonly code = 'INVALID_STATE_TRANSITION';

  constructor(
    readonly from: NotificationStatus,
    readonly to: NotificationStatus,
  ) {
    super(`Cannot transition notification from "${from}" to "${to}"`);
  }
}
