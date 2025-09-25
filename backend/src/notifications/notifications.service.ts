import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WebsocketsService } from '../websockets/websockets.service';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
  imageUrl?: string;
}

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'ride' | 'payment' | 'system' | 'emergency' | 'promotion';
  data?: any;
  priority?: 'low' | 'normal' | 'high';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private websocketsService: WebsocketsService,
  ) {}

  /**
   * Send notification to user
   */
  async sendNotification(payload: NotificationPayload): Promise<any> {
    try {
      // Create notification record
      const savedNotification = await this.prisma.notification.create({
        data: {
          userId: payload.userId,
          title: payload.title,
          message: payload.message,
          type: payload.type as any,
          data: payload.data,
          isRead: false,
        },
      });

      // Send real-time notification via WebSocket
      await this.websocketsService.sendNotification({
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: 'info',
        data: payload.data,
      });

      // Send push notification (if user has device token)
      await this.sendPushNotification(payload.userId, {
        title: payload.title,
        body: payload.message,
        data: payload.data,
      });

      this.logger.log(`Notification sent to user ${payload.userId}`);
      return savedNotification;
    } catch (error) {
      this.logger.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(userId: string, notification: PushNotificationData) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.deviceToken) {
        this.logger.debug(`No device token for user ${userId}`);
        return;
      }

      // Here you would integrate with Firebase Cloud Messaging
      // For now, we'll just log the notification
      this.logger.log(`Push notification to ${user.deviceToken}: ${notification.title}`);
      
      // TODO: Implement Firebase Cloud Messaging
      // await this.firebaseService.sendNotification(user.deviceToken, notification);
    } catch (error) {
      this.logger.error('Error sending push notification:', error);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Find notifications by user ID
   */
  async findByUserId(userId: string): Promise<any[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<any> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Send ride-related notifications
   */
  async sendRideNotification(
    userId: string,
    type: 'requested' | 'accepted' | 'arrived' | 'started' | 'completed' | 'cancelled',
    rideData: any
  ) {
    const notifications = {
      requested: {
        title: 'Ride Requested',
        message: 'Your ride request has been sent to nearby drivers',
      },
      accepted: {
        title: 'Ride Accepted',
        message: `Driver ${rideData.driverName} is on the way. ETA: ${rideData.eta} minutes`,
      },
      arrived: {
        title: 'Driver Arrived',
        message: `Your driver ${rideData.driverName} has arrived at the pickup location`,
      },
      started: {
        title: 'Ride Started',
        message: 'Your ride has started. Enjoy your trip!',
      },
      completed: {
        title: 'Ride Completed',
        message: `Your ride has been completed. Total fare: ${rideData.fare} KES`,
      },
      cancelled: {
        title: 'Ride Cancelled',
        message: 'Your ride has been cancelled',
      },
    };

    const notification = notifications[type];
    if (notification) {
      await this.sendNotification({
        userId,
        title: notification.title,
        message: notification.message,
        type: 'ride',
        data: rideData,
        priority: type === 'cancelled' ? 'high' : 'normal',
      });
    }
  }

  /**
   * Send payment notifications
   */
  async sendPaymentNotification(
    userId: string,
    type: 'success' | 'failed' | 'refund',
    paymentData: any
  ) {
    const notifications = {
      success: {
        title: 'Payment Successful',
        message: `Payment of ${paymentData.amount} ${paymentData.currency} completed successfully`,
      },
      failed: {
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please try again',
      },
      refund: {
        title: 'Refund Processed',
        message: `Refund of ${paymentData.amount} ${paymentData.currency} has been processed`,
      },
    };

    const notification = notifications[type];
    if (notification) {
      await this.sendNotification({
        userId,
        title: notification.title,
        message: notification.message,
        type: 'payment',
        data: paymentData,
        priority: type === 'failed' ? 'high' : 'normal',
      });
    }
  }

  /**
   * Send system notifications
   */
  async sendSystemNotification(
    userId: string,
    title: string,
    message: string,
    data?: any
  ) {
    await this.sendNotification({
      userId,
      title,
      message,
      type: 'system',
      data,
      priority: 'normal',
    });
  }

  /**
   * Send emergency notifications
   */
  async sendEmergencyNotification(
    userId: string,
    message: string,
    location: { lat: number; lng: number },
    rideId?: string
  ) {
    await this.sendNotification({
      userId,
      title: 'Emergency Alert',
      message,
      type: 'emergency',
      data: { location, rideId },
      priority: 'high',
    });
  }

  /**
   * Send promotion notifications
   */
  async sendPromotionNotification(
    userId: string,
    title: string,
    message: string,
    promotionData: any
  ) {
    await this.sendNotification({
      userId,
      title,
      message,
      type: 'promotion',
      data: promotionData,
      priority: 'low',
    });
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationPayload['type'] = 'system',
    data?: any
  ) {
    const promises = userIds.map(userId =>
      this.sendNotification({
        userId,
        title,
        message,
        type,
        data,
      })
    );

    await Promise.all(promises);
    this.logger.log(`Bulk notifications sent to ${userIds.length} users`);
  }

  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Cleaned up notifications older than ${daysToKeep} days`);
  }
}