import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Phase 1 placeholder so the worker process has an observable boot signal.
 * Real consumers arrive in Phase 8.
 */
@Injectable()
export class WorkerBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(WorkerBootstrapService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const service = this.config.get<string>('app.serviceName');
    this.logger.log(`${service} worker process booted (no consumers yet)`);
  }
}
