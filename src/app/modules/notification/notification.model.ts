import { model, Schema } from 'mongoose';
import { INotification } from './notification.interface';

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

export const Notification = model<INotification>('Notification', notificationSchema);
