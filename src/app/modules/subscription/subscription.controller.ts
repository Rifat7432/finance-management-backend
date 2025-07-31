import catchAsync from '../../../shared/catchAsync';
import { SubscriptionService } from './subscription.service';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const subscriptions = catchAsync(async (req, res) => {
     const result = await SubscriptionService.subscriptionsFromDB(req.query);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Subscription list retrieved successfully',
          data: result,
     });
});

const subscriptionDetails = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const result = await SubscriptionService.subscriptionDetailsFromDB(id);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Subscription details retrieved successfully',
          data: result.subscription,
     });
});

const cancelSubscription = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const result = await SubscriptionService.cancelSubscriptionToDB(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Cancel subscription successfully',
          data: result,
     });
});
// create subscription intents
const createSubscriptionSetup = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const packageId = req.params.id;
     const result = await SubscriptionService.createSubscriptionSetupIntoDB(id, packageId);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Create Intent successfully',
          data: {
               customerId: result.customerId,
               clientSecret: result.clientSecret,
          },
     });
});
//create subscription
const createSubscription = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const packageId = req.params.id;
     const result = await SubscriptionService.createSubscriptionIntoDB({
          userId: id,
          paymentMethodId: req.body.paymentMethodId,
          packageId,
     });

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Create checkout session successfully',
          data: {
               subscriptionId: result.subscriptionId,
               clientSecret: result.clientSecret,
          },
     });
});

// update subscriptions
const updateSubscription = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const packageId = req.params.id;
     const result = await SubscriptionService.upgradeSubscriptionToDB(id, packageId);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Subscription upgraded successfully',
          data: {
               url: result.subscriptionId,
          },
     });
});
const orderSuccess = catchAsync(async (req, res) => {
     const sessionId = req.query.session_id as string;
     const session = await SubscriptionService.successMessage(sessionId);
     res.render('success', { session });
});
// Assuming you have OrderServices imported properly
const orderCancel = catchAsync(async (req, res) => {
     res.render('cancel');
});
export const SubscriptionController = {
     subscriptions,
     subscriptionDetails,
     updateSubscription,
     cancelSubscription,
     orderSuccess,
     orderCancel,
     createSubscription,
     createSubscriptionSetup,
};
