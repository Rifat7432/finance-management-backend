import { model, Schema } from 'mongoose';
import { INotification } from './notification.interface';
import { socketIo } from '../../../helpers/socketHelper';
import { logger } from '../../../shared/logger';
import colors from 'colors';
enum NotificationType {
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
  PAYMENT = 'PAYMENT',
  ALERT = 'ALERT',
  ORDER = 'APPOINTMENT',
  CANCELLED = 'CANCELLED',
}

const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: false,
      default: 'Notification',
    },
    message: {
      type: String,
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ receiver: 1, read: 1 });

notificationSchema.post('save', async function (doc) {
  try {
    if (!socketIo) {
      logger.warn(colors.yellow('Socket.IO is not initialized'));
      return;
    }

    const notification = doc.toObject();

    // If type is ADMIN or SYSTEM → broadcast to all connected users
    if (notification.type === NotificationType.ADMIN || notification.type === NotificationType.SYSTEM) {
      logger.info(colors.blue('Broadcasting notification to all users'));
      socketIo.emit('notification', notification);
    } else {
      // Otherwise send only to the receiver
      const receiverId = notification.receiver.toString();
      logger.info(colors.green(`Sending notification to user ${receiverId}`));
      socketIo.to(receiverId).emit('notification', notification);
    }
  } catch (error) {
    logger.error(colors.red('Failed to send socket notification'), error);
  }
});

export const Notification = model<INotification>('Notification', notificationSchema);


