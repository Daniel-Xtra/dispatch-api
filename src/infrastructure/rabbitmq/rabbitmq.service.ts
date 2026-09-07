import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Phase 1 stub: RabbitMQ client/topology arrive in Phases 6–7.
 */
@Injectable()
export class RabbitMqService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMqService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('rabbitmq.url');
    this.logger.log(
      `RabbitMQ module ready (not connected yet): ${this.redactUrl(url)}`,
    );
  }

  private redactUrl(url: string | undefined): string {
    if (!url) {
      return '(unset)';
    }
    try {
      const parsed = new URL(url);
      if (parsed.password) {
        parsed.password = '***';
      }
      return parsed.toString();
    } catch {
      return '(invalid-url)';
    }
  }
}
