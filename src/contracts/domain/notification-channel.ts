/**
 * Delivery channels. Only `Email` is implemented in the MVP; the others are
 * declared so queue topology and provider selection stay stable as they land.
 */
export enum NotificationChannel {
  Email = 'email',
  Sms = 'sms',
  Push = 'push',
}

export const ALL_NOTIFICATION_CHANNELS: readonly NotificationChannel[] =
  Object.values(NotificationChannel);
