import { Router } from "express";
import { UserRouter } from '../app/modules/user/user.route';
import { AuthRouter } from '../app/modules/auth/auth.route';
import { ExpenseRouter } from '../app/modules/expense/expense.route';
import { DebtRouter } from '../app/modules/debt/debt.route';
import { AppointmentRouter } from '../app/modules/appointment/appointment.route';
import { BudgetRouter } from '../app/modules/budget/budget.route';
import { SavingGoalRouter } from '../app/modules/savingGoal/savingGoal.route';
import { SavingRouter } from '../app/modules/saving/saving.route';
import { IncomeRouter } from "../app/modules/income/income.route";
import { AdminRoutes } from "../app/modules/admin/admin.route";
import { AdRouter } from "../app/modules/ad/ad.route";
import { SubscriptionRoutes } from "../app/modules/subscription/subscription.routes";
import { PackageRoutes } from "../app/modules/package/package.routes";

const router = Router();
const routes: { path: string; route: Router }[] = [
  {
    path: '/auth',
    route: AuthRouter,
  },
  {
    path: '/ad',
    route: AdRouter,
  },
  {
    path: '/admin',
    route: AdminRoutes,
  },
  {
    path: '/users',
    route: UserRouter,
  },
  {
    path: '/incomes',
    route: IncomeRouter,
  },
  {
    path: '/expenses',
    route: ExpenseRouter,
  },
  {
    path: '/debts',
    route: DebtRouter,
  },
  {
    path: '/appointments',
    route: AppointmentRouter,
  },
  {
    path: '/budgets',
    route: BudgetRouter,
  },
  {
    path: '/saving-goals',
    route: SavingGoalRouter,
  },
  {
    path: '/savings',
    route: SavingRouter,
  },
  {
    path: '/subscriptions',
    route: SubscriptionRoutes,
  },
  {
    path: '/packages',
    route: PackageRoutes,
  },
];

routes.forEach((element) => {
  if (element?.path && element?.route) {
    router.use(element?.path, element?.route);
  }
});

export default router;
