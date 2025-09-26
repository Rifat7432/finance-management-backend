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
const income_model_1 = require("../modules/income/income.model");
const date_fns_1 = require("date-fns");
// 🔁 Calculate next receive date
const getNextDate = (date, frequency) => {
    const d = new Date(date);
    if (frequency === 'monthly') {
        d.setMonth(d.getMonth() + 1);
    }
    else if (frequency === 'yearly') {
        d.setFullYear(d.getFullYear() + 1);
    }
    d.setHours(0, 0, 0, 0);
    return d;
};
// 📅 Check if receiveDate is today or in the past
const isDatePastOrToday = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const given = new Date(date);
    given.setHours(0, 0, 0, 0);
    return given <= today;
};
// ⏰ Cron job: Every day at midnight
node_cron_1.default.schedule('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔄 Running income automation task...');
    try {
        // Calculate last month range
        const lastMonthStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 1));
        const lastMonthEnd = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(new Date(), 1));
        // Calculate last year range
        const lastYearStart = (0, date_fns_1.startOfYear)((0, date_fns_1.subYears)(new Date(), 1));
        const lastYearEnd = (0, date_fns_1.endOfYear)((0, date_fns_1.subYears)(new Date(), 1));
        // Query for both cases
        const recurringSalaries = yield income_model_1.Income.find({
            $or: [
                {
                    frequency: 'monthly',
                    receiveDate: { $gte: lastMonthStart, $lte: lastMonthEnd },
                },
                {
                    frequency: 'yearly',
                    receiveDate: { $gte: lastYearStart, $lte: lastYearEnd },
                },
            ],
        });
        // Using for...of for proper async/await handling
        for (const salary of recurringSalaries) {
            if (!isDatePastOrToday(salary.receiveDate))
                continue;
            const nextReceiveDate = getNextDate(salary.receiveDate, salary.frequency);
            const alreadyExists = yield income_model_1.Income.exists({
                name: salary.name,
                userId: salary.userId,
                receiveDate: {
                    $gte: new Date(nextReceiveDate.setHours(0, 0, 0, 0)),
                    $lt: new Date(nextReceiveDate.setHours(23, 59, 59, 999)),
                },
            });
            if (!alreadyExists) {
                const newSalary = new income_model_1.Income({
                    name: salary.name,
                    amount: salary.amount,
                    receiveDate: nextReceiveDate,
                    frequency: salary.frequency,
                    userId: salary.userId,
                });
                yield newSalary.save();
                console.log(`✅ Created salary for ${salary.name} on ${nextReceiveDate.toDateString()}`);
            }
        }
    }
    catch (error) {
        console.error('❌ Error in salary scheduler:', error);
    }
}));
