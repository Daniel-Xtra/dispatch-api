import { FailureClass } from './failure';

/**
 * A rendered email ready to hand to a provider. Template resolution has already
 * happened; providers never see raw templates or variables.
 */
export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text?: string;
  readonly from?: string;
  readonly replyTo?: string;
  /**
   * Passed to providers that support request-level deduplication so a retry
   * after an ambiguous timeout does not send twice.
   */
  readonly idempotencyKey?: string;
}

export interface ProviderSuccess {
  readonly outcome: 'sent';
  /** Provider-side identifier used to correlate later delivery webhooks. */
  readonly providerMessageId: string;
  readonly raw?: unknown;
}

export interface ProviderFailure {
  readonly outcome: 'failed';
  readonly failureClass: FailureClass;
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly raw?: unknown;
}

/**
 * Adapters return a result rather than throwing for expected provider errors,
 * so the caller must handle both outcomes explicitly.
 */
export type ProviderResult = ProviderSuccess | ProviderFailure;

/**
 * Port implemented by every email adapter (Resend, SES, SendGrid).
 *
 * Domain and application code depends on this interface only. Vendor SDKs stay
 * inside `infrastructure/provider-adapters`.
 */
export interface EmailProvider {
  /** Stable adapter identifier recorded on each delivery attempt. */
  readonly name: string;

  send(message: EmailMessage): Promise<ProviderResult>;
}

/** Injection token, since interfaces do not exist at runtime. */
export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
