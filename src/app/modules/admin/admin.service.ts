import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { Subscription } from '../subscription/subscription.model';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { Income } from '../income/income.model';
import { Expense } from '../expense/expense.model';
import { Budget } from '../budget/budget.model';
import { Debt } from '../debt/debt.model';
import { Appointment } from '../appointment/appointment.model';
import { IAppointment } from '../appointment/appointment.interface';
import { NotificationSettings } from '../notificationSettings/notificationSettings.model';
import { INotificationSetting } from '../notificationSettings/notificationSettings.interface';
const determineStatus = (ratio: number): 'on track' | 'medium risk' | 'high risk' => {
     if (ratio >= 1.2) return 'on track'; // income comfortably exceeds expenses/budget/debt
     if (ratio >= 1.0) return 'medium risk'; // roughly balanced
     return 'high risk'; // income too low compared to outflows
};

/**
 * Get financial overview for all users (with pagination + search)
 */
export const getUserFinancialOverviewFromDB = async (search: string = '', page: number = 1, limit: number = 10) => {
     const today = new Date();
     const monthStart = startOfMonth(today);
     const monthEnd = endOfMonth(today);

     // Search filter
     const searchFilter = search
          ? {
                 $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }],
            }
          : {};

     // Pagination skip/limit
     const skip = (page - 1) * limit;

     // Fetch users with search + pagination
     const users = await User.find({ ...searchFilter, role: 'USER', isDeleted: false })
          .select('name email image')
          .skip(skip)
          .limit(limit)
          .lean();
     const total = await User.countDocuments(searchFilter);
     // Process each user
     const userFinancialData = await Promise.all(
          users.map(async (user) => {
               const [incomes, expenses, budgets, debts] = await Promise.all([
                    Income.find({
                         userId: user._id,
                         isDeleted: false,
                         createdAt: { $gte: monthStart, $lte: monthEnd },
                    }).lean(),
                    Expense.find({
                         userId: user._id,
                         isDeleted: false,
                         createdAt: { $gte: monthStart, $lte: monthEnd },
                    }).lean(),
                    Budget.find({
                         userId: user._id,
                         isDeleted: false,
                         createdAt: { $gte: monthStart, $lte: monthEnd },
                    }).lean(),
                    Debt.find({
                         userId: user._id,
                         isDeleted: false,
                         createdAt: { $gte: monthStart, $lte: monthEnd },
                    }).lean(),
               ]);

               // Totals
               const totalIncome = incomes.reduce((sum: any, i: any) => sum + i.amount, 0);
               const totalExpenses = expenses.reduce((sum: any, e: any) => sum + e.amount, 0);
               const totalBudget = budgets.reduce((sum: any, b: any) => sum + b.amount, 0);
               const totalDebt = debts.reduce((sum: any, d: any) => sum + d.amount, 0);

               // Ratios for logic
               const expenseRatio = totalIncome / (totalExpenses || 1);
               const budgetRatio = totalIncome / (totalBudget || 1);
               const debtRatio = (totalIncome - totalExpenses - totalBudget) / (totalDebt || 1);

               // Status
               const expenseStatus = determineStatus(expenseRatio);
               const budgetStatus = determineStatus(budgetRatio);
               const debtStatus = determineStatus(debtRatio);
               const incomeStatus = totalIncome > totalExpenses + totalDebt ? 'on track' : totalIncome > 0 ? 'medium risk' : 'high risk';

               // Last activity
               const allDates = [
                    ...incomes.map((x: any) => x.createdAt),
                    ...expenses.map((x: any) => x.createdAt),
                    ...budgets.map((x: any) => x.createdAt),
                    ...debts.map((x: any) => x.createdAt),
               ].filter(Boolean);

               const lastActivity = allDates.length ? new Date(Math.max(...allDates.map((d) => new Date(d).getTime()))) : null;

               return {
                    ...user,
                    financialStatus: {
                         incomeStatus,
                         expenseStatus,
                         budgetStatus,
                         debtStatus,
                    },
                    totals: {
                         totalIncome,
                         totalExpenses,
                         totalBudget,
                         totalDebt,
                    },
                    lastActivity,
               };
          }),
     );

     return {
          users: userFinancialData,
          meta: {
               total,
               page,
               limit,
               totalPage: Math.ceil(total / limit),
          },
     };
};

