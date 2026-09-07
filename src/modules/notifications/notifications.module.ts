import { Module } from '@nestjs/common';
import { NotificationStateMachine } from './domain/notification-state-machine';

/**
 * Notification accept API, domain lifecycle, attempts (Phases 5+).
 */
@Module({
  providers: [NotificationStateMachine],
  exports: [NotificationStateMachine],
})
export class NotificationsModule {}
