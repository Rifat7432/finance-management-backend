import { PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import fs from 'fs';
import path from 'path';
import config from '../../config';

const s3 = new S3Client({
     region: config.aws.AWS_REGION,
     credentials: {
          accessKeyId: config.aws.AWS_ACCESS_KEY_ID!,
          secretAccessKey: config.aws.AWS_SECRET_ACCESS_KEY!,
     },
});
// 🔹 Upload local file → S3 → always remove local temp file (even on error)
const uploadFileToS3 = async (localFilePath: string) => {
     if (!fs.existsSync(localFilePath)) {
          throw new Error(`Local file not found: ${localFilePath}`);
     }

     const fileStream = fs.createReadStream(localFilePath);

     const ext = path.extname(localFilePath) || '';
     const contentType = mime.lookup(ext) || 'application/octet-stream';

     let folderName = 'others';
     if (contentType.startsWith('image/')) {
          folderName = 'image';
     } else if (contentType.startsWith('video/')) {
          folderName = 'video';
     }

     const generatedId = uuidv4();
     const fileName = `${folderName}/${generatedId}${ext || '.bin'}`;

     try {
          // Upload to S3
          const command = new PutObjectCommand({
               Bucket: config.aws.AWS_S3_BUCKET_NAME!,
               Key: fileName,
               Body: fileStream,
               ContentType: contentType,
          });

          await s3.send(command);

          // ✅ Wait for stream to close
          await new Promise<void>((resolve, reject) => {
               fileStream.on('close', resolve);
               fileStream.on('error', reject);
               fileStream.destroy();
          });

          console.log(`✅ Uploaded to S3: ${fileName}`);

          const fileUrl = `https://${config.aws.AWS_S3_BUCKET_NAME}.s3.${config.aws.AWS_REGION}.amazonaws.com/${fileName}`;

          return {
               id: generatedId,
               type: folderName,
               url: fileUrl,
          };
     } catch (error) {
          console.error('❌ Error uploading to S3:', error);
          throw error;
     } finally {
          // ✅ Always try to delete the local file, success or fail
          try {
               fs.unlinkSync(localFilePath);
               console.log(`🧹 Temp file deleted: ${localFilePath}`);
          } catch (err) {
               console.warn(`⚠️ Failed to delete temp file (${localFilePath}):`, err);
          }
     }
};

// 🔹 Delete file from S3 by its URL
const deleteFileFromS3 = async (fileUrl: string) => {
     try {
          const url = new URL(fileUrl);

          // Extract bucket and key
          const bucketName = url.hostname.split('.s3.')[0];
          const key = decodeURIComponent(url.pathname.slice(1));

          const command = new DeleteObjectCommand({
               Bucket: bucketName,
               Key: key,
          });

          await s3.send(command);

          console.log(`✅ Deleted from S3: ${key}`);
          return { success: true, key };
     } catch (error) {
          console.error('❌ Error deleting S3 file:', error);
          return { success: false, error };
     }
};

export { uploadFileToS3, deleteFileFromS3 };
