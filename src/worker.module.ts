import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RabbitMqModule } from './infrastructure/rabbitmq/rabbitmq.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { ProviderAdaptersModule } from './infrastructure/provider-adapters/provider-adapters.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { WorkerBootstrapService } from './worker/worker-bootstrap.service';

/**
 * Delivery worker process module.
 * No HTTP server. Consumes RabbitMQ in later phases.
 */
@Module({
  imports: [
    AppConfigModule,
    CommonModule,
    DatabaseModule,
    RedisModule,
    RabbitMqModule,
    ProviderAdaptersModule,
    NotificationsModule,
    TemplatesModule,
    ProvidersModule,
    OutboxModule,
  ],
  providers: [WorkerBootstrapService],
})
export class WorkerModule {}
