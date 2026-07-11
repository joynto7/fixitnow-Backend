import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/apiResponse';
import * as reviewService from './reviews.service';

export const createReview = catchAsync(async (req: Request, res: Response) => {
  const review = await reviewService.createReview(req.user!.id, req.body);
  sendSuccess(res, 201, 'Review created', review);
});
