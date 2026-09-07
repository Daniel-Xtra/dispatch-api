import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RabbitMqModule } from './infrastructure/rabbitmq/rabbitmq.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { ProviderAdaptersModule } from './infrastructure/provider-adapters/provider-adapters.module';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { RateLimitsModule } from './modules/rate-limits/rate-limits.module';

/**
 * HTTP API process module.
 * Boots feature modules needed for accept/query paths.
 * Outbox relay will run here initially (Phase 6).
 */
@Module({
  imports: [
    AppConfigModule,
    CommonModule,
    DatabaseModule,
    RedisModule,
    RabbitMqModule,
    ProviderAdaptersModule,
    HealthModule,
    IdentityModule,
    NotificationsModule,
    TemplatesModule,
    ProvidersModule,
    OutboxModule,
    RateLimitsModule,
  ],
})
export class ApiModule {}
