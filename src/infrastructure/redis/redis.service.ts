import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Phase 1 stub: Redis client arrives with rate limiting.
 */
@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const host = this.config.get<string>('redis.host');
    const port = this.config.get<number>('redis.port');
    this.logger.log(`Redis module ready (not connected yet): ${host}:${port}`);
  }
}
