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
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const mime_types_1 = __importDefault(require("mime-types"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../../config"));
const s3 = new client_s3_1.S3Client({
    region: config_1.default.aws.AWS_REGION,
    credentials: {
        accessKeyId: config_1.default.aws.AWS_ACCESS_KEY_ID,
        secretAccessKey: config_1.default.aws.AWS_SECRET_ACCESS_KEY,
    },
});
// 🔹 Upload local file → S3 → remove local
const uploadFileToS3 = (localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    const fileStream = fs_1.default.createReadStream(localFilePath);
    // Detect extension & MIME type
    const ext = path_1.default.extname(localFilePath) || '';
    const contentType = mime_types_1.default.lookup(ext) || 'application/octet-stream';
    // Decide folder automatically
    let folderName = 'others';
    if (contentType.startsWith('image/')) {
        folderName = 'image';
    }
    else if (contentType.startsWith('video/')) {
        folderName = 'video';
    }
    // Generate unique filename
    const generatedId = (0, uuid_1.v4)();
    const fileName = `${folderName}/${generatedId}${ext || '.bin'}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: config_1.default.aws.AWS_S3_BUCKET_NAME,
        Key: fileName,
        Body: fileStream,
        ContentType: contentType,
    });
    yield s3.send(command);
    // Remove local temp file
    fs_1.default.unlinkSync(localFilePath);
    const fileUrl = `https://${config_1.default.aws.AWS_S3_BUCKET_NAME}.s3.${config_1.default.aws.AWS_REGION}.amazonaws.com/${fileName}`;
    return {
        id: generatedId,
        type: folderName, // "image" | "video" | "others"
        url: fileUrl,
    };
});
exports.default = uploadFileToS3;
