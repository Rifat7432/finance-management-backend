import { Request } from 'express';
import fs from 'fs';
import path from 'path';
import multer, { FileFilterCallback } from 'multer';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';


const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// S3 upload helper for images/videos
const uploadFileToS3 = async (localFilePath: string, folderName: string) => {
    const fileStream = fs.createReadStream(localFilePath);
    const fileName = path.basename(localFilePath);

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `${folderName}/${fileName}`,
        Body: fileStream,
        ACL: 'public-read', // change to private if required
    });

    await s3.send(command);

    // Delete local temp file after upload
    fs.unlinkSync(localFilePath);

    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${folderName}/${fileName}`;
};

// Multer storage for temporary staging (images/videos only)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (['image', 'video'].includes(file.fieldname)) {
            const tempDir = path.join(process.cwd(), 'uploads', 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            cb(null, tempDir);
        } else {
            // Other fields stored normally
            const otherDir = path.join(process.cwd(), 'uploads', file.fieldname || 'others');
            if (!fs.existsSync(otherDir)) fs.mkdirSync(otherDir, { recursive: true });
            cb(null, otherDir);
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = file.originalname.replace(ext, '').toLowerCase().split(' ').join('-') + '-' + Date.now();
        cb(null, name + ext);
    },
});

// File filter
const filterFilter = (req: Request, file: any, cb: FileFilterCallback) => {
    const imageTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg', 'image/webp', 'image/svg+xml'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/mpeg'];

    if (file.fieldname === 'image') {
        if (imageTypes.includes(file.mimetype)) cb(null, true);
        else cb(new AppError(StatusCodes.BAD_REQUEST, 'Invalid image format'));
    } else if (file.fieldname === 'video') {
        if (videoTypes.includes(file.mimetype)) cb(null, true);
        else cb(new AppError(StatusCodes.BAD_REQUEST, 'Invalid video format'));
    } else {
        // All other fields allowed (document, audio, etc.)
        cb(null, true);
    }
};

// Export multer upload handler
const fileUploadHandler = () =>
    multer({
        storage,
        limits: { fileSize: 100 * 1024 * 1024 },
        fileFilter: filterFilter,
    }).fields([
        { name: 'image', maxCount: 10 },
        { name: 'video', maxCount: 5 },
        { name: 'thumbnail', maxCount: 5 },
        { name: 'logo', maxCount: 5 },
        { name: 'banner', maxCount: 5 },
        { name: 'audio', maxCount: 5 },
        { name: 'document', maxCount: 10 },
        { name: 'driverLicense', maxCount: 1 },
        { name: 'insurance', maxCount: 1 },
        { name: 'permits', maxCount: 1 },
    ]);

// Move images/videos to S3 after multer saves them temporarily
export const moveImagesVideosToS3 = async (files: any) => {
    const s3Paths: Record<string, string | string[]> = {};

    for (const field of ['image', 'video']) {
        const fileField = files?.[field];
        if (fileField && Array.isArray(fileField) && fileField.length > 0) {
            if (fileField.length === 1) {
                s3Paths[field] = await uploadFileToS3(fileField[0].path, field);
            } else {
                s3Paths[field] = await Promise.all(fileField.map(f => uploadFileToS3(f.path, field)));
            }
        }
    }

    return s3Paths;
};

export default fileUploadHandler;