/**
 * Calculate spending level (relative to average)
 */
const getSpendingLevel = (amount: number, avg: number): 'Low' | 'Moderate' | 'High' => {
     if (amount >= avg * 1.3) return 'High';
     if (amount >= avg * 0.7) return 'Moderate';
     return 'Low';
};

/**
 * Get Monthly Expense Analytics
 */
export const getMonthlyExpenseAnalyticsFromDB = async (userId: string) => {
     const today = new Date();
     const monthStart = startOfMonth(today);
     const monthEnd = endOfMonth(today);
     const lastMonthStart = startOfMonth(subMonths(today, 1));
     const lastMonthEnd = endOfMonth(subMonths(today, 1));

     // --- 1️⃣ Current month expenses ---
     const currentMonthExpenses = await Expense.aggregate([
          {
               $match: {
                    userId,
                    isDeleted: false,
                    createdAt: { $gte: monthStart, $lte: monthEnd },
               },
          },
          {
               $group: {
                    _id: '$category',
                    totalSpent: { $sum: '$amount' },
               },
          },
     ]);

     // --- 2️⃣ Last month expenses (for growth %) ---
     const lastMonthExpenses = await Expense.aggregate([
          {
               $match: {
                    userId,
                    isDeleted: false,
                    createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
               },
          },
          {
               $group: {
                    _id: null,
                    totalSpent: { $sum: '$amount' },
               },
          },
     ]);

     const totalCurrent = currentMonthExpenses.reduce((sum, c) => sum + c.totalSpent, 0);
     const totalLast = lastMonthExpenses[0]?.totalSpent || 0;

     const spendingGrowth = totalLast > 0 ? (((totalCurrent - totalLast) / totalLast) * 100).toFixed(1) : '0';

     // --- 3️⃣ Calculate category averages and levels ---
     const avgSpending = currentMonthExpenses.length > 0 ? totalCurrent / currentMonthExpenses.length : 0;

     const spendingHeatmap = currentMonthExpenses.map((cat) => ({
          category: cat._id,
          amount: cat.totalSpent,
          spendingLevel: getSpendingLevel(cat.totalSpent, avgSpending),
     }));

     // --- 4️⃣ Determine top overspending categories ---
     const topCategories = [...currentMonthExpenses]
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 3)
          .map((c) => c._id);

     return {
          totalMonthlySpending: totalCurrent,
          topOverspendingCategories: topCategories,
          spendingGrowth: `${spendingGrowth}%`,
          spendingHeatmap,
     };
};
const updateAppointmentStatusIntoDB = async (id: string): Promise<IAppointment | null> => {
     const appointment = await Appointment.findById(id);
     if (!appointment) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Appointment not found');
     }
     const updatedAppointment = await Appointment.findByIdAndUpdate(id, { status: 'complete' }, { new: true });
     return updatedAppointment;
};

const getNotificationSettingsFromDB = async (userId: string): Promise<INotificationSetting | null> => {
     const settings = await NotificationSettings.findOne({ userId });
     if (!settings) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Notification settings not found');
     }
     return settings;
};

const updateNotificationSettingsToDB = async (userId: string, payload: Partial<INotificationSetting>): Promise<INotificationSetting | null> => {
     const isUserExist = await User.findById(userId);
     if (!isUserExist || isUserExist.isDeleted || isUserExist.status !== 'active') {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }
     const updated = await NotificationSettings.findOneAndUpdate({ userId }, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update notification settings');
     }
     return updated;
};
export const AdminService = {
     getUserFinancialOverviewFromDB,
     getMonthlyExpenseAnalyticsFromDB,
     updateAppointmentStatusIntoDB,
     getNotificationSettingsFromDB,
     updateNotificationSettingsToDB,
};
