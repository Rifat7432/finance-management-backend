// import * as admin from 'firebase-admin';
// import { logger } from '../shared/logger';
// import serviceAccount from '/finance-management-backend-mongoose/finace-management-72997-firebase-adminsdk-fbsvc-4bf112f98e.json';

// // Cast serviceAccount to ServiceAccount type
// const serviceAccountKey: admin.ServiceAccount = serviceAccount as admin.ServiceAccount;

// // Initialize Firebase SDK
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccountKey),
// });

// // -------------------- Firebase Helper --------------------

// // Send notification to multiple devices
// const sendPushNotifications = async (tokens: string[], payload: { title: string; body: string }, data: Record<string, string> = {}) => {
//   if (!tokens || tokens.length === 0) return;

//   const message: admin.messaging.MulticastMessage = {
//     notification: payload,
//     data,
//     tokens,
//   };

//   try {
//     const response = await admin.messaging().sendEachForMulticast(message);
//     logger.info('Notifications sent successfully', {
//       successCount: response.successCount,
//       failureCount: response.failureCount,
//     });

//     // Remove invalid tokens from DB
//     const invalidTokens: string[] = [];
//     response.responses.forEach((resp, idx) => {
//       if (!resp.success) {
//         const errorCode = resp.error?.code;
//         if (
//           errorCode === 'messaging/registration-token-not-registered' ||
//           errorCode === 'messaging/invalid-argument'
//         ) {
//           invalidTokens.push(tokens[idx]);
//         }
//       }
//     });

//     if (invalidTokens.length > 0) {
//       logger.info('Removing invalid tokens', invalidTokens);
//       // TODO: remove these tokens from your database
//     }
//   } catch (err) {
//     logger.error('Error sending push notifications', err);
//   }
// };

// // Send notification to a single device
// const sendPushNotification = async (token: string, payload: { title: string; body: string }, data: Record<string, string> = {}) => {
//   const message: admin.messaging.Message = {
//     notification: payload,
//     data,
//     token,
//   };

//   try {
//     const response = await admin.messaging().send(message);
//     logger.info('Notification sent successfully', response);
//   } catch (err) {
//     logger.error('Error sending push notification', err);
//   }
// };

// export const firebaseHelper = {
//   sendPushNotifications,
//   sendPushNotification,
// };

// // -------------------- Usage Example --------------------

// // Example: sending notification to all devices of multiple users
// const users = [
//   { deviceToken: 'token1' },
//   { deviceToken: 'token2' },
//   { deviceToken: null }, // will be filtered
// ];

// const payload = {
//   title: 'New Offer!',
//   body: 'A new offer is available for you',
// };

// // Extract valid device tokens
// const tokens = users
//   .map(user => user.deviceToken)
//   .filter((token): token is string => !!token);

// // Send notifications
// firebaseHelper.sendPushNotifications(tokens, payload);

// // -------------------- Notes --------------------
// // 1. Make sure `deviceToken` is saved in your user model on login.
// // 2. Call `sendPushNotifications()` whenever you want to notify multiple users.
// // 3. Invalid tokens (uninstalled apps) are detected and should be removed from DB.
