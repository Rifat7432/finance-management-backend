import cron from 'node-cron';
import { Types } from 'mongoose';
import { Debt } from '../modules/debt/debt.model';
import { NotificationSettings } from '../modules/notificationSettings/notificationSettings.model';
import { Notification } from '../modules/notification/notification.model';
import { firebaseHelper } from '../../helpers/firebaseHelper';

/**
 * Convert a date + time + timezone to UTC Date
 * Defaults to UK time if no timezone provided
 */
function getDebtUTC(date: string | Date, time: string, timeZone?: string): Date {
    const tz = timeZone || 'Europe/London';
    const [hour, minute] = time.split(':').map(Number);
    const localDate = new Date(date);
    localDate.setHours(hour, minute, 0, 0);

    const localString = localDate.toLocaleString('en-GB', { timeZone: tz });
    return new Date(localString);
}

/**
 * Helper: Sends Firebase + DB notification safely
 */
async function sendDebtNotification({
    userSetting,
    userId,
    debt,
}: {
    userSetting: any;
    userId: Types.ObjectId;
    debt: any;
}) {
    const title = 'Debt Payment Reminder';
    const message = `Your debt "${debt.name}" of amount ${debt.amount} is due on ${new Date(
        debt.payDueDate
    ).toDateString()} at 08:00.`; // default time

    if (userSetting.deviceTokenList?.length > 0) {
        await firebaseHelper.sendNotification(
            [{ id: String(userId), deviceToken: userSetting.deviceTokenList[0] }],
            { title, body: message },
            userSetting.deviceTokenList,
            'multiple',
            { debtId: String(debt._id) }
        );
    }

    await Notification.create({
        title,
        message,
        receiver: userId,
        type: 'ALERT',
        read: false,
        meta: { debtId: debt._id },
    });

    console.log(`✅ Debt reminder sent for debt: ${debt._id}`);
}

/**
 * Process debt reminders
 */
async function processDebtReminders() {
    const now = new Date();
    const debts = await Debt.find({ isDeleted: false }).lean();

    for (const debt of debts) {
        const userSetting: any = await NotificationSettings.findOne({ userId: debt.userId }).lean();
        if (!userSetting || !userSetting.debtNotification) continue;

        const timeZone = userSetting.timeZone || 'Europe/London';
        const debtUTC = getDebtUTC(debt.payDueDate, '08:00', timeZone); // default 08:00

        const diffMs = debtUTC.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // Send reminder ~24 hours before
        if (diffHours >= 23.9 && diffHours <= 24.1) {
            // prevent duplicates
            const exists = await Notification.findOne({
                'meta.debtId': debt._id,
                receiver: debt.userId,
            });
            if (exists) continue;

            await sendDebtNotification({ userSetting, userId: debt.userId, debt });
        }
    }
}

/**
 * Start debt reminder scheduler
 */

    // Run every minute to catch exact 24-hour window
    cron.schedule('* * * * *', async () => {
        try {
            await processDebtReminders();
        } catch (err) {
            console.error('❌ Debt Reminder Scheduler error:', err);
        }
    });

    console.log('🕒 Debt Reminder Scheduler started (24h before, respects timezone)');

