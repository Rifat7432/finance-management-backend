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
const uploadFileToS3_1 = __importDefault(require("./uploadFileToS3"));
const moveImagesVideosToS3 = (files) => __awaiter(void 0, void 0, void 0, function* () {
    const s3Paths = {};
    for (const field of ['image', 'video']) {
        const fileField = files === null || files === void 0 ? void 0 : files[field];
        if (fileField && Array.isArray(fileField) && fileField.length > 0) {
            if (fileField.length === 1) {
                const uploaded = yield (0, uploadFileToS3_1.default)(fileField[0].path);
                s3Paths[field] = uploaded;
            }
            else {
                s3Paths[field] = yield Promise.all(fileField.map((f) => (0, uploadFileToS3_1.default)(f.path)));
            }
        }
    }
    return s3Paths;
});
exports.default = moveImagesVideosToS3;
