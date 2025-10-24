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
exports.scheduleMonthlyAnalyticsJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const mongoose_1 = __importDefault(require("mongoose"));
const date_fns_1 = require("date-fns");
const http_status_codes_1 = require("http-status-codes");
const income_model_1 = require("../modules/income/income.model");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const user_model_1 = require("../modules/user/user.model");
const savingGoal_model_1 = require("../modules/savingGoal/savingGoal.model");
// ========================================================
// === Helper Function: getAnalyticsFromDB (per user) =====
// ========================================================
const getAnalyticsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.isExistUserById(userId);
    if (!user)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
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
            $group: { _id: null, totalIncome: { $sum: '$amount' } },
        },
        {
            $lookup: {
                from: 'expenses',
                let: { userId: new mongoose_1.default.Types.ObjectId(userId) },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$userId', '$$userId'] },
                                    { $gte: ['$createdAt', start] },
                                    { $lte: ['$createdAt', end] },
                                ],
                            },
                        },
                    },
                    {
                        $group: { _id: null, totalExpenses: { $sum: '$amount' } },
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
                                $and: [
                                    { $eq: ['$userId', '$$userId'] },
                                    { $gte: ['$createdAt', start] },
                                    { $lte: ['$createdAt', end] },
                                ],
                            },
                        },
                    },
                    {
                        $group: { _id: null, totalBudget: { $sum: '$amount' } },
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
                                    { $gt: [{ $toDate: '$completeDate' }, new Date()] },
                                ],
                            },
                        },
                    },
                    {
                        $group: { _id: null, totalMonthlyTarget: { $sum: '$monthlyTarget' } },
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
                    $add: [
                        { $ifNull: ['$budgetOnly', 0] },
                        { $ifNull: ['$savingGoalMonthly', 0] },
                    ],
                },
                disposal: {
                    $subtract: [
                        { $ifNull: ['$totalIncome', 0] },
                        { $ifNull: ['$totalExpenses', 0] },
                    ],
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
        {
            $addFields: {
                startDate: { $toDate: '$date' },
                completeDateConv: { $toDate: '$completeDate' },
                nowDate: new Date(),
            },
        },
        {
            $addFields: {
                endDate: {
                    $cond: [
                        { $lt: ['$nowDate', '$completeDateConv'] },
                        '$nowDate',
                        '$completeDateConv',
                    ],
                },
            },
        },
        {
            $addFields: {
                monthsElapsed: {
                    $add: [
                        {
                            $multiply: [
                                { $subtract: [{ $year: '$endDate' }, { $year: '$startDate' }] },
                                12,
                            ],
                        },
                        { $subtract: [{ $month: '$endDate' }, { $month: '$startDate' }] },
                    ],
                },
            },
        },
        {
            $addFields: {
                monthsElapsed: {
                    $cond: [{ $lt: ['$monthsElapsed', 0] }, 0, '$monthsElapsed'],
                },
            },
        },
        {
            $addFields: {
                savedSoFar: {
                    $min: [
                        { $multiply: ['$monthsElapsed', '$monthlyTarget'] },
                        '$totalAmount',
                    ],
                },
            },
        },
        {
            $group: {
                _id: null,
                totalSavedSoFar: { $sum: '$savedSoFar' },
                totalGoalAmount: { $sum: '$totalAmount' },
            },
        },
        {
            $project: {
                _id: 0,
                percentComplete: {
                    $cond: [
                        { $eq: ['$totalGoalAmount', 0] },
                        0,
                        {
                            $multiply: [
                                { $divide: ['$totalSavedSoFar', '$totalGoalAmount'] },
                                100,
                            ],
                        },
                    ],
                },
            },
        },
    ]);
    return {
        user,
        analytics: result.length > 0 ? result[0] : {},
        savingGoalCompletionRate: savingGoalCompletionRate.length > 0
            ? savingGoalCompletionRate[0].percentComplete
            : 0,
    };
});
// ========================================================
// === Cron Job: Runs end of every month ==================
// ========================================================
const scheduleMonthlyAnalyticsJob = () => {
    // Run at 23:55 on 28–31 (the last day check prevents multiple runs)
    node_cron_1.default.schedule('55 23 28-31 * *', () => __awaiter(void 0, void 0, void 0, function* () {
        const now = new Date();
        const end = (0, date_fns_1.endOfMonth)(now);
        // Run only if this is actually the last day of the month
        if (now.getDate() !== end.getDate())
            return;
        console.log('🕒 Running monthly analytics job...');
        const users = yield user_model_1.User.find({ isDeleted: false });
        const allResults = [];
        for (const user of users) {
            const data = yield getAnalyticsFromDB(user._id.toString());
            allResults.push(data);
            const { disposal } = data.analytics;
            // === Distribute disposal to saving goals ===
            if (disposal && disposal > 0) {
                const savingGoals = yield savingGoal_model_1.SavingGoal.find({
                    userId: user._id,
                    isCompleted: false,
                });
                const totalTarget = savingGoals.reduce((acc, g) => acc + g.monthlyTarget, 0);
                for (const goal of savingGoals) {
                    const share = totalTarget > 0
                        ? (goal.monthlyTarget / totalTarget) * disposal
                        : 0;
                    // Add this month's saved portion
                    goal.savedMoney += share;
                    // Calculate incremental completion % for this month
                    const monthlyPercent = (share / goal.totalAmount) * 100;
                    // Add this month's percent to existing completion
                    goal.completionRation = Math.min(goal.completionRation + monthlyPercent, 100);
                    // Mark goal complete if it reaches 100%
                    if (goal.completionRation >= 100) {
                        goal.isCompleted = true;
                    }
                    yield goal.save();
                }
            }
        }
        console.log('✅ Monthly Analytics Results:\n', JSON.stringify(allResults, null, 2));
    }));
};
exports.scheduleMonthlyAnalyticsJob = scheduleMonthlyAnalyticsJob;
