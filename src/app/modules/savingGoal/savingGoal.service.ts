import { StatusCodes } from 'http-status-codes';
import { SavingGoal } from './savingGoal.model';
import AppError from '../../../errors/AppError';
import { ISavingGoal } from './savingGole.interface';

const createSavingGoalToDB = async (payload: Partial<ISavingGoal>, userId: string): Promise<ISavingGoal> => {
     const { name, totalAmount, monthlyTarget, date } = payload;
     const startDate = new Date(date!);
     // Calculate months needed to complete the goal
     const monthsNeeded = Math.ceil(totalAmount! / monthlyTarget!);
     // Calculate complete date
     const completeDate = new Date(startDate);
     completeDate.setMonth(completeDate.getMonth() + monthsNeeded);
     // Save goal to database
     const savingGoal = await SavingGoal.create({
          name,
          totalAmount,
          monthlyTarget,
          date: startDate.toISOString(),
          completeDate: completeDate.toISOString(),
          userId,
     });
     return savingGoal;
};

const getUserSavingGoalsFromDB = async (userId: string): Promise<ISavingGoal[]> => {
     // Get all goals for this user
     const goals = await SavingGoal.find({ userId });
     // Calculate progress for each goal
     const goalsWithProgress = goals.map((goal) => {
          const startDate = new Date(goal.date);
          const today = new Date();
          // Months passed since start
          const monthsPassed = Math.max(0, (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth()));

          // Calculate how much should have been saved by now
          const savedSoFar = monthsPassed * goal.monthlyTarget;

          // Ensure we don't go over totalAmount
          const percentComplete = Math.min((savedSoFar / goal.totalAmount) * 100, 100);

          return {
               ...goal.toObject(),
               percentComplete: parseFloat(percentComplete.toFixed(2)), // 2 decimal places
               monthsPassed,
               isCompleted: percentComplete >= 100,
          };
     });
     return goalsWithProgress;
};

const getSingleSavingGoalFromDB = async (id: string): Promise<ISavingGoal | null> => {
     const goal = await SavingGoal.findById(id);
     if (!goal) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Saving goal not found');
     }
     return goal;
};

const updateSavingGoalToDB = async (id: string, payload: Partial<ISavingGoal>): Promise<ISavingGoal | null> => {
     const currentGoal = await SavingGoal.findById(id);
     if (!currentGoal) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Saving goal not found');
     }

     const updatedTotalAmount = payload.totalAmount ?? currentGoal.totalAmount;
     const updatedMonthlyTarget = payload.monthlyTarget ?? currentGoal.monthlyTarget;
     const updatedDate = payload.date ? new Date(payload.date) : new Date(currentGoal.date);

     if ('totalAmount' in payload || 'monthlyTarget' in payload || 'date' in payload) {
          const monthsNeeded = Math.ceil(updatedTotalAmount / updatedMonthlyTarget);
          const newCompleteDate = new Date(updatedDate);
          newCompleteDate.setMonth(newCompleteDate.getMonth() + monthsNeeded);

          payload.completeDate = newCompleteDate.toISOString();

          if (payload.date) {
               payload.date = updatedDate.toISOString();
          }
     }

     const updated = await SavingGoal.findByIdAndUpdate(id, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update saving goal');
     }
     return updated;
};

const deleteSavingGoalFromDB = async (id: string): Promise<boolean> => {
     const deleted = await SavingGoal.findByIdAndDelete(id);
     if (!deleted) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Saving goal not found');
     }
     return true;
};

export const SavingGoalService = {
     createSavingGoalToDB,
     getUserSavingGoalsFromDB,
     getSingleSavingGoalFromDB,
     updateSavingGoalToDB,
     deleteSavingGoalFromDB,
};
