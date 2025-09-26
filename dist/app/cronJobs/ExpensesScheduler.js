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
const node_cron_1 = __importDefault(require("node-cron"));
const expense_model_1 = require("../modules/expense/expense.model");
const date_fns_1 = require("date-fns");
// Calculate next endDate based on frequency
const getNextDate = (date, frequency) => {
    const d = new Date(date);
    switch (frequency) {
        case 'weekly':
            d.setDate(d.getDate() + 7);
            break;
        case 'monthly':
            d.setMonth(d.getMonth() + 1);
            break;
        case 'yearly':
            d.setFullYear(d.getFullYear() + 1);
            break;
        case 'on-off':
        default:
            break;
    }
    d.setHours(0, 0, 0, 0);
    return d;
};
const isDatePastOrToday = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const given = new Date(date);
    given.setHours(0, 0, 0, 0);
    return given <= today;
};
// Cron job
node_cron_1.default.schedule('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔄 Running expense automation task...');
    try {
        // Calculate last periods for each frequency
        const lastWeekStart = (0, date_fns_1.startOfWeek)((0, date_fns_1.subWeeks)(new Date(), 1));
        const lastWeekEnd = (0, date_fns_1.endOfWeek)((0, date_fns_1.subWeeks)(new Date(), 1));
        const lastMonthStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 1));
        const lastMonthEnd = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(new Date(), 1));
        const lastYearStart = (0, date_fns_1.startOfYear)((0, date_fns_1.subYears)(new Date(), 1));
        const lastYearEnd = (0, date_fns_1.endOfYear)((0, date_fns_1.subYears)(new Date(), 1));
        // Find recurring expenses where endDate falls in their relevant period
        const recurringExpenses = yield expense_model_1.Expense.find({
            $or: [
                {
                    frequency: 'weekly',
                    endDate: { $gte: lastWeekStart, $lte: lastWeekEnd },
                },
                {
                    frequency: 'monthly',
                    endDate: { $gte: lastMonthStart, $lte: lastMonthEnd },
                },
                {
                    frequency: 'yearly',
                    endDate: { $gte: lastYearStart, $lte: lastYearEnd },
                },
            ],
        });
        for (const expense of recurringExpenses) {
            if (!isDatePastOrToday(expense.endDate))
                continue;
            const nextEndDate = getNextDate(expense.endDate, expense.frequency);
            const alreadyExists = yield expense_model_1.Expense.exists({
                name: expense.name,
                userId: expense.userId,
                endDate: {
                    $gte: new Date(nextEndDate.setHours(0, 0, 0, 0)),
                    $lt: new Date(nextEndDate.setHours(23, 59, 59, 999)),
                },
            });
            if (!alreadyExists) {
                const newExpense = new expense_model_1.Expense({
                    name: expense.name,
                    amount: expense.amount,
                    endDate: nextEndDate,
                    frequency: expense.frequency,
                    userId: expense.userId,
                });
                yield newExpense.save();
                console.log(`✅ Created expense for ${expense.name} on ${nextEndDate.toDateString()}`);
            }
        }
    }
    catch (error) {
        console.error('❌ Error in expense scheduler:', error);
    }
}));
