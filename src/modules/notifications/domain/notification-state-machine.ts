import { Injectable } from '@nestjs/common';
import { InvalidStateTransitionError } from '../../../common/errors/domain.error';
import {
  FailureClass,
  RETRYABLE_FAILURE_CLASSES,
} from '../../../contracts/domain/failure';
import {
  ALLOWED_TRANSITIONS,
  NotificationStatus,
  TERMINAL_STATUSES,
} from '../../../contracts/domain/notification-status';

/**
 * Guards every notification status change.
 *
 * Persistence and queue code must route status updates through here so an
 * illegal transition fails loudly instead of corrupting delivery state.
 */
@Injectable()
export class NotificationStateMachine {
  canTransition(from: NotificationStatus, to: NotificationStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  }

  /** Throws {@link InvalidStateTransitionError} if the transition is illegal. */
  assertTransition(from: NotificationStatus, to: NotificationStatus): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidStateTransitionError(from, to);
    }
  }

  isTerminal(status: NotificationStatus): boolean {
    return TERMINAL_STATUSES.includes(status);
  }

  /**
   * Status a notification takes immediately after an attempt fails.
   *
   * Always `Failed`, never `DeadLettered`: the lifecycle has no edge from
   * `Sending` straight to `DeadLettered`. Dead lettering is a second step taken
   * from `Failed`, gated by {@link shouldDeadLetter}.
   */
  statusAfterFailedAttempt(): NotificationStatus {
    return NotificationStatus.Failed;
  }

  /**
   * Whether a failed notification should stop retrying and be dead lettered.
   *
   * `attemptsExhausted` lets the caller end retries for an otherwise retryable
   * failure once the retry budget is spent.
   */
  shouldDeadLetter(
    failureClass: FailureClass,
    attemptsExhausted = false,
  ): boolean {
    const retryable = RETRYABLE_FAILURE_CLASSES.includes(failureClass);

    return !retryable || attemptsExhausted;
  }
}
