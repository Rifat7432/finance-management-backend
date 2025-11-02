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
exports.deleteFileFromS3 = exports.uploadFileToS3 = void 0;
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
// 🔹 Upload local file → S3 → always remove local temp file (even on error)
const uploadFileToS3 = (localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    if (!fs_1.default.existsSync(localFilePath)) {
        throw new Error(`Local file not found: ${localFilePath}`);
    }
    const fileStream = fs_1.default.createReadStream(localFilePath);
    const ext = path_1.default.extname(localFilePath) || '';
    const contentType = mime_types_1.default.lookup(ext) || 'application/octet-stream';
    let folderName = 'others';
    if (contentType.startsWith('image/')) {
        folderName = 'image';
    }
    else if (contentType.startsWith('video/')) {
        folderName = 'video';
    }
    const generatedId = (0, uuid_1.v4)();
    const fileName = `${folderName}/${generatedId}${ext || '.bin'}`;
    try {
        // Upload to S3
        const command = new client_s3_1.PutObjectCommand({
            Bucket: config_1.default.aws.AWS_S3_BUCKET_NAME,
            Key: fileName,
            Body: fileStream,
            ContentType: contentType,
        });
        yield s3.send(command);
        // ✅ Wait for stream to close
        yield new Promise((resolve, reject) => {
            fileStream.on('close', resolve);
            fileStream.on('error', reject);
            fileStream.destroy();
        });
        console.log(`✅ Uploaded to S3: ${fileName}`);
        const fileUrl = `https://${config_1.default.aws.AWS_S3_BUCKET_NAME}.s3.${config_1.default.aws.AWS_REGION}.amazonaws.com/${fileName}`;
        return {
            id: generatedId,
            type: folderName,
            url: fileUrl,
        };
    }
    catch (error) {
        console.error('❌ Error uploading to S3:', error);
        throw error;
    }
    finally {
        // ✅ Always try to delete the local file, success or fail
        try {
            fs_1.default.unlinkSync(localFilePath);
            console.log(`🧹 Temp file deleted: ${localFilePath}`);
        }
        catch (err) {
            console.warn(`⚠️ Failed to delete temp file (${localFilePath}):`, err);
        }
    }
});
exports.uploadFileToS3 = uploadFileToS3;
// 🔹 Delete file from S3 by its URL
const deleteFileFromS3 = (fileUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = new URL(fileUrl);
        // Extract bucket and key
        const bucketName = url.hostname.split('.s3.')[0];
        const key = decodeURIComponent(url.pathname.slice(1));
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        yield s3.send(command);
        console.log(`✅ Deleted from S3: ${key}`);
        return { success: true, key };
    }
    catch (error) {
        console.error('❌ Error deleting S3 file:', error);
        return { success: false, error };
    }
});
exports.deleteFileFromS3 = deleteFileFromS3;
