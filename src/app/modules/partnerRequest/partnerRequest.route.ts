import express from 'express';
import { PartnerRequestController } from './partnerRequest.controller';
import validateRequest from '../../middleware/validateRequest';
import { PartnerRequestValidation } from './partnerRequest.validation';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.post('/', auth(USER_ROLES.USER), validateRequest(PartnerRequestValidation.createPartnerRequestZodSchema), PartnerRequestController.createPartnerRequest);
router.post('/accept-request/:id', auth(USER_ROLES.USER), PartnerRequestController.acceptPartnerRequest);

router.get('/', PartnerRequestController.getPartnerRequests);

router.get('/:id', PartnerRequestController.getSinglePartnerRequest);

router.post('/unlink/:partnerId', auth(USER_ROLES.USER), PartnerRequestController.UnlinkWithPartnerRequest);

router.delete('/:id', PartnerRequestController.deletePartnerRequest);

export const PartnerRequestRouter = router;
