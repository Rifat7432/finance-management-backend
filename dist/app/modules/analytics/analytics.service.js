"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const http_status_codes_1 = require("http-status-codes");
const user_model_1 = require("../user/user.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const income_model_1 = require("../income/income.model");
const date_fns_1 = require("date-fns");
const mongoose_1 = __importDefault(require("mongoose"));
const savingGoal_model_1 = require("../savingGoal/savingGoal.model");
const budget_model_1 = require("../budget/budget.model");
const expense_model_1 = require("../expense/expense.model");
// create user
const getAnalyticsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('userId', userId);
    const user = yield user_model_1.User.isExistUserById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    const now = new Date();
    const start = (0, date_fns_1.startOfMonth)(now);
    const end = (0, date_fns_1.endOfMonth)(now);
    const result = yield income_model_1.Income.aggregate([
        {
            $match: {
                userId: new mongoose_1.default.Types.ObjectId(userId),
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
                let: { userId: new mongoose_1.default.Types.ObjectId(userId) },
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
                let: { userId: new mongoose_1.default.Types.ObjectId(userId) },
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
                from: savingGoal_model_1.SavingGoal.collection.name,
                let: { userId: new mongoose_1.default.Types.ObjectId(userId) },
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
    const savingGoalCompletionRate = yield savingGoal_model_1.SavingGoal.aggregate([
        { $match: { userId: new mongoose_1.default.Types.ObjectId(userId) } },
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
});
const getLatestUpdateFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const latestFive = yield budget_model_1.Budget.aggregate([
        {
            $match: { userId: new mongoose_1.default.Types.ObjectId(userId) },
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
                coll: expense_model_1.Expense.collection.name,
                pipeline: [
                    { $match: { userId: new mongoose_1.default.Types.ObjectId(userId) } },
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
                coll: income_model_1.Income.collection.name,
                pipeline: [
                    { $match: { userId: new mongoose_1.default.Types.ObjectId(userId) } },
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
                coll: savingGoal_model_1.SavingGoal.collection.name,
                pipeline: [
                    { $match: { userId: new mongoose_1.default.Types.ObjectId(userId) } },
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
});
exports.AnalyticsService = {
    getAnalyticsFromDB,
    getLatestUpdateFromDB,
};
