"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
var NotificationType;
(function (NotificationType) {
    NotificationType["ADMIN"] = "ADMIN";
    NotificationType["SYSTEM"] = "SYSTEM";
    NotificationType["PAYMENT"] = "PAYMENT";
    NotificationType["ALERT"] = "ALERT";
    NotificationType["ORDER"] = "APPOINTMENT";
    NotificationType["CANCELLED"] = "CANCELLED";
})(NotificationType || (NotificationType = {}));
const notificationSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: false,
        default: 'Notification',
    },
    message: {
        type: String,
        required: true,
    },
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    read: {
        type: Boolean,
        default: false,
        index: true,
    },
    type: {
        type: String,
        enum: Object.values(NotificationType),
        required: true,
    },
}, {
    timestamps: true,
});
notificationSchema.index({ receiver: 1, read: 1 });
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
