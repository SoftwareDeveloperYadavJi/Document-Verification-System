import { prisma } from '@repo/db/client';
import { logger } from './logger';



interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: string;
}

/**
 * Send a notification to a user
 * @param data Notification data
 */
export const sendNotification = async (data: NotificationData): Promise<void> => {
  try {
    const { userId, title, message, type } = data;

    // Create notification in database
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type
      }
    });

    // In a real-world application, you might also:
    // 1. Send an email notification
    // 2. Send a push notification
    // 3. Send a WebSocket message for real-time updates

    logger.info(`Notification sent: ${title}`, {
      userId,
      type
    });
  } catch (error) {
    logger.error('Error sending notification:', error);
    // Don't throw error, just log it
  }
};

/**
 * Mark a notification as read
 * @param notificationId ID of the notification to mark as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
};

/**
 * Get user notifications with pagination
 * @param userId User ID
 * @param page Page number
 * @param limit Items per page
 * @param unreadOnly Only get unread notifications
 */
export const getUserNotifications = async (
  userId: string,
  page = 1,
  limit = 20,
  unreadOnly = false
) => {
  try {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where })
    ]);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error retrieving notifications:', error);
    throw new Error('Failed to retrieve notifications');
  }
};