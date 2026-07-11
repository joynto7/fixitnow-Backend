import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createReviewSchema } from './reviews.validation';
import { createReview } from './reviews.controller';

export const reviewRouter = Router();
reviewRouter.post('/', authenticate, authorize('CUSTOMER'), validate(createReviewSchema), createReview);
