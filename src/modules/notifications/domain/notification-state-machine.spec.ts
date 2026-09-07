import { InvalidStateTransitionError } from '../../../common/errors/domain.error';
import {
  ALL_FAILURE_CLASSES,
  FailureClass,
  RETRYABLE_FAILURE_CLASSES,
} from '../../../contracts/domain/failure';
import {
  ALL_NOTIFICATION_STATUSES,
  ALLOWED_TRANSITIONS,
  NotificationStatus,
  TERMINAL_STATUSES,
} from '../../../contracts/domain/notification-status';
import { NotificationStateMachine } from './notification-state-machine';

describe('NotificationStateMachine', () => {
  let machine: NotificationStateMachine;

  beforeEach(() => {
    machine = new NotificationStateMachine();
  });

  // Cases are generated from the transition table rather than hand-listed, so
  // adding a status without updating the table surfaces here immediately.
  const legalPairs = ALL_NOTIFICATION_STATUSES.flatMap((from) =>
    ALLOWED_TRANSITIONS[from].map((to) => [from, to] as const),
  );

  const illegalPairs = ALL_NOTIFICATION_STATUSES.flatMap((from) =>
    ALL_NOTIFICATION_STATUSES.filter(
      (to) => !ALLOWED_TRANSITIONS[from].includes(to),
    ).map((to) => [from, to] as const),
  );

  describe('legal transitions', () => {
    it.each(legalPairs)('allows %s -> %s', (from, to) => {
      expect(machine.canTransition(from, to)).toBe(true);
      expect(() => machine.assertTransition(from, to)).not.toThrow();
    });

    it('covers the documented lifecycle path end to end', () => {
      const happyPath = [
        NotificationStatus.Accepted,
        NotificationStatus.Queued,
        NotificationStatus.Processing,
        NotificationStatus.Sending,
        NotificationStatus.Sent,
      ];

      for (let i = 0; i < happyPath.length - 1; i++) {
        expect(machine.canTransition(happyPath[i], happyPath[i + 1])).toBe(
          true,
        );
      }
    });

    it('allows a failed notification to be retried', () => {
      expect(
        machine.canTransition(
          NotificationStatus.Failed,
          NotificationStatus.Processing,
        ),
      ).toBe(true);
    });
  });

  describe('illegal transitions', () => {
    it.each(illegalPairs)('rejects %s -> %s', (from, to) => {
      expect(machine.canTransition(from, to)).toBe(false);
      expect(() => machine.assertTransition(from, to)).toThrow(
        InvalidStateTransitionError,
      );
    });

    it('reports the offending statuses on the error', () => {
      let caught: InvalidStateTransitionError | undefined;

      try {
        machine.assertTransition(
          NotificationStatus.Accepted,
          NotificationStatus.Sent,
        );
      } catch (error) {
        caught = error as InvalidStateTransitionError;
      }

      expect(caught).toBeInstanceOf(InvalidStateTransitionError);
      expect(caught?.code).toBe('INVALID_STATE_TRANSITION');
      expect(caught?.from).toBe(NotificationStatus.Accepted);
      expect(caught?.to).toBe(NotificationStatus.Sent);
    });

    it('rejects skipping the queue', () => {
      expect(
        machine.canTransition(
          NotificationStatus.Accepted,
          NotificationStatus.Processing,
        ),
      ).toBe(false);
    });

    it('rejects resurrecting a delivered notification', () => {
      expect(
        machine.canTransition(
          NotificationStatus.Sent,
          NotificationStatus.Processing,
        ),
      ).toBe(false);
    });

    it('rejects dead lettering straight from sending', () => {
      // A permanent failure still passes through `failed` first.
      expect(
        machine.canTransition(
          NotificationStatus.Sending,
          NotificationStatus.DeadLettered,
        ),
      ).toBe(false);
    });
  });

  describe('terminal statuses', () => {
    it.each(TERMINAL_STATUSES)('treats %s as terminal', (status) => {
      expect(machine.isTerminal(status)).toBe(true);
    });

    it.each(TERMINAL_STATUSES)('allows no transition out of %s', (status) => {
      for (const to of ALL_NOTIFICATION_STATUSES) {
        expect(machine.canTransition(status, to)).toBe(false);
      }
    });

    it.each(
      ALL_NOTIFICATION_STATUSES.filter(
        (status) => !TERMINAL_STATUSES.includes(status),
      ),
    )('treats %s as non-terminal', (status) => {
      expect(machine.isTerminal(status)).toBe(false);
    });
  });

  describe('failure handling', () => {
    it('always lands on failed after an attempt fails', () => {
      expect(machine.statusAfterFailedAttempt()).toBe(
        NotificationStatus.Failed,
      );
    });

    it('produces a status reachable from sending', () => {
      expect(
        machine.canTransition(
          NotificationStatus.Sending,
          machine.statusAfterFailedAttempt(),
        ),
      ).toBe(true);
    });

    it.each(RETRYABLE_FAILURE_CLASSES)(
      'keeps retrying %s while attempts remain',
      (failureClass) => {
        expect(machine.shouldDeadLetter(failureClass)).toBe(false);
      },
    );

    it.each(
      ALL_FAILURE_CLASSES.filter(
        (failureClass) => !RETRYABLE_FAILURE_CLASSES.includes(failureClass),
      ),
    )('dead letters %s immediately', (failureClass) => {
      expect(machine.shouldDeadLetter(failureClass)).toBe(true);
    });

    it('dead letters a retryable failure once attempts are exhausted', () => {
      expect(machine.shouldDeadLetter(FailureClass.Transient, true)).toBe(true);
    });

    it('completes the two-step permanent failure path', () => {
      const afterAttempt = machine.statusAfterFailedAttempt();

      expect(
        machine.canTransition(NotificationStatus.Sending, afterAttempt),
      ).toBe(true);
      expect(machine.shouldDeadLetter(FailureClass.PermanentClient)).toBe(true);
      expect(
        machine.canTransition(afterAttempt, NotificationStatus.DeadLettered),
      ).toBe(true);
    });
  });
});
