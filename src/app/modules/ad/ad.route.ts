import express from 'express';
import { AdController } from './ad.controller';
import validateRequest from '../../middleware/validateRequest';
import { AdValidation } from './ad.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(AdValidation.createAdZodSchema),
  AdController.createAd
);

router.get(
  '/',
  AdController.getAds
);

router.get(
  '/:id',
  AdController.getSingleAd
);

router.patch(
  '/:id',
  validateRequest(AdValidation.updateAdZodSchema),
  AdController.updateAd
);

router.delete(
  '/:id',
  AdController.deleteAd
);

export const AdRouter = router;
