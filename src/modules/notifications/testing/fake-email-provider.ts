import { FailureClass } from '../../../contracts/domain/failure';
import {
  EmailMessage,
  EmailProvider,
  ProviderResult,
} from '../../../contracts/domain/provider.port';

/**
 * In-memory {@link EmailProvider} for tests.
 *
 * Domain tests exercise the port, never a vendor SDK or an HTTP mock. Queue a
 * result with {@link FakeEmailProvider.enqueueResult} to drive failure paths.
 */
export class FakeEmailProvider implements EmailProvider {
  readonly name = 'fake';

  readonly sent: EmailMessage[] = [];

  private readonly queuedResults: ProviderResult[] = [];

  /** Results are returned in FIFO order, one per `send` call. */
  enqueueResult(result: ProviderResult): void {
    this.queuedResults.push(result);
  }

  enqueueFailure(failureClass: FailureClass, errorCode = 'FAKE_FAILURE'): void {
    this.queuedResults.push({
      outcome: 'failed',
      failureClass,
      errorCode,
      errorMessage: `Simulated ${failureClass} failure`,
    });
  }

  send(message: EmailMessage): Promise<ProviderResult> {
    this.sent.push(message);

    const queued = this.queuedResults.shift();
    if (queued) {
      return Promise.resolve(queued);
    }

    return Promise.resolve({
      outcome: 'sent',
      providerMessageId: `fake-${this.sent.length}`,
    });
  }

  reset(): void {
    this.sent.length = 0;
    this.queuedResults.length = 0;
  }
}
