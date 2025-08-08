import { StatusCodes } from 'http-status-codes';
import { User } from '../user/user.model';
import AppError from '../../../errors/AppError';
import { Income } from '../income/income.model';

import { endOfMonth, startOfMonth } from 'date-fns';
import mongoose from 'mongoose';
import { SavingGoal } from '../savingGoal/savingGoal.model';
import { Budget } from '../budget/budget.model';
import { Expense } from '../expense/expense.model';

// create user
const getAnalyticsFromDB = async (userId: string) => {
     console.log('userId', userId);
     const user = await User.isExistUserById(userId);
     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }
     const now = new Date();
     const start = startOfMonth(now);
     const end = endOfMonth(now);

     const result = await Income.aggregate([
          {
               $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: start, $lte: end },
               },
          },
          {
               $group: {
                    _id: null,
                    totalIncome: { $sum: '$amount' },
               },
          },
          {
               $lookup: {
                    from: 'expenses',
                    let: { userId: new mongoose.Types.ObjectId(userId) },
                    pipeline: [
                         {
                              $match: {
                                   $expr: {
                                        $and: [{ $eq: ['$userId', '$$userId'] }, { $gte: ['$createdAt', start] }, { $lte: ['$createdAt', end] }],
                                   },
                              },
                         },
                         {
                              $group: {
                                   _id: null,
                                   totalExpenses: { $sum: '$amount' },
                              },
                         },
                    ],
                    as: 'expenseData',
               },
          },
          {
               $lookup: {
                    from: 'budgets',
                    let: { userId: new mongoose.Types.ObjectId(userId) },
                    pipeline: [
                         {
                              $match: {
                                   $expr: {
                                        $and: [{ $eq: ['$userId', '$$userId'] }, { $gte: ['$createdAt', start] }, { $lte: ['$createdAt', end] }],
                                   },
                              },
                         },
                         {
                              $group: {
                                   _id: null,
                                   totalBudget: { $sum: '$amount' },
                              },
                         },
                    ],
                    as: 'budgetData',
               },
          },
          {
               $lookup: {
                    from: SavingGoal.collection.name,
                    let: { userId: new mongoose.Types.ObjectId(userId) },
                    pipeline: [
                         {
                              $match: {
                                   $expr: {
                                        $and: [
                                             { $eq: ['$userId', '$$userId'] },
                                             { $gte: ['$createdAt', start] },
                                             { $lte: ['$createdAt', end] },
                                             { $gt: [{ $toDate: '$completeDate' }, new Date()] }, // convert string to date here
                                        ],
                                   },
                              },
                         },

                         {
                              $group: {
                                   _id: null,
                                   totalMonthlyTarget: { $sum: '$monthlyTarget' },
                              },
                         },
                    ],
                    as: 'savingGoalData',
               },
          },
          {
               $addFields: {
                    totalExpenses: {
                         $ifNull: [{ $arrayElemAt: ['$expenseData.totalExpenses', 0] }, 0],
                    },
                    budgetOnly: {
                         $ifNull: [{ $arrayElemAt: ['$budgetData.totalBudget', 0] }, 0],
                    },
                    savingGoalMonthly: {
                         $ifNull: [{ $arrayElemAt: ['$savingGoalData.totalMonthlyTarget', 0] }, 0],
                    },
               },
          },
          {
               $addFields: {
                    totalBudget: {
                         $add: [{ $ifNull: ['$budgetOnly', 0] }, { $ifNull: ['$savingGoalMonthly', 0] }],
                    },
                    disposal: {
                         $subtract: [{ $ifNull: ['$totalIncome', 0] }, { $ifNull: ['$totalExpenses', 0] }],
                    },
               },
          },
          {
               $project: {
                    _id: 0,
                    totalIncome: 1,
                    totalExpenses: 1,
                    totalBudget: 1,
                    disposal: 1,
               },
          },
     ]);

     const savingGoalCompletionRate = await SavingGoal.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId) } },

          // Convert string dates to dates
          {
               $addFields: {
                    startDate: { $toDate: '$date' },
                    completeDateConv: { $toDate: '$completeDate' },
                    nowDate: now,
               },
          },

          // Calculate effective end date (min of now and completeDate)
          {
               $addFields: {
                    endDate: {
                         $cond: [{ $lt: ['$nowDate', '$completeDateConv'] }, '$nowDate', '$completeDateConv'],
                    },
               },
          },

          // Calculate months elapsed between startDate and endDate
          {
               $addFields: {
                    monthsElapsed: {
                         $add: [{ $multiply: [{ $subtract: [{ $year: '$endDate' }, { $year: '$startDate' }] }, 12] }, { $subtract: [{ $month: '$endDate' }, { $month: '$startDate' }] }],
                    },
               },
          },

          // Prevent negative monthsElapsed
          {
               $addFields: {
                    monthsElapsed: {
                         $cond: [{ $lt: ['$monthsElapsed', 0] }, 0, '$monthsElapsed'],
                    },
               },
          },

          // Calculate savedSoFar = min(monthsElapsed * monthlyTarget, totalAmount)
          {
               $addFields: {
                    savedSoFar: {
                         $min: [{ $multiply: ['$monthsElapsed', '$monthlyTarget'] }, '$totalAmount'],
                    },
               },
          },

          // Group to sum total savedSoFar and totalAmount
          {
               $group: {
                    _id: null,
                    totalSavedSoFar: { $sum: '$savedSoFar' },
                    totalGoalAmount: { $sum: '$totalAmount' },
               },
          },

          // Calculate percentage complete
          {
               $project: {
                    _id: 0,
                    percentComplete: {
                         $cond: [{ $eq: ['$totalGoalAmount', 0] }, 0, { $multiply: [{ $divide: ['$totalSavedSoFar', '$totalGoalAmount'] }, 100] }],
                    },
               },
          },
     ]);

     return { user, analytics: result.length > 0 ? result[0] : {}, savingGoalCompletionRate: savingGoalCompletionRate.length > 0 ? savingGoalCompletionRate[0].percentComplete : 0 };
};
const getLatestUpdateFromDB = async (userId: string) => {
     const latestFive = await Budget.aggregate([
          {
               $match: { userId: new mongoose.Types.ObjectId(userId) },
          },
          {
               $project: {
                    name: 1,
                    amount: 1,
                    type: { $literal: 'Budget' },
                    createdAt: 1,
               },
          },
          {
               $unionWith: {
                    coll: Expense.collection.name,
                    pipeline: [
                         { $match: { userId: new mongoose.Types.ObjectId(userId) } },
                         {
                              $project: {
                                   name: 1,
                                   amount: 1,
                                   type: { $literal: 'Expense' },
                                   createdAt: 1,
                              },
                         },
                    ],
               },
          },
          {
               $unionWith: {
                    coll: Income.collection.name,
                    pipeline: [
                         { $match: { userId: new mongoose.Types.ObjectId(userId) } },
                         {
                              $project: {
                                   name: 1,
                                   amount: 1,
                                   type: { $literal: 'Income' },
                                   createdAt: 1,
                              },
                         },
                    ],
               },
          },
          {
               $unionWith: {
                    coll: SavingGoal.collection.name,
                    pipeline: [
                         { $match: { userId: new mongoose.Types.ObjectId(userId) } },
                         {
                              $project: {
                                   name: 1,
                                   amount: '$totalAmount', // Map totalAmount to amount for consistency
                                   type: { $literal: 'SavingGoal' },
                                   createdAt: 1,
                              },
                         },
                    ],
               },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
     ]);

     return latestFive;
};

export const AnalyticsService = {
     getAnalyticsFromDB,
     getLatestUpdateFromDB,
};
