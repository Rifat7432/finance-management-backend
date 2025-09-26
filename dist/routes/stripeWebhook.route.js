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
exports.stripeWebhookRoute = void 0;
// src/routes/stripeWebhook.route.ts
const express_1 = __importDefault(require("express"));
const handleStripeWebhook_1 = __importDefault(require("../helpers/stripe/handleStripeWebhook"));
const router = express_1.default.Router();
// Stripe requires raw body for signature verification
router.post('/webhook/stripe', express_1.default.raw({ type: 'application/json' }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, handleStripeWebhook_1.default)(req, res);
    }
    catch (error) {
        console.error('Error handling Stripe webhook:', error);
        res.status(500).send('Internal Server Error');
    }
}));
exports.stripeWebhookRoute = router;
