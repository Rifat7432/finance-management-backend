"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const morgen_1 = require("./shared/morgen");
const globalErrorHandler_1 = __importDefault(require("./globalErrorHandler/globalErrorHandler"));
const notFound_1 = require("./globalErrorHandler/notFound");
const welcome_1 = require("./utils/welcome");
const config_1 = __importDefault(require("./config"));
const stripeWebhook_route_1 = require("./routes/stripeWebhook.route");
// 👉 Import the cron job here
require("./app/cronJobs/IncomeScheduler"); // ✅ This runs the job on app start
require("./app/cronJobs/ExpensesScheduler"); // ✅ starts Expense scheduler on app start
const app = (0, express_1.default)();
// ----------------------------
// 🖼️ View Engine Setup (EJS)
// ----------------------------
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, 'views'));
// ----------------------------
// 🧾 Request Logging (Morgan)
// ----------------------------
app.use(morgen_1.Morgan.successHandler);
app.use(morgen_1.Morgan.errorHandler);
// ----------------------------
// 🌐 CORS Middleware
// ----------------------------
app.use((0, cors_1.default)({
    origin: config_1.default.allowed_origins || '*',
    credentials: true,
}));
// ----------------------------
// 📦 Webhook Route (before body-parser)
// ----------------------------
app.use('/api/v1', stripeWebhook_route_1.stripeWebhookRoute); // If this route needs raw body, make sure to configure raw parser in the route file
// ----------------------------
// 📦 Body Parsers
// ----------------------------
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ----------------------------
// 📁 Static File Serving
// ----------------------------
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/public', express_1.default.static(path_1.default.join(__dirname, '../public')));
// ----------------------------
// 🚦 Main API Routes
// ----------------------------
app.use('/api/v1', routes_1.default);
// ----------------------------
// 🏠 Root Route
// ----------------------------
app.get('/', (req, res) => {
    res.send((0, welcome_1.welcome)());
});
// ----------------------------
// ❌ 404 - Not Found Handler
// ----------------------------
app.use(notFound_1.notFound);
// ----------------------------
// 🛑 Global Error Handler
// ----------------------------
app.use(globalErrorHandler_1.default);
exports.default = app;
