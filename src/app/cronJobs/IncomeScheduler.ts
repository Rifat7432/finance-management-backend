import cron from 'node-cron';
import { Types } from 'mongoose';
import { Income } from '../modules/income/income.model';
import { IIncome } from '../modules/income/income.interface';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';
// 🔁 Calculate next receive date
const getNextDate = (date: Date, frequency: string): Date => {
     const d = new Date(date);
     if (frequency === 'monthly') {
          d.setMonth(d.getMonth() + 1);
     } else if (frequency === 'yearly') {
          d.setFullYear(d.getFullYear() + 1);
     }
     d.setHours(0, 0, 0, 0);
     return d;
};

// 📅 Check if receiveDate is today or in the past
const isDatePastOrToday = (date: Date): boolean => {
     const today = new Date();
     today.setHours(0, 0, 0, 0);

     const given = new Date(date);
     given.setHours(0, 0, 0, 0);

     return given <= today;
};

// ⏰ Cron job: Every day at midnight
cron.schedule('0 0 * * *', async () => {
     console.log('🔄 Running salary automation task...');

     try {
          // Calculate last month range
          const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
          const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

          // Calculate last year range
          const lastYearStart = startOfYear(subYears(new Date(), 1));
          const lastYearEnd = endOfYear(subYears(new Date(), 1));

          // Query for both cases
          const recurringSalaries: IIncome[] = await Income.find({
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
               if (!isDatePastOrToday(salary.receiveDate)) continue;
               const nextReceiveDate = getNextDate(salary.receiveDate, salary.frequency);
               const alreadyExists = await Income.exists({
                    name: salary.name,
                    userId: salary.userId,
                    receiveDate: {
                         $gte: new Date(nextReceiveDate.setHours(0, 0, 0, 0)),
                         $lt: new Date(nextReceiveDate.setHours(23, 59, 59, 999)),
                    },
               });

               if (!alreadyExists) {
                    const newSalary = new Income({
                         name: salary.name,
                         amount: salary.amount,
                         receiveDate: nextReceiveDate,
                         frequency: salary.frequency,
                         userId: salary.userId as Types.ObjectId,
                    });

                    await newSalary.save();
                    console.log(`✅ Created salary for ${salary.name} on ${nextReceiveDate.toDateString()}`);
               }
          }
     } catch (error) {
          console.error('❌ Error in salary scheduler:', error);
     }
});
