import cron from 'node-cron';
import { Types } from 'mongoose';
import { Expense } from '../modules/expense/expense.model';
import { IExpense } from '../modules/expense/expense.interface';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears } from 'date-fns';

// Calculate next endDate based on frequency
const getNextDate = (date: Date, frequency: string): Date => {
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

const isDatePastOrToday = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const given = new Date(date);
  given.setHours(0, 0, 0, 0);

  return given <= today;
};

// Cron job
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 Running expense automation task...');

  try {
    // Calculate last periods for each frequency
    const lastWeekStart = startOfWeek(subWeeks(new Date(), 1));
    const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1));

    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

    const lastYearStart = startOfYear(subYears(new Date(), 1));
    const lastYearEnd = endOfYear(subYears(new Date(), 1));

    // Find recurring expenses where endDate falls in their relevant period
    const recurringExpenses: IExpense[] = await Expense.find({
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
      if (!isDatePastOrToday(expense.endDate)) continue;

      const nextEndDate = getNextDate(expense.endDate, expense.frequency);

      const alreadyExists = await Expense.exists({
        name: expense.name,
        userId: expense.userId,
        endDate: {
          $gte: new Date(nextEndDate.setHours(0, 0, 0, 0)),
          $lt: new Date(nextEndDate.setHours(23, 59, 59, 999)),
        },
      });

      if (!alreadyExists) {
        const newExpense = new Expense({
          name: expense.name,
          amount: expense.amount,
          endDate: nextEndDate,
          frequency: expense.frequency,
          userId: expense.userId as Types.ObjectId,
        });

        await newExpense.save();
        console.log(`✅ Created expense for ${expense.name} on ${nextEndDate.toDateString()}`);
      }
    }
  } catch (error) {
    console.error('❌ Error in expense scheduler:', error);
  }
});
