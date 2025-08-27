import express from 'express';
import { ContentController } from './content.controller';
import validateRequest from '../../middleware/validateRequest';
import { ContentValidation } from './content.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(ContentValidation.createContentZodSchema),
  ContentController.createContent
);

router.get(
  '/',
  ContentController.getContents
);

router.get(
  '/:id',
  ContentController.getSingleContent
);

router.patch(
  '/:id',
  validateRequest(ContentValidation.updateContentZodSchema),
  ContentController.updateContent
);

router.delete(
  '/:id',
  ContentController.deleteContent
);

export const ContentRouter = router;
