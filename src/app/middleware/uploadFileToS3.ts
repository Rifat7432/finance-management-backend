import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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

// 🔹 Upload local file → S3 → remove local
const uploadFileToS3 = async (localFilePath: string) => {
     const fileStream = fs.createReadStream(localFilePath);

     // Detect extension & MIME type
     const ext = path.extname(localFilePath) || '';
     const contentType = mime.lookup(ext) || 'application/octet-stream';

     // Decide folder automatically
     let folderName = 'others';
     if (contentType.startsWith('image/')) {
          folderName = 'image';
     } else if (contentType.startsWith('video/')) {
          folderName = 'video';
     }

     // Generate unique filename
     const generatedId = uuidv4();
     const fileName = `${folderName}/${generatedId}${ext || '.bin'}`;

     const command = new PutObjectCommand({
          Bucket: config.aws.AWS_S3_BUCKET_NAME!,
          Key: fileName,
          Body: fileStream,
          ContentType: contentType,
     });

     await s3.send(command);

     // Remove local temp file
     fs.unlinkSync(localFilePath);

     const fileUrl = `https://${config.aws.AWS_S3_BUCKET_NAME}.s3.${config.aws.AWS_REGION}.amazonaws.com/${fileName}`;

     return {
          id: generatedId,
          type: folderName, // "image" | "video" | "others"
          url: fileUrl,
     };
};
export default uploadFileToS3;
