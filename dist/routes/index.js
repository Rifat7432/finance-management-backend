"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_route_1 = require("../app/modules/user/user.route");
const auth_route_1 = require("../app/modules/auth/auth.route");
const expense_route_1 = require("../app/modules/expense/expense.route");
const debt_route_1 = require("../app/modules/debt/debt.route");
const appointment_route_1 = require("../app/modules/appointment/appointment.route");
const budget_route_1 = require("../app/modules/budget/budget.route");
const savingGoal_route_1 = require("../app/modules/savingGoal/savingGoal.route");
const income_route_1 = require("../app/modules/income/income.route");
const admin_route_1 = require("../app/modules/admin/admin.route");
const ad_route_1 = require("../app/modules/ad/ad.route");
const subscription_routes_1 = require("../app/modules/subscription/subscription.routes");
const package_routes_1 = require("../app/modules/package/package.routes");
const analytics_route_1 = require("../app/modules/analytics/analytics.route");
const content_route_1 = require("../app/modules/content/content.route");
const calculator_route_1 = require("../app/modules/calculator/calculator.route");
const router = (0, express_1.Router)();
const routes = [
    {
        path: '/auth',
        route: auth_route_1.AuthRouter,
    },
    {
        path: '/ad',
        route: ad_route_1.AdRouter,
    },
    {
        path: '/admin',
        route: admin_route_1.AdminRoutes,
    },
    {
        path: '/users',
        route: user_route_1.UserRouter,
    },
    {
        path: '/incomes',
        route: income_route_1.IncomeRouter,
    },
    {
        path: '/expenses',
        route: expense_route_1.ExpenseRouter,
    },
    {
        path: '/debts',
        route: debt_route_1.DebtRouter,
    },
    {
        path: '/appointments',
        route: appointment_route_1.AppointmentRouter,
    },
    {
        path: '/budgets',
        route: budget_route_1.BudgetRouter,
    },
    {
        path: '/saving-goals',
        route: savingGoal_route_1.SavingGoalRouter,
    },
    {
        path: '/subscriptions',
        route: subscription_routes_1.SubscriptionRoutes,
    },
    {
        path: '/packages',
        route: package_routes_1.PackageRoutes,
    },
    {
        path: '/analytics',
        route: analytics_route_1.AnalyticsRouter,
    },
    {
        path: '/contents',
        route: content_route_1.ContentRouter,
    },
    {
        path: '/calculator',
        route: calculator_route_1.CalculatorRouter,
    },
];
routes.forEach((element) => {
    if ((element === null || element === void 0 ? void 0 : element.path) && (element === null || element === void 0 ? void 0 : element.route)) {
        router.use(element === null || element === void 0 ? void 0 : element.path, element === null || element === void 0 ? void 0 : element.route);
    }
});
exports.default = router;
