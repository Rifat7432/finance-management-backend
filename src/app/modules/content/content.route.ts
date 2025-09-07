import express, { NextFunction, Request, Response } from 'express';
import { ContentController } from './content.controller';
import validateRequest from '../../middleware/validateRequest';
import { ContentValidation } from './content.validation';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import { getSingleFilePath } from '../../../shared/getFilePath';

const router = express.Router();

router.post(
     '/',
     auth(USER_ROLES.ADMIN),
     fileUploadHandler(),
     (req: Request, res: Response, next: NextFunction) => {
          const image = getSingleFilePath(req.files, 'image');
          const data = JSON.parse(req.body.data);
          req.body = { image, ...data };
          next();
     },
     validateRequest(ContentValidation.createContentZodSchema),
     ContentController.createContent,
);

router.get('/', auth(USER_ROLES.ADMIN), ContentController.getContents);

router.get('/:id', auth(USER_ROLES.ADMIN), ContentController.getSingleContent);

router.patch('/:id', auth(USER_ROLES.ADMIN), validateRequest(ContentValidation.updateContentZodSchema), ContentController.updateContent);
router.delete('/:id', auth(USER_ROLES.ADMIN), ContentController.deleteContent);

export const ContentRouter = router;
