"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavingGoal = void 0;
const mongoose_1 = require("mongoose");
const savingGoalSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    monthlyTarget: { type: Number, required: true },
    completionRation: { type: Number, default: 0 },
    date: { type: String, required: true },
    completeDate: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    isCompleted: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
exports.SavingGoal = (0, mongoose_1.model)('SavingGoal', savingGoalSchema);
